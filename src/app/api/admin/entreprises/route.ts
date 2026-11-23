import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { requireAdminUser }          from "@/lib/admin-auth-v2";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { deny } = await requireAdminUser(req);
  if (deny) return deny;

  const sb = createSupabaseAdmin();

  const { data, error } = await sb
    .from("organizations")
    .select("id, name, slug, plan, owner_id, logo_url, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const orgs = data ?? [];

  const withCounts = await Promise.all(
    orgs.map(async (org) => {
      const { count } = await sb
        .from("organization_members")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", org.id);
      return { ...org, member_count: count ?? 0 };
    })
  );

  return NextResponse.json({ orgs: withCounts });
}
