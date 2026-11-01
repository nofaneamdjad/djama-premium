/**
 * GET /api/admin/rapports — rapport d'exploitation consolidé
 * Agrège: support tickets, incidents, bug reports, audit log
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { requireAdminUser }          from "@/lib/admin-auth-v2";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { deny } = await requireAdminUser(req, {
    logAction:   "VIEW_RAPPORTS",
    logResource: "rapports",
  });
  if (deny) return deny;

  const sb = createSupabaseAdmin();
  const now = new Date();

  // Début du mois courant
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  // Début de la semaine (lundi)
  const dayOfWeek  = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const weekStart  = new Date(now.getTime() - dayOfWeek * 86400000);
  weekStart.setHours(0, 0, 0, 0);
  const weekStartISO = weekStart.toISOString();

  const [ticketsRes, incidentsRes, bugsRes, auditRes] = await Promise.all([
    sb.from("support_tickets").select("id, status, priority, created_at"),
    sb.from("incidents").select("id, severity, status, created_at"),
    sb.from("bug_reports").select("id, severity, status, created_at"),
    sb.from("admin_audit_log")
      .select("id, severity, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  // ── Support ──────────────────────────────────────────────────────
  const tickets = ticketsRes.data ?? [];
  const support = {
    total:         tickets.length,
    open:          tickets.filter(t => t.status === "open").length,
    in_progress:   tickets.filter(t => t.status === "in_progress").length,
    resolved:      tickets.filter(t => t.status === "resolved").length,
    critical:      tickets.filter(t => t.priority === "critical").length,
    this_month:    tickets.filter(t => t.created_at >= monthStart).length,
    this_week:     tickets.filter(t => t.created_at >= weekStartISO).length,
  };

  // ── Incidents ────────────────────────────────────────────────────
  const incidents = incidentsRes.data ?? [];
  const incidentsStats = {
    total:       incidents.length,
    open:        incidents.filter(i => i.status === "open").length,
    critical:    incidents.filter(i => i.severity === "critical").length,
    this_month:  incidents.filter(i => i.created_at >= monthStart).length,
  };

  // ── Bugs ─────────────────────────────────────────────────────────
  const bugs = bugsRes.data ?? [];
  const bugsStats = {
    total:       bugs.length,
    open:        bugs.filter(b => b.status !== "fixed" && b.status !== "wontfix").length,
    critical:    bugs.filter(b => b.severity === "critical").length,
    fixed:       bugs.filter(b => b.status === "fixed").length,
    this_month:  bugs.filter(b => b.created_at >= monthStart).length,
  };

  // ── Audit ────────────────────────────────────────────────────────
  const auditLogs = auditRes.data ?? [];
  const auditStats = {
    total:       auditLogs.length,
    critical:    auditLogs.filter(l => l.severity === "critical").length,
    warning:     auditLogs.filter(l => l.severity === "warning").length,
    this_month:  auditLogs.filter(l => l.created_at >= monthStart).length,
    this_week:   auditLogs.filter(l => l.created_at >= weekStartISO).length,
  };

  // ── Santé globale ─────────────────────────────────────────────────
  let healthScore = 100;
  if (incidentsStats.open > 0)       healthScore -= incidentsStats.open * 15;
  if (incidentsStats.critical > 0)   healthScore -= incidentsStats.critical * 20;
  if (bugsStats.critical > 0)        healthScore -= bugsStats.critical * 10;
  if (support.critical > 0)          healthScore -= support.critical * 5;
  if (auditStats.critical > 0)       healthScore -= auditStats.critical * 8;
  healthScore = Math.max(0, Math.min(100, healthScore));

  return NextResponse.json({
    generated_at:   now.toISOString(),
    health_score:   healthScore,
    support,
    incidents:      incidentsStats,
    bugs:           bugsStats,
    audit:          auditStats,
  });
}
