/**
 * GET   /api/admin/bugs — liste bug reports
 * PATCH /api/admin/bugs — changer statut/assignation
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { requireAdminUser, logAdminAction } from "@/lib/admin-auth-v2";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { deny } = await requireAdminUser(req, {
    logAction:   "LIST_BUGS",
    logResource: "bugs",
  });
  if (deny) return deny;

  const { searchParams } = new URL(req.url);
  const status   = searchParams.get("status");
  const severity = searchParams.get("severity");
  const search   = searchParams.get("q");

  const sb = createSupabaseAdmin();
  let q    = sb.from("bug_reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (status)   q = q.eq("status", status);
  if (severity) q = q.eq("severity", severity);
  if (search)   q = q.or(`title.ilike.%${search}%,description.ilike.%${search}%`);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = data ?? [];
  const stats = {
    total:       rows.length,
    new_bugs:    rows.filter(r => r.status === "new").length,
    in_progress: rows.filter(r => r.status === "in_progress").length,
    fixed:       rows.filter(r => r.status === "fixed").length,
    critical:    rows.filter(r => r.severity === "critical").length,
  };

  return NextResponse.json({ bugs: rows, stats });
}

export async function PATCH(req: NextRequest) {
  const { admin, deny } = await requireAdminUser(req, {
    logAction:   "UPDATE_BUG",
    logResource: "bugs",
  });
  if (deny) return deny;

  const body = await req.json() as {
    id: string; status?: string; severity?: string; assigned_to?: string; fixed_in?: string;
  };
  if (!body.id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const sb = createSupabaseAdmin();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.status)      updates.status = body.status;
  if (body.severity)    updates.severity = body.severity;
  if (body.assigned_to) updates.assigned_to = body.assigned_to;
  if (body.fixed_in)    updates.fixed_in = body.fixed_in;

  const { data, error } = await sb.from("bug_reports")
    .update(updates).eq("id", body.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAdminAction({
    admin: admin!,
    action: "UPDATE_BUG",
    resource: "bug_reports",
    resourceId: body.id,
    details: { changes: updates },
    severity: "info",
  });

  return NextResponse.json({ bug: data });
}
