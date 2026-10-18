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

  // Charger les embeds si des sections d'intégration existent
  const sectionTypes = new Set(sections.map(s => s.type));

  let blogPosts: { id: string; titre: string; slug: string; extrait: string; image_url: string | null; categorie: string; published_at: string }[] = [];
  let products:  { id: string; name: string; slug: string | null; sale_price: number; compare_price?: number | null; image_url: string | null; short_description?: string; category?: string; stock_current?: number; featured?: boolean }[] = [];

  if (sectionTypes.has("blog_feed")) {
    const { data: articles } = await admin
      .from("blog_articles")
      .select("id, titre, slug, extrait, image_url, categorie, published_at")
      .eq("user_id", user.id)
      .eq("published", true)
      .order("published_at", { ascending: false })
      .limit(12);
    blogPosts = (articles ?? []) as typeof blogPosts;
  }

  if (sectionTypes.has("products")) {
    const { data: prods } = await admin
      .from("stock_products")
      .select("id, name, slug, sale_price, compare_price, image_url, short_description, category, stock_current, featured")
      .eq("user_id", user.id)
      .eq("sell_online", true)
      .order("featured", { ascending: false })
      .limit(24);
    products = (prods ?? []) as typeof products;
  }

  const siteLang      = (site.lang as string | null) ?? "fr";
  const secondaryLangs = (site.secondary_langs as string[] | null) ?? [];

  const html = renderPage(page, theme, {
    title:         site.seo_title ?? site.name,
    description:   site.seo_description ?? "",
    favicon:       site.favicon_url ?? "",
    websiteId:     id,
    embeds:        { blogPosts, products },
    lang:          siteLang,
    secondaryLangs,
  });

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
