/**
 * GET   /api/admin/incidents — liste incidents
 * POST  /api/admin/incidents — créer
 * PATCH /api/admin/incidents — mettre à jour (résoudre, changer statut)
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { requireAdminUser, logAdminAction } from "@/lib/admin-auth-v2";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { deny } = await requireAdminUser(req, {
    logAction:   "LIST_INCIDENTS",
    logResource: "incidents",
  });
  if (deny) return deny;

  const { searchParams } = new URL(req.url);
  const status   = searchParams.get("status");
  const severity = searchParams.get("severity");

  const sb = createSupabaseAdmin();
  let q    = sb.from("incidents")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (status)   q = q.eq("status", status);
  if (severity) q = q.eq("severity", severity);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = data ?? [];
  const stats = {
    total:       rows.length,
    open:        rows.filter(r => r.status === "open").length,
    investigating: rows.filter(r => r.status === "investigating").length,
    resolved:    rows.filter(r => r.status === "resolved").length,
    critical:    rows.filter(r => r.severity === "critical").length,
  };

  return NextResponse.json({ incidents: rows, stats });
}

export async function POST(req: NextRequest) {
  const { admin, deny } = await requireAdminUser(req, {
    logAction:   "CREATE_INCIDENT",
    logResource: "incidents",
  });
  if (deny) return deny;

  const body = await req.json() as {
    title: string; description?: string; severity?: string; affected?: string[];
  };
  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Titre requis" }, { status: 400 });
  }

  const sb = createSupabaseAdmin();
  const { data, error } = await sb.from("incidents")
    .insert({
      title:       body.title.trim(),
      description: body.description ?? null,
      severity:    body.severity ?? "medium",
      affected:    body.affected ?? [],
      created_by:  admin!.email,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAdminAction({
    admin: admin!,
    action: "CREATE_INCIDENT",
    resource: "incidents",
    resourceId: data.id,
    details: { title: data.title, severity: data.severity },
    severity: data.severity === "critical" ? "critical" : "warning",
  });

  return NextResponse.json({ incident: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { admin, deny } = await requireAdminUser(req, {
    logAction:   "UPDATE_INCIDENT",
    logResource: "incidents",
  });
  if (deny) return deny;

  const body = await req.json() as {
    id: string; status?: string; severity?: string;
    description?: string; resolved_at?: string;
  };
  if (!body.id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const sb = createSupabaseAdmin();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.status)      updates.status = body.status;
  if (body.severity)    updates.severity = body.severity;
  if (body.description) updates.description = body.description;
  if (body.status === "resolved" && !body.resolved_at) {
    updates.resolved_at = new Date().toISOString();
  }

  const { data, error } = await sb.from("incidents")
    .update(updates).eq("id", body.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAdminAction({
    admin: admin!,
    action: "UPDATE_INCIDENT",
    resource: "incidents",
    resourceId: body.id,
    details: { changes: updates },
    severity: "info",
  });

  return NextResponse.json({ incident: data });
}
