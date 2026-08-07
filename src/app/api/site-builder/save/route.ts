import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { toSlug } from "@/lib/site-builder";
import type { SiteConfig } from "@/lib/site-builder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { config, slug: rawSlug, siteId, publish } = await req.json() as {
    config: SiteConfig;
    slug:   string;
    siteId?: string;
    publish?: boolean;
  };

  if (!config?.businessName) {
    return NextResponse.json({ error: "businessName requis." }, { status: 400 });
  }

  const slug = toSlug(rawSlug || config.businessName);

  const admin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } },
  );

  const payload = {
    user_id:      user.id,
    slug,
    config,
    published:    publish ?? false,
    published_at: publish ? new Date().toISOString() : null,
    updated_at:   new Date().toISOString(),
  };

  if (siteId) {
    const { error } = await admin.from("sites").update(payload).eq("id", siteId).eq("user_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ id: siteId, slug });
  }

  const { data, error } = await admin.from("sites").insert(payload).select("id").single();
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Cette URL est déjà prise. Choisissez-en une autre." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, slug });
}
