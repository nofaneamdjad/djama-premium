import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { requireHqPermission } from "@/lib/hq-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const deny = await requireHqPermission(req, "employees.read");
  if (deny) return deny;

  const sb = createSupabaseAdmin();

  const [
    { count: totalEmployes },
    { count: actifs },
    { count: suspendus },
    { count: offboarded },
    { data: invitationsEnAttente },
    { data: employes },
    { data: recents },
  ] = await Promise.all([
    sb.from("hq_employees").select("*", { count: "exact", head: true }),
    sb.from("hq_employees").select("*", { count: "exact", head: true }).eq("status", "active"),
    sb.from("hq_employees").select("*", { count: "exact", head: true }).eq("status", "suspended"),
    sb.from("hq_employees").select("*", { count: "exact", head: true }).eq("status", "offboarded"),
    sb.from("hq_invitations")
      .select("id, created_at, expires_at, accepted_at, hq_employees(first_name,last_name,email,job_title)")
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(10),
    sb.from("hq_employees")
      .select("id, first_name, last_name, email, job_title, status, created_at, hq_departments(name,color)")
      .order("created_at", { ascending: false })
      .limit(30),
    sb.from("hq_employees")
      .select("id, first_name, last_name, job_title, status, created_at, hq_departments(name,color)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return NextResponse.json({
    kpi: {
      totalEmployes: totalEmployes ?? 0,
      actifs:        actifs        ?? 0,
      suspendus:     suspendus     ?? 0,
      offboarded:    offboarded    ?? 0,
      invitationsEnAttente: invitationsEnAttente?.length ?? 0,
    },
    employes:            employes            ?? [],
    invitationsEnAttente: invitationsEnAttente ?? [],
    recents:             recents             ?? [],
  });
}
