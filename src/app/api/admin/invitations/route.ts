import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { requireAdminUser }          from "@/lib/admin-auth-v2";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { deny } = await requireAdminUser(req);
  if (deny) return deny;

  const sb = createSupabaseAdmin();

  const { data, error } = await sb
    .from("organization_invitations")
    .select("id, email, role, status, token, expires_at, created_at, organization_id")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const invitations = data ?? [];
  const orgIds = [...new Set(invitations.map(i => i.organization_id))];
  const { data: orgs } = orgIds.length > 0
    ? await sb.from("organizations").select("id, name").in("id", orgIds)
    : { data: [] };

  const orgMap = Object.fromEntries((orgs ?? []).map(o => [o.id, o.name]));

  return NextResponse.json({
    invitations: invitations.map(inv => ({
      ...inv,
      org_name: orgMap[inv.organization_id] ?? "—",
    })),
  });
}

export async function DELETE(req: NextRequest) {
  const { deny } = await requireAdminUser(req);
  if (deny) return deny;

  const { id } = await req.json() as { id?: string };
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const sb = createSupabaseAdmin();
  const { error } = await sb.from("organization_invitations").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
