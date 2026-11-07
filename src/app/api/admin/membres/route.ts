import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { requireAdminUser }          from "@/lib/admin-auth-v2";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { deny } = await requireAdminUser(req);
  if (deny) return deny;

  const sb = createSupabaseAdmin();

  const { data: membersData, error } = await sb
    .from("organization_members")
    .select("id, user_id, role, created_at, organization_id")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const members = membersData ?? [];

  const orgIds = [...new Set(members.map(m => m.organization_id))];
  const { data: orgs } = orgIds.length > 0
    ? await sb.from("organizations").select("id, name").in("id", orgIds)
    : { data: [] };

  const orgMap = Object.fromEntries((orgs ?? []).map(o => [o.id, o.name]));

  return NextResponse.json({
    members: members.map(m => ({
      ...m,
      org_name: orgMap[m.organization_id] ?? m.organization_id.slice(0, 8) + "…",
    })),
  });
}
