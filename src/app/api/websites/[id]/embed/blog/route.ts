// Embed blog — articles publiés pour le section blog_feed
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const CORS = { "Access-Control-Allow-Origin": "*" };

type Params = { params: Promise<{ id: string }> };

// GET /api/websites/[id]/embed/blog?count=3
export async function GET(req: NextRequest, { params }: Params) {
  const { id: websiteId } = await params;
  const count = Math.min(parseInt(req.nextUrl.searchParams.get("count") ?? "3"), 12);

  const admin = createSupabaseAdmin();

  const { data: site } = await admin
    .from("websites")
    .select("user_id")
    .eq("id", websiteId)
    .single();

  if (!site) return NextResponse.json({ articles: [] }, { headers: CORS });

  const { data: articles } = await admin
    .from("blog_articles")
    .select("id, titre, slug, extrait, image_url, categorie, published_at")
    .eq("user_id", site.user_id)
    .eq("published", true)
    .order("published_at", { ascending: false })
    .limit(count);

  return NextResponse.json({ articles: articles ?? [] }, { headers: CORS });
}
