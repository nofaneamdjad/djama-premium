/**
 * POST /api/relances/ai-draft
 * Génère un brouillon de relance via Claude.
 * body: { documentId, templateLevel, language?, tone?, context? }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient }              from "@supabase/supabase-js";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";
import Anthropic                     from "@anthropic-ai/sdk";
import { checkRateLimit }            from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function getUser() {
  const store = await cookies();
  const auth  = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => store.getAll(), setAll: () => {} } },
  );
  return (await auth.auth.getUser()).data.user;
}

const TONE_MAP: Record<string, string> = {
  rappel:          "très courtois et compréhensif, ton neutre et bienveillant",
  amical:          "amical, chaleureux, compréhensif, sans pression",
  professionnel:   "professionnel, clair, neutre, factuel",
  ferme:           "ferme et clair, sans agressivité, urgent",
  dernier:         "très ferme, urgent, dernier avertissement avant action",
  mise_en_demeure: "formel et juridique, mise en demeure amiable",
};

const SYSTEM_PROMPT = `Tu rédiges des messages de relance professionnels pour des entreprises et freelances.
Adapte le ton selon le niveau demandé.
Règles strictes :
- N'invente jamais de pénalités, montants ou obligations légales non demandées
- N'affirme pas que l'envoi est fait, qu'un paiement a été reçu, ou qu'une décision judiciaire est prise
- Si "mise_en_demeure" : préciser que c'est un modèle indicatif et conseiller une vérification légale
- Vouvoiement par défaut sauf si explicitement demandé autrement
- Utiliser les variables entre {{}} telles quelles dans le texte
Retourne UNIQUEMENT un objet JSON valide sans markdown :
{ "subject": "Objet de l'email", "body": "Corps complet du message" }`;

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed } = checkRateLimit(user.id, 20, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes IA. Réessayez dans une heure." }, { status: 429 });

  const body = await req.json() as {
    documentId?:    string;
    templateLevel?: string;
    language?:      string;
    context?:       string;
    existingBody?:  string;
  };

  const level    = body.templateLevel ?? "amical";
  const language = body.language ?? "fr";
  const tone     = TONE_MAP[level] ?? "professionnel et courtois";

  // Récupérer les infos de la facture si disponible
  let docInfo = "";
  if (body.documentId) {
    const { data: doc } = await admin
      .from("documents")
      .select("numero, client_nom, client_societe, total_ttc, devise, date_echeance")
      .eq("id", body.documentId)
      .eq("user_id", user.id)
      .single();
    if (doc) {
      const daysOverdue = Math.floor((Date.now() - new Date(doc.date_echeance as string).getTime()) / 86400000);
      docInfo = `
Contexte de la facture :
- Référence : {{numero}} (${doc.numero})
- Client : {{client_nom}}${doc.client_societe ? ` / {{entreprise}}` : ""}
- Montant : {{montant}} (${doc.total_ttc} ${doc.devise || "EUR"})
- Échéance : {{date_echeance}} (retard : ${daysOverdue} jours)
- Jours de retard : {{jours_retard}}`;
    }
  }

  const langNote = language !== "fr"
    ? `\nLangue de rédaction : ${language} (tout le texte dans cette langue, variables {{}} conservées telles quelles)`
    : "";

  const userPrompt = [
    `Niveau de relance : ${level}`,
    `Ton requis : ${tone}`,
    langNote,
    docInfo,
    body.context ? `\nContexte supplémentaire : ${body.context}` : "",
    body.existingBody ? `\nAméliore ce message existant :\n${body.existingBody}` : "\nRédige un message complet.",
    "\nVariables disponibles à utiliser : {{client_nom}}, {{entreprise}}, {{numero}}, {{montant}}, {{devise}}, {{date_echeance}}, {{jours_retard}}, {{entreprise_nom}}, {{entreprise_email}}",
    "\nJSON uniquement.",
  ].filter(Boolean).join("\n");

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "Service IA indisponible. Utilisez un modèle classique." }, { status: 503 });
  }

  try {
    const ai  = new Anthropic({ apiKey, maxRetries: 1, timeout: 30_000 });
    const res = await ai.messages.create({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system:     SYSTEM_PROMPT,
      messages:   [{ role: "user", content: userPrompt }],
    });

    const raw   = res.content[0].type === "text" ? res.content[0].text.trim() : "{}";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Réponse IA invalide");

    const { subject, body: msgBody } = JSON.parse(match[0]) as { subject: string; body: string };
    return NextResponse.json({ subject, body: msgBody, level, language });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: `Erreur IA : ${msg}. Utilisez un modèle classique.` }, { status: 500 });
  }
}
