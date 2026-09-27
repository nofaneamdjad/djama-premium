/**
 * POST /api/contrats/analyse
 *
 * Analyse IA d'un contrat existant — serveur uniquement.
 * Le client envoie uniquement l'ID du contrat ; toutes les données
 * sont chargées côté serveur via RLS (jamais de confiance aux données client).
 *
 * Retourne :
 *   { score, summary, risks, suggestions, compliance, disclaimer }
 *
 * Rate limit : 10 analyses/user/heure (checkRateLimitAsync — persistant).
 */

import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";
import { checkRateLimitAsync } from "@/lib/rate-limit";

export const runtime  = "nodejs";
export const dynamic  = "force-dynamic";

const MODEL = "claude-haiku-4-5-20251001";

const BodySchema = z.object({
  contract_id: z.string().uuid("contract_id doit être un UUID valide"),
});

/* ─────────────────────────────────────────────────────────
   TYPE DE RETOUR
───────────────────────────────────────────────────────── */
export type ContractAnalysisResult = {
  score:       number;
  summary:     string;
  risks:       string[];
  suggestions: string[];
  compliance:  { label: string; ok: boolean }[];
  disclaimer:  string;
};

/* ─────────────────────────────────────────────────────────
   PROMPT SYSTÈME
───────────────────────────────────────────────────────── */
const SYSTEM_PROMPT = `Tu es un assistant juridique qui aide à identifier les points d'attention dans des contrats professionnels.

LIMITES IMPORTANTES que tu dois toujours respecter :
- Tu fournis une ASSISTANCE, pas un avis juridique professionnel
- Tu ne garantis pas la conformité légale du contrat
- Pour tout engagement significatif, un juriste ou avocat doit être consulté

MISSION : Analyser le contrat fourni et retourner UNIQUEMENT un objet JSON valide, sans markdown, sans texte avant ou après.

FORMAT DE RÉPONSE OBLIGATOIRE :
{
  "score": <entier 0-100, basé sur complétude et cohérence structurelle>,
  "summary": "<résumé analytique neutre en 1-2 phrases, 40-80 mots>",
  "risks": ["<risque 1>", "<risque 2>", ...],
  "suggestions": ["<suggestion 1>", "<suggestion 2>", ...],
  "compliance": [
    {"label": "Parties identifiées", "ok": true|false},
    {"label": "Objet du contrat défini", "ok": true|false},
    {"label": "Montant précisé", "ok": true|false},
    {"label": "Durée déterminée", "ok": true|false},
    {"label": "Clause de confidentialité", "ok": true|false},
    {"label": "Juridiction définie", "ok": true|false},
    {"label": "Clause de résiliation", "ok": true|false},
    {"label": "Force majeure mentionnée", "ok": true|false}
  ]
}

RÈGLES :
- 2 à 5 risques maximum, formulés précisément
- 3 à 5 suggestions concrètes et actionnables
- Le score reflète la complétude structurelle (présence des clauses essentielles), pas la qualité rédactionnelle
- Retourner {} si le contrat est vide ou illisible`;

/* ─────────────────────────────────────────────────────────
   HANDLER
───────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  /* ── Auth ── */
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  /* ── Rate limit (10/h/user) ── */
  const { allowed } = await checkRateLimitAsync(`contrats-analyse:${user.id}`, 10, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Limite atteinte : 10 analyses par heure. Réessayez plus tard." },
      { status: 429 }
    );
  }

  /* ── Validation ── */
  let contractId: string;
  try {
    const raw = await req.json();
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "contract_id invalide." }, { status: 400 });
    }
    contractId = parsed.data.contract_id;
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  /* ── Chargement serveur du contrat (RLS) ── */
  const { data: contract, error: dbError } = await supabase
    .from("contracts")
    .select("id, title, client_name, contract_type, content, amount, start_date, end_date, jurisdiction, specific_clauses")
    .eq("id", contractId)
    .eq("user_id", user.id)
    .single();

  if (dbError || !contract) {
    return NextResponse.json({ error: "Contrat introuvable ou accès refusé." }, { status: 404 });
  }

  if (!contract.content || contract.content.trim().length < 50) {
    return NextResponse.json(
      { error: "Le contrat est vide ou trop court pour être analysé." },
      { status: 422 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Service IA temporairement indisponible." },
      { status: 503 }
    );
  }

  /* ── Prompt utilisateur — données isolées des instructions ── */
  const userPrompt = [
    "<contrat_metadata>",
    `Titre : ${contract.title}`,
    `Type : ${contract.contract_type ?? "non précisé"}`,
    `Client : ${contract.client_name}`,
    contract.amount    ? `Montant : ${contract.amount} EUR HT` : "Montant : non précisé",
    contract.start_date ? `Début : ${contract.start_date}`  : null,
    contract.end_date   ? `Fin : ${contract.end_date}`      : null,
    contract.jurisdiction ? `Juridiction : ${contract.jurisdiction}` : null,
    "</contrat_metadata>",
    "",
    "<contrat_texte>",
    contract.content.substring(0, 8000),  // limite raisonnable
    "</contrat_texte>",
    "",
    "Analyse ce contrat et retourne le JSON demandé.",
  ].filter(Boolean).join("\n");

  /* ── Appel API ── */
  const anthropic = new Anthropic({ apiKey, maxRetries: 0, timeout: 20_000 });

  try {
    const message = await anthropic.messages.create({
      model:      MODEL,
      max_tokens: 1200,
      system:     SYSTEM_PROMPT,
      messages:   [{ role: "user", content: userPrompt }],
    });

    const block = message.content[0];
    if (block.type !== "text") {
      return NextResponse.json(
        { error: "Réponse inattendue du service IA." },
        { status: 503 }
      );
    }

    let parsed: Partial<ContractAnalysisResult>;
    try {
      // Extraire le premier objet JSON de la réponse (robuste face aux préambules et suffixes du modèle)
      const raw = block.text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("no JSON object found");
      parsed = JSON.parse(jsonMatch[0]) as Partial<ContractAnalysisResult>;
    } catch {
      return NextResponse.json(
        { error: "Le service IA a retourné une réponse inattendue. Réessayez." },
        { status: 503 }
      );
    }

    const result: ContractAnalysisResult = {
      score:       typeof parsed.score === "number" ? Math.min(100, Math.max(0, parsed.score)) : 0,
      summary:     typeof parsed.summary === "string" ? parsed.summary : "Analyse non disponible.",
      risks:       Array.isArray(parsed.risks) ? parsed.risks.slice(0, 5) : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 5) : [],
      compliance:  Array.isArray(parsed.compliance) ? parsed.compliance : [],
      disclaimer:  "Cette analyse est une assistance automatique. Elle ne constitue pas un avis juridique et ne remplace pas la consultation d'un avocat ou d'un juriste.",
    };

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("timeout") || msg.includes("ECONNRESET")) {
      return NextResponse.json(
        { error: "Le service IA n'a pas répondu à temps. Réessayez dans quelques instants." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Service IA temporairement indisponible." },
      { status: 503 }
    );
  }
}
