import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const sb = createSupabaseAdmin();
  const now = new Date();
  const y   = now.getFullYear();
  const m   = now.getMonth() + 1;
  const firstMois = `${y}-${String(m).padStart(2,"0")}-01`;

  const [
    { count: ouverts },
    { count: enCours },
    { count: resolus },
    { data: incidents },
    { data: auditLog },
  ] = await Promise.all([
    sb.from("hq_incidents").select("*", { count: "exact", head: true }).eq("statut", "ouvert"),
    sb.from("hq_incidents").select("*", { count: "exact", head: true }).eq("statut", "en_cours"),
    sb.from("hq_incidents").select("*", { count: "exact", head: true })
      .in("statut", ["resolu","ferme"]).gte("updated_at", firstMois),
    sb.from("hq_incidents")
      .select("*, reporter:reported_by(first_name,last_name), assignee:assigned_to(first_name,last_name)")
      .in("statut", ["ouvert","en_cours"])
      .order("severite")
      .order("created_at", { ascending: false })
      .limit(20),
    sb.from("hq_audit_log")
      .select("id, action, entity_type, entity_id, created_at, performer:performed_by(first_name,last_name)")
      .order("created_at", { ascending: false })
      .limit(15),
  ]);

  return NextResponse.json({
    kpi: { ouverts: ouverts ?? 0, enCours: enCours ?? 0, resolus: resolus ?? 0 },
    incidents: incidents ?? [],
    auditLog:  auditLog  ?? [],
  });
}
