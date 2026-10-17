// Serving public des sites Website Builder — /sites/[subdomain]/[...slug]
// Aussi accessible via rewrite middleware pour les sous-domaines xxx.djama.site
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { renderPage } from "@/lib/website-builder/renderer";
import { DEFAULT_THEME } from "@/lib/website-builder/types";
import type { WebsiteTheme, WebsitePage, WebsiteSection } from "@/lib/website-builder/types";

export const dynamic = "force-dynamic";

// En-têtes de sécurité pour les sites publics
const SECURITY_HEADERS = {
  "X-Frame-Options":        "SAMEORIGIN",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy":        "strict-origin-when-cross-origin",
  "Permissions-Policy":     "camera=(), microphone=(), geolocation=()",
};

type Params = { params: Promise<{ subdomain: string; slug?: string[] }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { subdomain, slug: slugParts } = await params;
  const pageSlug = slugParts?.join("/") ?? "";

  const admin = createSupabaseAdmin();

  // Chercher le site par subdomain (ou domaine custom via header Host)
  const host = req.headers.get("host") ?? "";
  let siteQuery = admin.from("websites").select("*").eq("status", "published");

  // Domaine custom ? (header Host ne finit pas par djama.site)
  const isCustomDomain = !host.endsWith(".djama.site") && !host.startsWith("localhost") && host !== "";
  if (isCustomDomain && host) {
    // Chercher via website_domains
    const { data: domainRow } = await admin
      .from("website_domains")
      .select("website_id")
      .eq("domain", host.split(":")[0])
      .eq("verified", true)
      .maybeSingle();

    if (domainRow) {
      siteQuery = siteQuery.eq("id", domainRow.website_id);
    } else {
      return notFoundResponse();
    }
  } else {
    siteQuery = siteQuery.eq("subdomain", subdomain);
  }

  const { data: site } = await siteQuery.single();

  if (!site) return notFoundResponse();

  const websiteId = site.id as string;

  // Vérifier si une redirection active correspond à ce slug
  const requestPath = `/${pageSlug}`;
  const { data: redirect } = await admin
    .from("website_redirections")
    .select("to_url, status_code")
    .eq("website_id", websiteId)
    .eq("from_path", requestPath)
    .eq("enabled", true)
    .maybeSingle();

  if (redirect) {
    return NextResponse.redirect(redirect.to_url as string, {
      status: redirect.status_code as number,
    });
  }

  // Trouver la bonne page par slug
  let pageQuery = admin
    .from("website_pages")
    .select(`*, sections:website_sections(*)`)
    .eq("website_id", websiteId)
    .eq("status", "published");

  if (pageSlug) {
    pageQuery = pageQuery.eq("slug", pageSlug.replace(/^\//, ""));
  } else {
    pageQuery = pageQuery.eq("is_homepage", true);
  }

  const { data: pageData } = await pageQuery.single();

  if (!pageData) {
    // Page 404 → chercher quand même la homepage pour le style
    return notFoundResponse();
  }

  // Sections triées
  const sections = ((pageData.sections ?? []) as WebsiteSection[])
    .sort((a, b) => a.position - b.position);

  const page: WebsitePage = { ...pageData, sections };
  const theme: WebsiteTheme = { ...DEFAULT_THEME, ...(site.theme as Partial<WebsiteTheme>) };

  // Charger les embeds (blog + produits)
  const sectionTypes = new Set(sections.map(s => s.type));

  type BlogPost = { id: string; titre: string; slug: string; extrait: string; image_url: string | null; categorie: string; published_at: string };
  type Product = { id: string; name: string; slug: string | null; sale_price: number; compare_price?: number | null; image_url: string | null; short_description?: string; category?: string; stock_current?: number; featured?: boolean };

  let blogPosts: BlogPost[] = [];
  let products:  Product[]  = [];

  if (sectionTypes.has("blog_feed")) {
    const { data } = await admin
      .from("blog_articles")
      .select("id, titre, slug, extrait, image_url, categorie, published_at")
      .eq("user_id", site.user_id)
      .eq("published", true)
      .order("published_at", { ascending: false })
      .limit(12);
    blogPosts = (data ?? []) as BlogPost[];
  }

  if (sectionTypes.has("products")) {
    const { data } = await admin
      .from("stock_products")
      .select("id, name, slug, sale_price, compare_price, image_url, short_description, category, stock_current, featured")
      .eq("user_id", site.user_id)
      .eq("sell_online", true)
      .order("featured", { ascending: false })
      .limit(24);
    products = (data ?? []) as Product[];
  }

  // Toutes les pages publiées (pour le sitemap inline + nav)
  const { data: allPages } = await admin
    .from("website_pages")
    .select("id, title, slug, is_homepage, in_nav, updated_at")
    .eq("website_id", websiteId)
    .eq("status", "published")
    .order("position");

  // Construire l'URL canonique
  const siteHost = isCustomDomain
    ? host
    : `${site.subdomain as string}.djama.site`;
  const canonical = `https://${siteHost}${pageSlug ? `/${pageSlug}` : ""}`;

  const html = renderPage(page, theme, {
    title:       pageData.seo_title ?? site.seo_title ?? site.name ?? "Site DJAMA",
    description: pageData.seo_description ?? site.seo_description ?? "",
    favicon:     site.favicon_url ?? "",
    websiteId,
    embeds:      { blogPosts, products },
    canonical,
    siteUrl:     `https://${siteHost}`,
    ogImage:     site.seo_image_url ?? "",
    siteName:    site.name as string,
    allPages:    (allPages ?? []) as { id: string; title: string; slug: string; is_homepage: boolean; in_nav: boolean; updated_at: string }[],
  });

  // Enregistrer la visite de manière asynchrone (fire-and-forget)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  import("crypto").then(({ createHash }) => {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
    const hash = createHash("sha256").update(ip + key.slice(-8)).digest("hex").slice(0, 16);
    void admin.from("website_visits").insert({
      website_id: websiteId,
      user_id:    site.user_id,
      page_slug:  `/${pageSlug}`,
      referrer:   req.headers.get("referer")?.slice(0, 500) ?? null,
      ip_hash:    hash,
      ua:         req.headers.get("user-agent")?.slice(0, 300) ?? null,
    });
  }).catch(() => {});

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      ...SECURITY_HEADERS,
    },
  });
}

function notFoundResponse() {
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Site introuvable — DJAMA</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f9fafb; color: #374151; }
    .box { text-align: center; padding: 3rem; background: #fff; border-radius: 1rem; border: 1px solid #e5e7eb; max-width: 420px; }
    h1 { font-size: 1.5rem; font-weight: 800; margin-bottom: 0.75rem; }
    p { color: #6b7280; line-height: 1.6; }
    a { color: #2563eb; font-weight: 600; text-decoration: none; }
  </style>
</head>
<body>
  <div class="box">
    <div style="font-size:3rem;margin-bottom:1rem;">🌐</div>
    <h1>Site introuvable</h1>
    <p>Ce site n'existe pas ou n'est pas encore publié.</p>
    <p style="margin-top:1.5rem"><a href="https://djama.pro">Créer votre site avec DJAMA →</a></p>
  </div>
</body>
</html>`;
  return new NextResponse(html, {
    status: 404,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
