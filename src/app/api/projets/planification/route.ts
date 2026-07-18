import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT = `Tu es un expert en gestion et planification de projets. À partir d'une description, tu génères un plan de projet structuré, réaliste et détaillé.

Retourne UNIQUEMENT un objet JSON valide (sans markdown, sans code block, sans commentaires) :
{
  "titre": string,
  "description": string,
  "category": "Design"|"Développement"|"Marketing"|"Conseil"|"Rédaction"|"Comptabilité"|"Juridique"|"Autre",
  "color": string,
  "debut": "YYYY-MM-DD",
  "fin": "YYYY-MM-DD",
  "phases": [
    { "titre": string, "debut": "YYYY-MM-DD", "fin": "YYYY-MM-DD", "color": string }
  ],
  "jalons": [
    { "titre": string, "date": "YYYY-MM-DD" }
  ],
  "taches": [
    { "titre": string }
  ]
}

Règles :
- 3 à 6 phases réalistes et chronologiques (elles peuvent se chevaucher)
- 3 à 6 jalons aux moments clés (fins de phase, livraisons, validations)
- 6 à 14 tâches concrètes et actionnables
- Les dates de début/fin du projet encadrent toutes les phases
- Color hex selon catégorie : Design=#ec4899, Développement=#3b82f6, Marketing=#f59e0b, Conseil=#10b981, Rédaction=#06b6d4, Autre=#8b5cf6
- Chaque phase a sa propre couleur (variante de la couleur principale)
- Si un délai est précisé, respecte-le strictement
- Si une date de début est fournie, utilise-la comme point de départ`;

export interface PlanPhase  { titre:string; debut:string; fin:string; color:string; }
export interface PlanJalon  { titre:string; date:string; }
export interface PlanTache  { titre:string; }
export interface PlanProjet {
  titre:string; description:string; category:string; color:string;
  debut:string; fin:string;
  phases:PlanPhase[]; jalons:PlanJalon[]; taches:PlanTache[];
}

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

  let body: { description: string; nom?: string; budget?: string; delai?: string; debut?: string };
  try {
    body = await req.json() as typeof body;
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  if (!body.description?.trim()) {
    return NextResponse.json({ error: "Description vide." }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const lines = [
    `Date d'aujourd'hui : ${today}`,
    body.nom    ? `Nom du projet : ${body.nom}`         : null,
    `Description : ${body.description}`,
    body.budget ? `Budget : ${body.budget}`             : null,
    body.delai  ? `Délai souhaité : ${body.delai}`      : null,
    body.debut  ? `Date de début souhaitée : ${body.debut}` : null,
  ].filter(Boolean).join("\n");

  const client = new Anthropic({ apiKey, maxRetries: 0, timeout: 30_000 });

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: lines }],
    });

    const text    = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    const cleaned = text.replace(/^```(?:json)?\s*/m, "").replace(/\s*```$/m, "").trim();

    let parsed: PlanProjet;
    try {
      parsed = JSON.parse(cleaned) as PlanProjet;
    } catch {
      return NextResponse.json({ error: "Impossible d'analyser la réponse IA." }, { status: 422 });
    }

    return NextResponse.json({ plan: parsed });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
