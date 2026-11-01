/**
 * GET /api/admin/audit — journal d'audit admin (admin_audit_log)
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { requireAdminUser }          from "@/lib/admin-auth-v2";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { deny } = await requireAdminUser(req, {
    logAction:   "READ_AUDIT_LOG",
    logResource: "audit",
  });
  if (deny) return deny;

  const { searchParams } = new URL(req.url);
  const limit    = Math.min(Number(searchParams.get("limit") ?? "100"), 500);
  const severity = searchParams.get("severity");
  const search   = searchParams.get("q");

  const sb = createSupabaseAdmin();
  let q    = sb.from("admin_audit_log")
    .select("id, admin_email, action, resource, resource_id, details, severity, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (severity) q = q.eq("severity", severity);
  if (search)   q = q.or(`action.ilike.%${search}%,admin_email.ilike.%${search}%,resource.ilike.%${search}%`);

  const { data, error } = await q;
  if (error) {
    // admin_audit_log n'existe pas encore en production (migration 174 non appliquée)
    if (error.message.includes("schema cache") || error.message.includes("does not exist")) {
      return NextResponse.json(
        { error: "Service d'audit indisponible — migration 174 non appliquée", _migration: "174_admin_auth_v2" },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data ?? [];
  const stats = {
    total:    rows.length,
    info:     rows.filter(r => r.severity === "info" || !r.severity).length,
    warning:  rows.filter(r => r.severity === "warning").length,
    critical: rows.filter(r => r.severity === "critical").length,
  };

  return NextResponse.json({ logs: rows, stats });
}
