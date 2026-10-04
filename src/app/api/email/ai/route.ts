import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getUser() {
  const cs = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cs.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

function buildClient() {
  const k = process.env.ANTHROPIC_API_KEY;
  if (!k) throw new Error("Clé API Anthropic manquante");
  return new Anthropic({ apiKey: k, maxRetries: 0, timeout: 30_000 });
}

/* POST /api/email/ai
   actions : generate | rewrite | subject | analyze | automation
*/
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed } = checkRateLimit(user.id, 30, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Limite 30 req/h atteinte" }, { status: 429 });

  const body = await req.json() as {
    action:   "generate" | "rewrite" | "subject" | "analyze" | "automation";
    brief?:   string;
    content?: string;
    tone?:    string;
    stats?:   Record<string, unknown>;
  };

  try {
    const ai = buildClient();

    /* ── GENERATE : email complet depuis un brief ── */
    if (body.action === "generate") {
      if (!body.brief?.trim()) return NextResponse.json({ error: "brief requis" }, { status: 400 });
      const prompt = `Tu es expert en email marketing pour PME françaises.
À partir du brief suivant, génère un email marketing professionnel complet en français.
Brief : ${body.brief}

Réponds avec un JSON valide (sans markdown) :
{
  "subject": "Objet de l'email (60 car max, accrocheur)",
  "preheader": "Prévisualisation (90 car max)",
  "blocks": [
    {"type":"title","content":"Titre principal accrocheur"},
    {"type":"text","content":"Corps du message..."},
    {"type":"button","label":"CTA principal","url":"{{cta_url}}"},
    {"type":"text","content":"Paragraphe de clôture..."},
    {"type":"footer","content":"Vous recevez cet email car vous êtes inscrit à notre liste. <unsubscribe>Se désabonner</unsubscribe>"}
  ]
}
Types de blocs disponibles : title, text, button, image, separator, spacer, footer.
Inclure TOUJOURS un bloc footer avec le lien de désabonnement.
Variables disponibles : {{first_name}}, {{company_name}}, {{cta_url}}.`;

      const res = await ai.messages.create({
        model: "claude-haiku-4-5-20251001", max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      });
      const raw = res.content[0].type === "text" ? res.content[0].text.trim() : "{}";
      const match = raw.match(/\{[\s\S]*\}/);
      const result = match ? JSON.parse(match[0]) as Record<string, unknown> : {};
      return NextResponse.json(result);
    }

    /* ── REWRITE : réécrire un bloc avec ton ── */
    if (body.action === "rewrite") {
      if (!body.content?.trim()) return NextResponse.json({ error: "content requis" }, { status: 400 });
      const toneMap: Record<string, string> = {
        professionnel: "professionnel et expert",
        court:         "plus court et percutant",
        commercial:    "commercial avec urgence et CTA",
        persuasif:     "persuasif et convaincant",
        amical:        "amical et chaleureux",
        corriger:      "grammaticalement correct",
      };
      const toneDesc = toneMap[body.tone ?? "professionnel"] ?? body.tone ?? "professionnel";
      const res = await ai.messages.create({
        model: "claude-haiku-4-5-20251001", max_tokens: 600,
        messages: [{ role: "user", content: `Réécris ce texte en français avec un ton ${toneDesc}. Conserve le sens. Réponds uniquement avec le texte réécrit, sans introduction.\n\nTexte original :\n${body.content}` }],
      });
      const content = res.content[0].type === "text" ? res.content[0].text.trim() : "";
      return NextResponse.json({ content });
    }

    /* ── SUBJECT : générer des variantes d'objet ── */
    if (body.action === "subject") {
      if (!body.brief?.trim()) return NextResponse.json({ error: "brief requis" }, { status: 400 });
      const res = await ai.messages.create({
        model: "claude-haiku-4-5-20251001", max_tokens: 400,
        messages: [{ role: "user", content: `Génère 5 variantes d'objet d'email marketing en français pour cette campagne. Chaque objet doit être unique, accrocheur, < 60 caractères.
Campagne : ${body.brief}
Réponds en JSON : {"subjects": ["...", "...", "...", "...", "..."]}` }],
      });
      const raw = res.content[0].type === "text" ? res.content[0].text.trim() : "{}";
      const match = raw.match(/\{[\s\S]*\}/);
      return NextResponse.json(match ? JSON.parse(match[0]) : { subjects: [] });
    }

    /* ── ANALYZE : analyse des performances ── */
    if (body.action === "analyze") {
      if (!body.stats) return NextResponse.json({ error: "stats requis" }, { status: 400 });
      const res = await ai.messages.create({
        model: "claude-haiku-4-5-20251001", max_tokens: 800,
        messages: [{ role: "user", content: `Tu es analyste email marketing. Analyse ces données de performance et fournis des insights actionnables en français.
Données : ${JSON.stringify(body.stats, null, 2)}

Note : Le taux d'ouverture peut être biaisé par les protections de confidentialité des clients mail (Apple Mail Privacy Protection, etc.). Mentionne cette nuance.

Fournis une analyse structurée avec :
1. Points forts observés
2. Points à améliorer
3. 3 recommandations concrètes
4. Prochain sujet recommandé basé sur ces données

Réponds en texte structuré, pas en JSON.` }],
      });
      const analysis = res.content[0].type === "text" ? res.content[0].text.trim() : "";
      return NextResponse.json({ analysis });
    }

    /* ── AUTOMATION : générer un workflow depuis un brief ── */
    if (body.action === "automation") {
      if (!body.brief?.trim()) return NextResponse.json({ error: "brief requis" }, { status: 400 });
      const res = await ai.messages.create({
        model: "claude-haiku-4-5-20251001", max_tokens: 1500,
        messages: [{ role: "user", content: `Tu es expert en email automation. Crée un workflow d'automatisation email pour cette situation.
Brief : ${body.brief}

Réponds en JSON valide (sans markdown) :
{
  "name": "Nom du workflow",
  "trigger_type": "new_contact|contact_tag|purchase|invoice|form_submit|date",
  "trigger_config": {"description": "..."},
  "steps": [
    {"step_type": "send_email", "config": {"subject": "...", "description": "..."}},
    {"step_type": "wait", "config": {"days": 2}},
    {"step_type": "condition", "config": {"condition": "no_purchase", "yes_label": "Sans achat", "no_label": "Avec achat"}},
    {"step_type": "send_email", "config": {"subject": "...", "description": "..."}}
  ]
}
Types d'étapes : send_email, wait, condition, add_tag, remove_tag, create_task, notify_member.` }],
      });
      const raw = res.content[0].type === "text" ? res.content[0].text.trim() : "{}";
      const match = raw.match(/\{[\s\S]*\}/);
      const result = match ? JSON.parse(match[0]) as Record<string, unknown> : {};
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Action non reconnue" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur IA";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
