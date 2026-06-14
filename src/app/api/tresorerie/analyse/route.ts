/**
 * POST /api/tresorerie/analyse
 * Analyse IA de la trésorerie (Claude claude-haiku-4-5) — Resend pour rapport optionnel
 */
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createLogger } from "@/lib/logger";

export const runtime = "nodejs";

const log = createLogger("tresorerie/analyse");

// Rate limit : 20 analyses IA/user/heure
const analyseLimits = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(userId: string): boolean {
  const now  = Date.now();
  const slot = analyseLimits.get(userId);
  if (!slot || now > slot.resetAt) {
    analyseLimits.set(userId, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (slot.count >= 20) return false;
  slot.count++;
  return true;
}

const SYSTEM = `\
Tu es un expert-comptable et conseiller financier pour freelances et TPE françaises.
Analyse les données de trésorerie fournies et retourne UN objet JSON valide (sans markdown) :
{
  "score": <0-100 score de santé financière>,
  "titre": "<titre court du diagnostic>",
  "resume": "<2-3 phrases résumant la situation>",
  "points_forts": ["<point 1>", "<point 2>"],
  "alertes": ["<alerte 1 si nécessaire>"],
  "recommandations": ["<action 1>", "<action 2>", "<action 3>"],
  "projection": "<tendance estimée pour le mois prochain>"
}
Sois concret, pragmatique, et utilise des chiffres précis issus des données.`;

export async function POST(req: NextRequest) {
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
    return NextResponse.json({ error: "Limite analyse atteinte : 20 par heure." }, { status: 429 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Clé API manquante" }, { status: 500 });

  try {
    const body = await req.json() as {
      revenus:    number;
      depenses:   number;
      solde:      number;
      impaye:     number;
      nb_impaye:  number;
      mois:       string;
      top_depenses: { cat: string; total: number }[];
    };

    const prompt = `
Données de trésorerie — ${body.mois} :
- Revenus facturés : ${body.revenus.toFixed(2)} €
- Dépenses totales : ${body.depenses.toFixed(2)} €
- Solde net : ${body.solde.toFixed(2)} €
- Factures impayées : ${body.nb_impaye} facture(s) → ${body.impaye.toFixed(2)} €

Répartition des dépenses :
${body.top_depenses.map(d => `  ${d.cat}: ${d.total.toFixed(2)} €`).join("\n")}

Génère l'analyse complète en JSON.`;

    const client = new Anthropic({ apiKey, maxRetries: 0, timeout: 20_000 });
    const response = await client.messages.create({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system:     SYSTEM,
      messages:   [{ role: "user", content: prompt }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text.trim() : "{}";

    // Extraction JSON robuste : chercher le premier objet complet
    const start = raw.indexOf("{");
    const end   = raw.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("Réponse non-JSON");

    return NextResponse.json(JSON.parse(raw.slice(start, end + 1)));
  } catch (err) {
    log.error("analyse error", err);
    return NextResponse.json({ error: "Erreur analyse IA" }, { status: 500 });
  }
}
