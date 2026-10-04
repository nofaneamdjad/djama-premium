/**
 * POST /api/social/ai
 * DJAMA AI pour les réseaux sociaux :
 * - generate : générer un post pour une plateforme
 * - variants : générer des variantes pour toutes les plateformes
 * - ideas    : générer des idées de contenu
 * - campaign : générer un calendrier de campagne
 * - analyze  : analyser les performances
 * - tone     : changer le ton d'un texte existant
 */
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

const PLATFORM_GUIDES: Record<string, string> = {
  instagram: "Instagram : légende 150-300 car, hashtags adaptés à la niche, accrocheur dès la 1ère ligne, CTA engageant. Pas de liens.",
  facebook:  "Facebook : 150-400 car, ton plus décontracté, peut inclure lien, encourage les partages. Accroche forte.",
  linkedin:  "LinkedIn : 400-600 car, ton professionnel et expertise, développer l'idée avec exemples, CTA vers contenu ou commentaires. Paragraphes courts.",
  tiktok:    "TikTok : légende courte 50-100 car max, hashtags tendance, appel à l'action pour les abonnements et commentaires.",
};

function buildClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Clé API Anthropic manquante");
  return new Anthropic({ apiKey, maxRetries: 0, timeout: 30_000 });
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed } = checkRateLimit(user.id, 30, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Limite 30 req/h atteinte" }, { status: 429 });

  const body = await req.json() as {
    action:    "generate" | "variants" | "ideas" | "campaign" | "tone" | "analyze";
    platform?: string;
    topic?:    string;
    content?:  string;
    tone?:     string;
    activity?: string;
    objective?:string;
    audience?: string;
    period?:   string;
    brief?:    string;
    stats?:    Record<string, unknown>[];
  };

  try {
    const ai = buildClient();

    /* ── GENERATE : un post pour une plateforme ── */
    if (body.action === "generate") {
      const guide = PLATFORM_GUIDES[body.platform ?? "instagram"] ?? PLATFORM_GUIDES.instagram;
      const prompt = `Tu es expert en marketing digital pour PME et freelances françaises.
Génère un post professionnel en français pour la plateforme suivante.
${guide}
Sujet/idée : ${(body.topic ?? "").trim() || "Présenter l'entreprise"}
${body.content ? `Contenu de départ à améliorer : ${body.content}` : ""}

Réponds UNIQUEMENT avec le texte du post. Pas d'introduction, pas de guillemets, pas d'explication.
Si des hashtags sont pertinents (Instagram/TikTok), ajoute-les après une ligne vide.`;

      const res = await ai.messages.create({
        model: "claude-haiku-4-5-20251001", max_tokens: 700,
        messages: [{ role: "user", content: prompt }],
      });
      const content = res.content[0].type === "text" ? res.content[0].text.trim() : "";
      return NextResponse.json({ content });
    }

    /* ── VARIANTS : variantes pour toutes les plateformes ── */
    if (body.action === "variants") {
      const topic = (body.topic ?? body.content ?? "").trim();
      if (!topic) return NextResponse.json({ error: "Sujet requis" }, { status: 400 });

      const prompt = `Tu es expert en marketing digital pour PME françaises.
À partir de l'idée centrale ci-dessous, génère 4 variantes adaptées à chaque réseau social.
Idée centrale : ${topic}

Génère un JSON valide avec exactement cette structure (sans markdown, sans explication) :
{
  "instagram": {"content": "...", "hashtags": ["#tag1","#tag2"]},
  "facebook":  {"content": "...", "hashtags": []},
  "linkedin":  {"content": "...", "hashtags": []},
  "tiktok":    {"content": "...", "hashtags": ["#tag1","#tag2"]}
}

Règles :
- Instagram : 150-300 car, accrocheur, 5-10 hashtags pertinents
- Facebook : 150-400 car, naturel, pas de hashtags
- LinkedIn : 400-600 car, professionnel, développé, max 3 hashtags
- TikTok : 50-100 car, dynamique, 5-8 hashtags trending`;

      const res = await ai.messages.create({
        model: "claude-haiku-4-5-20251001", max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      });
      const raw = res.content[0].type === "text" ? res.content[0].text.trim() : "{}";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      const variants = jsonMatch ? JSON.parse(jsonMatch[0]) as Record<string, unknown> : {};
      return NextResponse.json({ variants });
    }

    /* ── TONE : changer le ton ── */
    if (body.action === "tone") {
      if (!body.content) return NextResponse.json({ error: "content requis" }, { status: 400 });
      const toneMap: Record<string, string> = {
        professionnel: "professionnel et expert",
        court:         "court et percutant (max 100 mots)",
        commercial:    "commercial avec urgence et CTA fort",
        pedagogique:   "pédagogique et éducatif",
        humour:        "léger et humoristique",
        storytelling:  "narratif et storytelling",
      };
      const toneDesc = toneMap[body.tone ?? "professionnel"] ?? body.tone ?? "professionnel";
      const prompt = `Réécris ce post en français avec un ton ${toneDesc}.
Conserve l'idée principale et la longueur approximative.
Post original : ${body.content}

Réponds uniquement avec le nouveau texte, sans introduction.`;

      const res = await ai.messages.create({
        model: "claude-haiku-4-5-20251001", max_tokens: 700,
        messages: [{ role: "user", content: prompt }],
      });
      const content = res.content[0].type === "text" ? res.content[0].text.trim() : "";
      return NextResponse.json({ content });
    }

    /* ── IDEAS : calendrier de contenu ── */
    if (body.action === "ideas") {
      const prompt = `Tu es un Social Media Manager expert.
Génère 12 idées de contenu en français pour les réseaux sociaux.
Activité/secteur : ${body.activity ?? "entreprise"}
Objectif : ${body.objective ?? "notoriété et engagement"}
Audience : ${body.audience ?? "professionnels"}
Période : ${body.period ?? "1 mois"}

Réponds avec un JSON valide (sans markdown) :
{
  "ideas": [
    {
      "week": 1,
      "title": "Titre court de l'idée",
      "description": "Description en 1-2 phrases",
      "platform": "instagram|facebook|linkedin|tiktok|tous",
      "format": "carrousel|photo|texte|vidéo|reel|story",
      "suggested_date": "YYYY-MM-DD"
    }
  ]
}
Génère 3 idées par semaine sur 4 semaines.`;

      const res = await ai.messages.create({
        model: "claude-haiku-4-5-20251001", max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      });
      const raw = res.content[0].type === "text" ? res.content[0].text.trim() : "{}";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      const result = jsonMatch ? JSON.parse(jsonMatch[0]) as Record<string, unknown> : { ideas: [] };
      return NextResponse.json(result);
    }

    /* ── CAMPAIGN : générer une campagne complète ── */
    if (body.action === "campaign") {
      if (!body.brief) return NextResponse.json({ error: "brief requis" }, { status: 400 });
      const prompt = `Tu es un expert en stratégie Social Media pour PME françaises.
À partir du brief ci-dessous, génère un plan de campagne réseaux sociaux complet.
Brief : ${body.brief}

Réponds avec un JSON valide (sans markdown) :
{
  "campaign_name": "Nom de la campagne",
  "objective": "Objectif principal",
  "duration_weeks": 3,
  "platforms": ["instagram","linkedin"],
  "kpis": ["portée","engagement","clics"],
  "weeks": [
    {
      "week": 1,
      "theme": "Thème de la semaine",
      "posts": [
        {
          "day": "Lundi",
          "platform": "instagram",
          "format": "carrousel",
          "title": "Titre du post",
          "content_idea": "Idée de contenu détaillée",
          "cta": "Appel à l'action"
        }
      ]
    }
  ],
  "visual_direction": "Direction artistique recommandée",
  "hashtag_strategy": ["#hashtag1","#hashtag2"]
}`;

      const res = await ai.messages.create({
        model: "claude-haiku-4-5-20251001", max_tokens: 3000,
        messages: [{ role: "user", content: prompt }],
      });
      const raw = res.content[0].type === "text" ? res.content[0].text.trim() : "{}";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      const result = jsonMatch ? JSON.parse(jsonMatch[0]) as Record<string, unknown> : {};
      return NextResponse.json(result);
    }

    /* ── ANALYZE : analyse IA des performances ── */
    if (body.action === "analyze") {
      if (!body.stats?.length) {
        return NextResponse.json({ error: "stats requis" }, { status: 400 });
      }
      const prompt = `Tu es un analyste Social Media. Voici les données de performance des publications :
${JSON.stringify(body.stats, null, 2)}

En te basant UNIQUEMENT sur ces données, fournis une analyse en français :
1. Tendances principales observées
2. Types de contenus qui performent le mieux
3. Plateformes les plus efficaces
4. 3-5 recommandations concrètes pour améliorer les performances

Réponds en texte structuré, pas en JSON. Sois concis et factuel.`;

      const res = await ai.messages.create({
        model: "claude-haiku-4-5-20251001", max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
      });
      const analysis = res.content[0].type === "text" ? res.content[0].text.trim() : "";
      return NextResponse.json({ analysis });
    }

    return NextResponse.json({ error: "Action non reconnue" }, { status: 400 });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur IA";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
