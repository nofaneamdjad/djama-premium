// Génération de site par IA — décrit ton activité, Claude crée le site
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { checkRateLimitAsync as checkRateLimit } from "@/lib/rate-limit";
import {
  buildGeneratePrompt,
  parseAiJson,
  sanitizeGenerateResponse,
  type AiGenerateResponse,
} from "@/lib/website-builder/ai-prompts";
import { getSectionMeta } from "@/lib/website-builder/sections-meta";
import type { SectionType } from "@/lib/website-builder/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

// POST /api/websites/ai/generate
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed } = await checkRateLimit(user.id, 5, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Limite atteinte (5 générations/heure)." }, { status: 429 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "IA non configurée" }, { status: 503 });

  const body = await req.json() as { description: string; lang?: string; name?: string };
  if (!body.description?.trim()) {
    return NextResponse.json({ error: "Description requise" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });
  const prompt = buildGeneratePrompt(body.description, body.lang ?? "fr");

  // Appel Claude
  let raw = "";
  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });
    raw = (msg.content[0] as { type: string; text: string }).text ?? "";
  } catch (e) {
    return NextResponse.json({ error: "Erreur IA : " + (e instanceof Error ? e.message : "inconnue") }, { status: 500 });
  }

  const parsed = parseAiJson<AiGenerateResponse>(raw);
  if (!parsed) {
    return NextResponse.json({ error: "Réponse IA invalide", raw }, { status: 500 });
  }

  const siteData = sanitizeGenerateResponse(parsed);

  // Créer le site en base
  const admin = createSupabaseAdmin();

  const { data: site, error: siteErr } = await admin
    .from("websites")
    .insert({
      user_id: user.id,
      name: body.name?.trim() || siteData.name,
      description: siteData.description ?? null,
      lang: body.lang ?? "fr",
      theme: siteData.theme,
      status: "draft",
      template_id: "ai-generated",
    })
    .select()
    .single();

  if (siteErr || !site) {
    return NextResponse.json({ error: siteErr?.message ?? "Erreur création site" }, { status: 500 });
  }

  // Créer les pages + sections
  for (const [pi, page] of siteData.pages.entries()) {
    const { data: pg } = await admin
      .from("website_pages")
      .insert({
        website_id: site.id,
        user_id: user.id,
        title: page.title,
        slug: page.slug,
        is_homepage: page.isHome,
        in_nav: true,
        position: pi,
        status: "draft",
      })
      .select()
      .single();

    if (!pg) continue;

    if (page.sections?.length) {
      const secs = page.sections.map((s, si) => {
        const meta = getSectionMeta(s.type as SectionType);
        return {
          page_id: pg.id,
          website_id: site.id,
          user_id: user.id,
          type: s.type,
          position: si,
          visible: true,
          props: { ...(meta?.defaultProps ?? {}), ...s.props },
          styles: s.styles ?? {},
        };
      });
      await admin.from("website_sections").insert(secs);
    }
  }

  // page_count
  await admin.from("websites").update({ page_count: siteData.pages.length }).eq("id", site.id);

  const { data: fresh } = await admin.from("websites").select("*").eq("id", site.id).single();
  return NextResponse.json({ website: fresh, generated: siteData }, { status: 201 });
}
