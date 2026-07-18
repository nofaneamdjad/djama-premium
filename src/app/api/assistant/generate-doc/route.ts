import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-haiku-4-5-20251001";

const EXTRACT_PROMPT = `Tu es un assistant d'extraction de données. À partir d'une demande en langage naturel, tu extrais les informations pour générer un document professionnel (facture ou devis).

Retourne UNIQUEMENT un objet JSON valide (sans markdown, sans code block, sans commentaires). Structure :

{
  "type": "invoice" | "quote",
  "reference": string,
  "issue_date": "YYYY-MM-DD",
  "due_date": "YYYY-MM-DD | null",
  "client_name": string,
  "client_email": string,
  "client_phone": string | null,
  "client_company": string | null,
  "client_address": string | null,
  "subject": string,
  "items": [{ "description": string, "quantity": number, "unit_price": number, "total": number }],
  "tax_rate": number,
  "subtotal": number,
  "tax_amount": number,
  "total": number,
  "notes": string | null
}

Règles :
- "facture" / "invoice" / "créer une facture" → type = "invoice", référence format F-YYYY-NNN
- "devis" / "quote" / "proposition" → type = "quote", référence format D-YYYY-NNN
- TVA 20% par défaut si non précisée
- Si montant global sans détail : créer un seul item avec ce montant HT
- Calcule subtotal = somme des totaux HT des items
- Calcule tax_amount = subtotal × tax_rate / 100
- Calcule total = subtotal + tax_amount
- Si aucun email client mentionné : client_email = ""
- Génère un numéro de référence aléatoire (ex: F-2026-042)
`;

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Clé API manquante." }, { status: 500 });

  let body: { prompt: string };
  try {
    body = await req.json() as { prompt: string };
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  if (!body.prompt?.trim()) {
    return NextResponse.json({ error: "Prompt vide." }, { status: 400 });
  }

  const client = new Anthropic({ apiKey, maxRetries: 0, timeout: 15_000 });
  const today = new Date().toISOString().slice(0, 10);

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: EXTRACT_PROMPT,
      messages: [{ role: "user", content: `Date du jour : ${today}\n\nDemande : ${body.prompt}` }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    const cleaned = text.replace(/^```(?:json)?\s*/m, "").replace(/\s*```$/m, "").trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Impossible d'analyser la réponse IA." }, { status: 422 });
    }

    return NextResponse.json({ docData: parsed });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
