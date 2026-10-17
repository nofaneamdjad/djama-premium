// Génère un sitemap.xml pour un site Website Builder publié
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const admin = createSupabaseAdmin();

  // Charger le site (doit être publié)
  const { data: site } = await admin
    .from("websites")
    .select("subdomain, status, seo_title, name")
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (!site) return new NextResponse("Site introuvable", { status: 404 });

  // Chercher un éventuel domaine custom vérifié
  const { data: domainRow } = await admin
    .from("website_domains")
    .select("domain")
    .eq("website_id", id)
    .eq("verified", true)
    .eq("is_primary", true)
    .maybeSingle();

  const host = domainRow?.domain ?? `${site.subdomain as string}.djama.site`;
  const baseUrl = `https://${host}`;

  // Charger les pages publiées
  const { data: pages } = await admin
    .from("website_pages")
    .select("slug, is_homepage, updated_at")
    .eq("website_id", id)
    .eq("status", "published")
    .order("position");

  const urlEntries = (pages ?? []).map(p => {
    const loc = p.is_homepage ? baseUrl : `${baseUrl}/${p.slug as string}`;
    const lastmod = (p.updated_at as string | null)?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
    const priority = p.is_homepage ? "1.0" : "0.8";
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
