import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { z } from "zod";

const UpdateSchema = z.object({
  first_name:    z.string().min(1).max(80).optional(),
  last_name:     z.string().min(1).max(80).optional(),
  job_title:     z.string().max(100).optional(),
  department_id: z.string().uuid().nullable().optional(),
  manager_id:    z.string().uuid().nullable().optional(),
  phone:         z.string().max(30).optional(),
  status:        z.enum(["invited","active","suspended","offboarded"]).optional(),
  started_at:    z.string().nullable().optional(),
  ended_at:      z.string().nullable().optional(),
});

const RoleSchema = z.object({
  action:  z.enum(["add","remove"]),
  role_id: z.string().uuid(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const { id } = await params;
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("hq_employees")
    .select(`
      *,
      hq_departments(id, name, color, slug),
      manager:hq_employees!hq_employees_manager_id_fkey(id, first_name, last_name, job_title),
      hq_employee_roles(
        granted_at,
        hq_roles(
          id, name, slug, level, description,
          hq_role_permissions(hq_permissions(slug, label, category))
        )
      )
    `)
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ employee: data });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const { id } = await params;
  const body = await req.json() as Record<string, unknown>;
  const admin = createSupabaseAdmin();

  // Action sur rôle
  if ("action" in body && "role_id" in body) {
    const parsed = RoleSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    if (parsed.data.action === "add") {
      await admin.from("hq_employee_roles").upsert(
        { employee_id: id, role_id: parsed.data.role_id },
        { onConflict: "employee_id,role_id" },
      );
    } else {
      await admin.from("hq_employee_roles")
        .delete()
        .eq("employee_id", id)
        .eq("role_id", parsed.data.role_id);
    }

    await admin.from("hq_audit_log").insert({
      actor_type: "admin", action: `role.${parsed.data.action}`,
      resource_type: "hq_employees", resource_id: id,
      details: { role_id: parsed.data.role_id },
    });
    return NextResponse.json({ ok: true });
  }

  // Mise à jour des champs
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const prevStatus = parsed.data.status;
  const { data, error } = await admin
    .from("hq_employees")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (prevStatus) {
    await admin.from("hq_audit_log").insert({
      actor_type: "admin", action: `employee.status.${prevStatus}`,
      resource_type: "hq_employees", resource_id: id,
    });
  }

  return NextResponse.json({ employee: data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const { id } = await params;
  const admin = createSupabaseAdmin();

  // Offboard seulement — ne supprime pas le compte auth
  const { data, error } = await admin
    .from("hq_employees")
    .update({ status: "offboarded", ended_at: new Date().toISOString().split("T")[0], updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("hq_audit_log").insert({
    actor_type: "admin", action: "employee.offboard",
    resource_type: "hq_employees", resource_id: id,
  });

  return NextResponse.json({ employee: data });
}
