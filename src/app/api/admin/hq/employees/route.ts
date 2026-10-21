import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { z } from "zod";

const CreateSchema = z.object({
  email:         z.string().email(),
  first_name:    z.string().min(1).max(80),
  last_name:     z.string().min(1).max(80),
  job_title:     z.string().max(100).optional(),
  department_id: z.string().uuid().optional(),
  role_id:       z.string().uuid().optional(),
  manager_id:    z.string().uuid().optional(),
  phone:         z.string().max(30).optional(),
  started_at:    z.string().optional(),
  send_invite:   z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const dept   = searchParams.get("department_id");

  const admin = createSupabaseAdmin();
  let query = admin
    .from("hq_employees")
    .select(`
      *,
      hq_departments(id, name, color),
      manager:hq_employees!hq_employees_manager_id_fkey(id, first_name, last_name),
      hq_employee_roles(
        granted_at,
        hq_roles(id, name, slug, level)
      )
    `)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (dept)   query = query.eq("department_id", dept);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ employees: data });
}

export async function POST(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const body = await req.json() as unknown;
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { role_id, send_invite, ...empData } = parsed.data;
  const admin = createSupabaseAdmin();

  // Vérifie doublon email
  const { count } = await admin
    .from("hq_employees")
    .select("id", { count: "exact", head: true })
    .eq("email", empData.email);
  if (count && count > 0) {
    return NextResponse.json({ error: "Un employé avec cet email existe déjà." }, { status: 409 });
  }

  // Crée l'employé
  const { data: emp, error: empErr } = await admin
    .from("hq_employees")
    .insert({ ...empData, status: "invited" })
    .select()
    .single();
  if (empErr) return NextResponse.json({ error: empErr.message }, { status: 500 });

  // Assigne le rôle si fourni
  if (role_id) {
    await admin.from("hq_employee_roles").insert({ employee_id: emp.id, role_id });
  }

  // Crée l'invitation
  let invitation = null;
  if (send_invite) {
    const { data: inv } = await admin
      .from("hq_invitations")
      .insert({
        email:         empData.email,
        role_id:       role_id ?? null,
        department_id: empData.department_id ?? null,
        job_title:     empData.job_title ?? null,
        status:        "pending",
      })
      .select()
      .single();
    invitation = inv;
  }

  // Audit
  await admin.from("hq_audit_log").insert({
    actor_type:    "admin",
    action:        "employee.create",
    resource_type: "hq_employees",
    resource_id:   emp.id,
    details:       { email: emp.email, role_id },
  });

  return NextResponse.json({ employee: emp, invitation }, { status: 201 });
}
