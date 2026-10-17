// Génère un robots.txt pour un site Website Builder publié
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const admin = createSupabaseAdmin();

  const { data: site } = await admin
    .from("websites")
    .select("subdomain, status")
    .eq("id", id)
    .single();

  if (!site) return new NextResponse("Not found", { status: 404 });

  const { data: domainRow } = await admin
    .from("website_domains")
    .select("domain")
    .eq("website_id", id)
    .eq("verified", true)
    .eq("is_primary", true)
    .maybeSingle();

  const host = domainRow?.domain ?? `${site.subdomain as string}.djama.site`;
  const baseUrl = `https://${host}`;

  // Si le site n'est pas publié, bloquer les robots
  const txt = site.status !== "published"
    ? `User-agent: *\nDisallow: /\n`
    : `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/api/websites/${id}/sitemap.xml\n`;

  return new NextResponse(txt, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
