// Génère le HTML de prévisualisation d'une page
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { renderPage } from "@/lib/website-builder/renderer";
import type { WebsiteTheme, WebsitePage, WebsiteSection } from "@/lib/website-builder/types";
import { DEFAULT_THEME } from "@/lib/website-builder/types";

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

type Params = { params: Promise<{ id: string }> };

// GET /api/websites/[id]/preview?page_id=xxx — renvoie le HTML de la page
export async function GET(req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user) return new NextResponse("Non authentifié", { status: 401 });

  const { id } = await params;
  const pageId = req.nextUrl.searchParams.get("page_id");
  const admin = createSupabaseAdmin();

  // Charger le site
  const { data: site } = await admin
    .from("websites")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!site) return new NextResponse("Site introuvable", { status: 404 });

  // Charger la page (homepage si page_id absent)
  let query = admin
    .from("website_pages")
    .select(`*, sections:website_sections(*)`)
    .eq("website_id", id)
    .eq("user_id", user.id);

  if (pageId) {
    query = query.eq("id", pageId);
  } else {
    query = query.eq("is_homepage", true);
  }

  const { data: pageData } = await query.single();

  if (!pageData) return new NextResponse("Page introuvable", { status: 404 });

  // Trier les sections
  const sections = ((pageData.sections ?? []) as WebsiteSection[])
    .sort((a, b) => a.position - b.position);

  const page: WebsitePage = { ...pageData, sections };
  const theme: WebsiteTheme = { ...DEFAULT_THEME, ...(site.theme as Partial<WebsiteTheme>) };

  const html = renderPage(page, theme, {
    title: site.seo_title ?? site.name,
    description: site.seo_description ?? "",
    favicon: site.favicon_url ?? "",
  });

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
