// Suivi de visites public — analytics sites web
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { createHash } from "crypto";

export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

type Params = { params: Promise<{ id: string }> };

// POST /api/websites/[id]/track — public, pas d'auth
export async function POST(req: NextRequest, { params }: Params) {
  const { id: websiteId } = await params;

  const body = await req.json().catch(() => ({})) as {
    page_slug?: string;
    referrer?: string;
  };

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown";

  const admin = createSupabaseAdmin();

  // Retrouver le propriétaire (site doit être publié)
  const { data: site } = await admin
    .from("websites")
    .select("user_id")
    .eq("id", websiteId)
    .eq("status", "published")
    .single();

  if (!site) return NextResponse.json({ ok: false }, { headers: CORS });

  const ipHash = createHash("sha256")
    .update(ip + process.env.SUPABASE_SERVICE_ROLE_KEY!.slice(-8))
    .digest("hex")
    .slice(0, 16);

  await admin.from("website_visits").insert({
    website_id: websiteId,
    user_id:    site.user_id,
    page_slug:  (body.page_slug ?? "/").slice(0, 200),
    referrer:   body.referrer ? body.referrer.slice(0, 500) : null,
    ip_hash:    ipHash,
    ua:         req.headers.get("user-agent")?.slice(0, 300) ?? null,
  });

  return NextResponse.json({ ok: true }, { headers: CORS });
}
