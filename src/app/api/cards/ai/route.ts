import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime  = "nodejs";

async function getUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

type Action =
  | "bio"           // Rédiger une biographie professionnelle
  | "pitch"         // Accroche commerciale courte
  | "translate"     // Traduire le contenu
  | "improve"       // Améliorer un texte existant
  | "suggest_template" // Suggérer un modèle selon le métier
  | "suggest_cta";  // Proposer des boutons d'action

// POST /api/cards/ai
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed } = checkRateLimit(user.id, 20, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes. Réessayez dans une heure." }, { status: 429 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "IA non configurée" }, { status: 503 });

  const body = await req.json() as {
    action:    Action;
    context:   Record<string, string>;
    lang?:     string;
    targetLang?: string;
  };

  const lang = body.lang ?? "fr";
  const ctx  = body.context ?? {};

  const prompts: Record<Action, string> = {
    bio: `Tu es un expert en personal branding. Rédige une biographie professionnelle concise et impactante (3-4 phrases, max 200 mots) en ${lang} pour cette personne.
Informations : nom=${ctx.name ?? ""}, poste=${ctx.job_title ?? ""}, entreprise=${ctx.company ?? ""}, secteur=${ctx.sector ?? ""}.
Règles : utilise la troisième personne, reste factuel, ne mentionne aucune qualification non indiquée, aucun émoji.`,

    pitch: `Rédige une accroche professionnelle courte (1-2 phrases, max 80 mots) en ${lang} pour cette carte de visite.
Profil : ${ctx.name ?? ""}, ${ctx.job_title ?? ""} chez ${ctx.company ?? ""}.
L'accroche doit être mémorable, valoriser la valeur apportée, et être adaptée à un usage professionnel.`,

    translate: `Traduis ce texte professionnel en ${body.targetLang ?? "en"} : "${ctx.text ?? ""}".
Conserve le ton professionnel. Ne traduis pas les noms propres, marques ou URLs.`,

    improve: `Améliore ce texte professionnel en ${lang} : "${ctx.text ?? ""}".
Rends-le plus clair, professionnel et percutant. Conserve les faits. 150 mots maximum.`,

    suggest_template: `En fonction du profil suivant, recommande parmi ces modèles : minimaliste, entreprise, entrepreneur, consultant, creatif, commercial, luxe, corporate.
Profil : ${ctx.job_title ?? ""} dans le secteur ${ctx.sector ?? ctx.company ?? ""}.
Réponds en JSON : { "template": "nom_du_modele", "reason": "raison courte" }`,

    suggest_cta: `Propose 3 boutons d'action pertinents pour cette carte de visite professionnelle.
Profil : ${ctx.job_title ?? ""}, ${ctx.company ?? ""}.
Réponds en JSON : [{"label": "...", "icon": "nom_lucide", "action": "url|tel|mailto|link"}]`,
  };

  const prompt = prompts[body.action];
  if (!prompt) return NextResponse.json({ error: "Action invalide" }, { status: 400 });

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model:      "claude-haiku-4-5",
    max_tokens: 512,
    messages:   [{ role: "user", content: prompt }],
  });

  const text = response.content[0]?.type === "text" ? response.content[0].text : "";

  // Pour les actions JSON, parser le résultat
  if (body.action === "suggest_template" || body.action === "suggest_cta") {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        return NextResponse.json({ result: JSON.parse(jsonMatch[0]) });
      }
    } catch { /* fallback to text */ }
  }

  return NextResponse.json({ result: text.trim() });
}
