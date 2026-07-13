/**
 * POST /api/blog/generate
 * Génère du contenu de blog via Claude.
 * Body : { type: "content" | "excerpt", title?: string, content?: string, tags?: string[] }
 * Retourne : { result: string }
 */
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return NextResponse.json({ error: "IA non configurée" }, { status: 503 });

  const { type, title, content, tags } = await req.json() as {
    type: "content" | "excerpt";
    title?: string;
    content?: string;
    tags?: string[];
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

    return NextResponse.json({ error: "Type invalide" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Erreur IA" }, { status: 500 });
  }
}
