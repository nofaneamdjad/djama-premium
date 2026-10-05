/**
 * POST /api/blog/generate
 * Génère ou transforme du contenu de blog via Claude.
 * Body : { type, title?, content?, tags?, selectedText? }
 * Types : "content" | "excerpt" | "improve" | "rewrite" | "expand" | "summarize" | "simplify" | "translate_en"
 * Retourne : { result: string }
 */
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { checkRateLimitAsync as checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

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
  const { allowed } = await checkRateLimit(user.id, 10, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes. Réessayez dans une heure." }, { status: 429 });

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return NextResponse.json({ error: "IA non configurée" }, { status: 503 });

  const { type, title, content, tags, selectedText, seoTitle, seoDesc, focusKeyword } = await req.json() as {
    type: "content" | "excerpt" | "improve" | "rewrite" | "expand" | "summarize" | "simplify" | "translate_en" | "seo_tips";
    title?: string;
    content?: string;
    tags?: string[];
    selectedText?: string;
    seoTitle?: string;
    seoDesc?: string;
    focusKeyword?: string;
  };

  try {
    const ai = new Anthropic({ apiKey, maxRetries: 0, timeout: 45_000 });

    if (type === "excerpt") {
      if (!content?.trim()) return NextResponse.json({ error: "Contenu requis" }, { status: 400 });
      const res = await ai.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        messages: [{
          role: "user",
          content: `Génère un extrait/résumé de 2-3 phrases percutantes pour cet article de blog. Réponds uniquement avec le texte de l'extrait, sans guillemets ni introduction.\n\nTitre : ${title ?? ""}\n\nContenu :\n${content.slice(0, 3000)}`,
        }],
      });
      const result = res.content[0].type === "text" ? res.content[0].text.trim() : "";
      return NextResponse.json({ result });
    }

    if (type === "content") {
      if (!title?.trim()) return NextResponse.json({ error: "Titre requis" }, { status: 400 });
      const tagHint = tags?.length ? `\nThématiques : ${tags.join(", ")}` : "";
      const res = await ai.messages.create({
        model: "claude-sonnet-5",
        max_tokens: 2000,
        system: `Tu es un expert en content marketing pour entrepreneurs français.
Tu rédiges des articles de blog professionnels, engageants et optimisés SEO.
Structure toujours tes articles avec : une introduction accrocheuse, 3-4 sections avec titres H2 (##), une conclusion avec appel à l'action.
Utilise le Markdown. Écris en français. Ton : professionnel mais accessible.`,
        messages: [{
          role: "user",
          content: `Rédige un article de blog complet et détaillé (600-900 mots) sur ce sujet :\n\n**${title}**${tagHint}\n\nL'article doit apporter une vraie valeur ajoutée, avec des conseils concrets et actionnables.`,
        }],
      });
      const result = res.content[0].type === "text" ? res.content[0].text.trim() : "";
      return NextResponse.json({ result });
    }

    /* ── Transformations sur sélection ─────────────────────────────────── */
    const SELECTION_PROMPTS: Record<string, string> = {
      improve:      "Améliore ce passage pour le rendre plus percutant, professionnel et engageant, sans en changer le sens. Réponds uniquement avec le texte amélioré, sans introduction ni explication.",
      rewrite:      "Reformule ce passage en conservant exactement le même sens mais avec des mots et une structure différents. Réponds uniquement avec le texte reformulé, sans introduction.",
      expand:       "Développe et enrichis ce passage avec plus de détails, d'exemples concrets et d'explications. Garde le même style et le même sujet. Réponds uniquement avec le texte développé.",
      summarize:    "Condense ce passage en 1-2 phrases en gardant uniquement l'essentiel. Réponds uniquement avec le texte condensé, sans introduction.",
      simplify:     "Simplifie ce passage pour le rendre plus clair et accessible, en évitant le jargon complexe. Réponds uniquement avec le texte simplifié.",
      translate_en: "Traduis ce passage en anglais professionnel et naturel. Réponds uniquement avec la traduction, sans introduction.",
    };

    if (SELECTION_PROMPTS[type]) {
      if (!selectedText?.trim()) return NextResponse.json({ error: "Texte sélectionné requis" }, { status: 400 });
      const res = await ai.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 800,
        system: "Tu es un assistant d'écriture expert pour les entrepreneurs francophones.",
        messages: [{
          role: "user",
          content: `${SELECTION_PROMPTS[type]}\n\n---\n${selectedText.slice(0, 4000)}`,
        }],
      });
      const result = res.content[0].type === "text" ? res.content[0].text.trim() : "";
      return NextResponse.json({ result });
    }

    /* ── Analyse SEO ────────────────────────────────────────────────────── */
    if (type === "seo_tips") {
      if (!content?.trim() && !title?.trim()) return NextResponse.json({ error: "Contenu ou titre requis" }, { status: 400 });
      const kwLine = focusKeyword ? `\nMot-clé cible : "${focusKeyword}"` : "";
      const res = await ai.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 600,
        system: "Tu es un expert SEO pour les entrepreneurs francophones. Tu donnes des recommandations concrètes, brèves et actionnables.",
        messages: [{
          role: "user",
          content: `Analyse le SEO de cet article et donne exactement 5 recommandations courtes et actionnables (1-2 phrases chacune). Réponds en JSON : { "tips": ["...", "...", "...", "...", "..."] }${kwLine}

Titre : ${title ?? ""}
Titre SEO : ${seoTitle ?? ""}
Meta desc. : ${seoDesc ?? ""}
Contenu (extrait) : ${(content ?? "").slice(0, 2000)}`,
        }],
      });
      try {
        const raw = res.content[0].type === "text" ? res.content[0].text.trim() : "{}";
        const json = JSON.parse(raw.replace(/^```json\n?/, "").replace(/\n?```$/, ""));
        return NextResponse.json({ tips: json.tips ?? [] });
      } catch {
        return NextResponse.json({ tips: [] });
      }
    }

    return NextResponse.json({ error: "Type invalide" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Erreur IA" }, { status: 500 });
  }
}
