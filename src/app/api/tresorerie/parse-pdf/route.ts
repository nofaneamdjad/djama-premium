/**
 * POST /api/tresorerie/parse-pdf
 * Analyse un relevé bancaire PDF avec Claude et extrait les transactions.
 * Body : multipart/form-data  { file: File (PDF, max 10 Mo) }
 * Response : { transactions: ParsedTx[], total: number }
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime     = "nodejs";
export const maxDuration = 60; // Vercel Pro : 60 s

interface ParsedTx {
  date:           string;   // YYYY-MM-DD
  label:          string;
  amount:         number;   // toujours positif
  type:           "income" | "expense";
  category:       string;
  status:         "completed";
  payment_method: "virement";
  currency:       string;
}

const VALID_CATS = new Set([
  "client","abonnement","vente","subvention",
  "salaires","fournisseurs","logiciels","marketing",
  "transport","taxes","bancaires","autre",
]);

// Rate limit : 5 imports PDF/user/heure (Opus est coûteux)
const pdfLimits = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(userId: string): boolean {
  const now  = Date.now();
  const slot = pdfLimits.get(userId);
  if (!slot || now > slot.resetAt) {
    pdfLimits.set(userId, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (slot.count >= 5) return false;
  slot.count++;
  return true;
}

const SYSTEM_PROMPT = `\
Tu es un expert-comptable spécialisé en relevés bancaires français.
Ta seule tâche : extraire toutes les lignes de transaction d'un relevé bancaire PDF.

Règles absolues :
1. Retourne UNIQUEMENT un tableau JSON valide — aucun texte avant, aucun après, aucun markdown.
2. Chaque objet doit avoir exactement ces clés :
   - date      : string "YYYY-MM-DD"
   - label     : string (libellé exact de la ligne)
   - amount    : number strictement positif (montant sans signe ni symbole)
   - type      : "income" (crédit/entrée) ou "expense" (débit/sortie)
   - category  : une valeur parmi : client, abonnement, vente, subvention, salaires, fournisseurs, logiciels, marketing, transport, taxes, bancaires, autre
3. Ignore les lignes de solde, de report, les en-têtes et les totaux.
4. Si la date est absente, utilise la date la plus proche connue.
5. Catégorisation suggérée :
   - Virements reçus / clients       → income / client
   - Prélèvements SaaS / abonnements → expense / logiciels ou abonnement
   - Salaires versés                 → expense / salaires
   - TVA / URSSAF / impôts           → expense / taxes
   - Frais CB / agios / commissions  → expense / bancaires
   - Achats fournisseurs             → expense / fournisseurs

Exemple de sortie valide (2 lignes) :
[
  {"date":"2024-03-05","label":"VIR DUPONT & ASSOCIES","amount":3500.00,"type":"income","category":"client"},
  {"date":"2024-03-10","label":"PRELEVEMENT STRIPE","amount":42.50,"type":"expense","category":"bancaires"}
]`;

export async function POST(req: NextRequest): Promise<NextResponse> {
  /* ── Auth ── */
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  if (!checkRateLimit(user.id)) {
    return NextResponse.json({ error: "Limite atteinte : 5 imports PDF par heure." }, { status: 429 });
  }

  /* ── Clé API ── */
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY non configuré — ajoutez-le dans Vercel → Settings → Environment Variables" },
      { status: 500 },
    );
  }

  /* ── Lire le fichier depuis le form ── */
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Impossible de lire le fichier (form-data invalide)" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Fichier PDF manquant dans le formulaire" }, { status: 400 });
  }

  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    return NextResponse.json({ error: "Seuls les fichiers PDF sont acceptés" }, { status: 400 });
  }

  const MAX_BYTES = 10 * 1024 * 1024; // 10 Mo
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Fichier trop volumineux — maximum 10 Mo" }, { status: 413 });
  }

  /* ── Convertir en base64 ── */
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  /* ── Appel Claude avec support natif PDF ── */
  const client = new Anthropic({ apiKey, maxRetries: 0, timeout: 55_000 });

  let rawText = "";
  try {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const response = await (client as any).beta.messages.create({
      model:      "claude-opus-4-5",
      max_tokens: 4096,
      betas:      ["pdfs-2024-09-25"],
      system:     SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type:       "base64",
                media_type: "application/pdf",
                data:       base64,
              },
            },
            {
              type: "text",
              text: "Extrait toutes les transactions de ce relevé bancaire.",
            },
          ],
        },
      ],
    }) as { content: Array<{ type: string; text?: string }> };
    /* eslint-enable */

    rawText = response.content.find(b => b.type === "text")?.text?.trim() ?? "";
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur API Anthropic";
    console.error("[parse-pdf] Claude error:", err);
    return NextResponse.json({ error: `Erreur IA : ${msg}` }, { status: 502 });
  }

  /* ── Parser le JSON retourné par Claude ── */
  const jsonMatch = rawText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.error("[parse-pdf] No JSON array in response:", rawText.slice(0, 300));
    return NextResponse.json(
      { error: "L'IA n'a pas pu identifier de transactions dans ce document. Vérifiez que le PDF est bien un relevé bancaire." },
      { status: 422 },
    );
  }

  let parsed: unknown[];
  try {
    parsed = JSON.parse(jsonMatch[0]) as unknown[];
  } catch {
    return NextResponse.json({ error: "Réponse IA mal formée (JSON invalide)" }, { status: 422 });
  }

  /* ── Valider et normaliser chaque transaction ── */
  const transactions: ParsedTx[] = [];
  for (const raw of parsed) {
    if (!raw || typeof raw !== "object") continue;
    const t = raw as Record<string, unknown>;

    const date   = typeof t.date   === "string" ? t.date   : "";
    const label  = typeof t.label  === "string" ? t.label.trim()  : "";
    const amount = Number(t.amount);
    const type   = t.type === "income" || t.type === "expense" ? t.type : null;
    const cat    = typeof t.category === "string" && VALID_CATS.has(t.category) ? t.category : "autre";

    if (!date || !label || isNaN(amount) || amount <= 0 || !type) continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;

    transactions.push({
      date,
      label,
      amount,
      type,
      category:       cat,
      status:         "completed",
      payment_method: "virement",
      currency:       "EUR",
    });
  }

  if (transactions.length === 0) {
    return NextResponse.json(
      { error: "Aucune transaction valide trouvée — le document ne semble pas être un relevé bancaire standard." },
      { status: 422 },
    );
  }

  transactions.sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({ transactions, total: transactions.length });
}
