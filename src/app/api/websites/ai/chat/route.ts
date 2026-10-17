// Chat IA conversationnel — modifie le site en langage naturel
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  buildChatPrompt,
  parseAiJson,
  type AiChatResponse,
  type AiAction,
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

// POST /api/websites/ai/chat
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed } = checkRateLimit(user.id, 30, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Limite atteinte (30 messages/heure)." }, { status: 429 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "IA non configurée" }, { status: 503 });

  const body = await req.json() as {
    website_id: string;
    page_id: string;
    message: string;
  };

  if (!body.website_id || !body.page_id || !body.message?.trim()) {
    return NextResponse.json({ error: "website_id, page_id et message requis" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();

  // Charger le contexte du site
  const { data: site } = await admin
    .from("websites")
    .select("*")
    .eq("id", body.website_id)
    .eq("user_id", user.id)
    .single();

  if (!site) return NextResponse.json({ error: "Site introuvable" }, { status: 404 });

  const { data: pages } = await admin
    .from("website_pages")
    .select(`id, title, slug, is_homepage, sections:website_sections(id, type, props, visible, position)`)
    .eq("website_id", body.website_id)
    .eq("user_id", user.id)
    .order("position");

  const siteContext = {
    name: site.name as string,
    theme: site.theme as Record<string, unknown>,
    pages: (pages ?? []).map(p => ({
      id: p.id as string,
      title: p.title as string,
      slug: p.slug as string,
      sections: ((p.sections ?? []) as { id: string; type: string; props: Record<string, unknown>; visible: boolean; position: number }[])
        .sort((a, b) => a.position - b.position)
        .map(s => ({ id: s.id, type: s.type, props: s.props, visible: s.visible })),
    })),
  };

  const prompt = buildChatPrompt(body.message, siteContext, body.page_id);

  // Appel Claude
  let raw = "";
  try {
    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });
    raw = (msg.content[0] as { type: string; text: string }).text ?? "";
  } catch (e) {
    return NextResponse.json({ error: "Erreur IA : " + (e instanceof Error ? e.message : "inconnue") }, { status: 500 });
  }

  const parsed = parseAiJson<AiChatResponse>(raw);
  if (!parsed?.actions) {
    return NextResponse.json({ message: "Je n'ai pas pu comprendre cette demande.", actions: [], raw }, { status: 200 });
  }

  // Appliquer les actions en DB
  const appliedActions: AiAction[] = [];

  for (const action of parsed.actions) {
    try {
      switch (action.type) {
        case "update_section_props": {
          await admin
            .from("website_sections")
            .update({ props: action.props })
            .eq("id", action.section_id)
            .eq("website_id", body.website_id)
            .eq("user_id", user.id);
          appliedActions.push(action);
          break;
        }
        case "update_section_styles": {
          await admin
            .from("website_sections")
            .update({ styles: action.styles })
            .eq("id", action.section_id)
            .eq("website_id", body.website_id)
            .eq("user_id", user.id);
          appliedActions.push(action);
          break;
        }
        case "add_section": {
          const meta = getSectionMeta(action.section_type as SectionType);
          const { count } = await admin
            .from("website_sections")
            .select("id", { count: "exact", head: true })
            .eq("page_id", action.page_id);

          await admin.from("website_sections").insert({
            page_id: action.page_id,
            website_id: body.website_id,
            user_id: user.id,
            type: action.section_type,
            position: action.position ?? (count ?? 0),
            visible: true,
            props: { ...(meta?.defaultProps ?? {}), ...(action.props ?? {}) },
            styles: {},
          });
          appliedActions.push(action);
          break;
        }
        case "remove_section": {
          await admin
            .from("website_sections")
            .delete()
            .eq("id", action.section_id)
            .eq("website_id", body.website_id)
            .eq("user_id", user.id);
          appliedActions.push(action);
          break;
        }
        case "toggle_section": {
          await admin
            .from("website_sections")
            .update({ visible: action.visible })
            .eq("id", action.section_id)
            .eq("website_id", body.website_id)
            .eq("user_id", user.id);
          appliedActions.push(action);
          break;
        }
        case "reorder_sections": {
          for (const [i, sectionId] of action.order.entries()) {
            await admin
              .from("website_sections")
              .update({ position: i })
              .eq("id", sectionId)
              .eq("page_id", action.page_id)
              .eq("user_id", user.id);
          }
          appliedActions.push(action);
          break;
        }
        case "update_theme": {
          const currentTheme = (site.theme ?? {}) as Record<string, unknown>;
          await admin
            .from("websites")
            .update({ theme: { ...currentTheme, ...action.theme } })
            .eq("id", body.website_id)
            .eq("user_id", user.id);
          appliedActions.push(action);
          break;
        }
        case "update_page": {
          const allowed = ["title", "slug", "seo_title", "seo_description", "in_nav"];
          const fields: Record<string, unknown> = {};
          for (const k of allowed) {
            if (k in action.fields) fields[k] = action.fields[k];
          }
          if (Object.keys(fields).length) {
            await admin
              .from("website_pages")
              .update(fields)
              .eq("id", action.page_id)
              .eq("website_id", body.website_id)
              .eq("user_id", user.id);
          }
          appliedActions.push(action);
          break;
        }
        case "add_page": {
          const { count } = await admin
            .from("website_pages")
            .select("id", { count: "exact", head: true })
            .eq("website_id", body.website_id);

          const { data: newPage } = await admin
            .from("website_pages")
            .insert({
              website_id: body.website_id,
              user_id: user.id,
              title: action.title,
              slug: action.slug,
              is_homepage: false,
              in_nav: true,
              position: count ?? 0,
              status: "draft",
            })
            .select()
            .single();

          if (newPage && action.sections?.length) {
            const secs = action.sections.map((s, si) => {
              const meta = getSectionMeta(s.type as SectionType);
              return {
                page_id: (newPage as { id: string }).id,
                website_id: body.website_id,
                user_id: user.id,
                type: s.type,
                position: si,
                visible: true,
                props: { ...(meta?.defaultProps ?? {}), ...(s.props ?? {}) },
                styles: {},
              };
            });
            await admin.from("website_sections").insert(secs);
          }
          appliedActions.push(action);
          break;
        }
      }
    } catch {
      // On continue même si une action échoue
    }
  }

  return NextResponse.json({
    message: parsed.message,
    actions: appliedActions,
    actionsCount: appliedActions.length,
  });
}
