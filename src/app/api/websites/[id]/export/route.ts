// Export HTML Website Builder — génère un ZIP de toutes les pages du site
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { renderPage } from "@/lib/website-builder/renderer";
import { DEFAULT_THEME } from "@/lib/website-builder/types";
import type { WebsiteTheme, WebsitePage, WebsiteSection } from "@/lib/website-builder/types";
import JSZip from "jszip";

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

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const admin  = createSupabaseAdmin();

  // Vérifier appartenance
  const { data: site } = await admin
    .from("websites")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!site) return NextResponse.json({ error: "Site introuvable" }, { status: 404 });

  // Charger toutes les pages publiées avec leurs sections
  const { data: pages } = await admin
    .from("website_pages")
    .select(`*, sections:website_sections(*)`)
    .eq("website_id", id)
    .eq("status", "published")
    .order("position");

  if (!pages?.length) {
    return NextResponse.json({ error: "Aucune page publiée à exporter" }, { status: 400 });
  }

  const theme: WebsiteTheme = { ...DEFAULT_THEME, ...(site.theme as Partial<WebsiteTheme>) };

  // Charger les embeds si nécessaires
  const allSectionTypes = new Set(pages.flatMap(p =>
    ((p.sections ?? []) as WebsiteSection[]).map((s: WebsiteSection) => s.type)
  ));

  type BlogPost = { id: string; titre: string; slug: string; extrait: string; image_url: string | null; categorie: string; published_at: string };
  type Product  = { id: string; name: string; slug: string | null; sale_price: number; compare_price?: number | null; image_url: string | null; short_description?: string; category?: string; stock_current?: number; featured?: boolean };

  let blogPosts: BlogPost[] = [];
  let products:  Product[]  = [];

  if (allSectionTypes.has("blog_feed")) {
    const { data } = await admin
      .from("blog_articles")
      .select("id, titre, slug, extrait, image_url, categorie, published_at")
      .eq("user_id", site.user_id)
      .eq("published", true)
      .order("published_at", { ascending: false })
      .limit(12);
    blogPosts = (data ?? []) as BlogPost[];
  }

  if (allSectionTypes.has("products")) {
    const { data } = await admin
      .from("stock_products")
      .select("id, name, slug, sale_price, compare_price, image_url, short_description, category, stock_current, featured")
      .eq("user_id", site.user_id)
      .eq("sell_online", true)
      .order("featured", { ascending: false })
      .limit(24);
    products = (data ?? []) as Product[];
  }

  const allPagesIndex = pages.map(p => ({
    id:          p.id as string,
    title:       p.title as string,
    slug:        p.slug as string,
    is_homepage: p.is_homepage as boolean,
    in_nav:      p.in_nav as boolean,
    updated_at:  p.updated_at as string,
  }));

  const siteSlug = (site.subdomain as string) ?? id;
  const zip = new JSZip();

  // Générer chaque page HTML
  for (const pageData of pages) {
    const sections = ((pageData.sections ?? []) as WebsiteSection[])
      .sort((a, b) => a.position - b.position);

    const page: WebsitePage = { ...pageData, sections };
    const slug = (pageData.slug as string) || "";
    const isHome = pageData.is_homepage as boolean;

    const html = renderPage(page, theme, {
      title:       (pageData.seo_title as string | null) ?? (site.seo_title as string | null) ?? (site.name as string) ?? "Site",
      description: (pageData.seo_description as string | null) ?? (site.seo_description as string | null) ?? "",
      favicon:     (site.favicon_url as string | null) ?? "",
      embeds:      { blogPosts, products },
      allPages:    allPagesIndex,
      siteName:    site.name as string,
    });

    const filename = isHome ? "index.html" : `${slug.replace(/\//g, "_") || "page"}.html`;
    zip.file(filename, html);
  }

  // Fichier README à la racine
  zip.file("README.txt", [
    `Export HTML — ${site.name as string}`,
    `Exporté le ${new Date().toLocaleString("fr-FR")}`,
    ``,
    `Pages exportées :`,
    ...pages.map(p => `  - ${p.is_homepage ? "index.html (accueil)" : `${(p.slug as string).replace(/\//g, "_")}.html`}`),
    ``,
    `Note : Les formulaires de contact nécessitent un hébergement avec Next.js pour fonctionner.`,
    `       Les médias sont référencés via des URLs absolues depuis votre hébergement DJAMA.`,
  ].join("\n"));

  const zipBuffer = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
  const body: BodyInit = zipBuffer.buffer as ArrayBuffer;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type":        "application/zip",
      "Content-Disposition": `attachment; filename="site_${siteSlug}_export.zip"`,
      "Content-Length":      String(zipBuffer.byteLength),
    },
  });
}
