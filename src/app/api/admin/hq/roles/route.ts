import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { z } from "zod";

const CreateSchema = z.object({
  name:         z.string().min(2).max(80),
  slug:         z.string().min(2).max(60).regex(/^[a-z0-9-]+$/),
  description:  z.string().max(300).optional(),
  level:        z.number().int().min(1).max(3).default(3),
  department_id: z.string().uuid().nullable().optional(),
  permissions:  z.array(z.string()).default([]),
});

export async function GET(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("hq_roles")
    .select(`
      *,
      hq_departments(id, name, color),
      hq_role_permissions(
        hq_permissions(id, slug, label, category)
      ),
      employee_count:hq_employee_roles(count)
    `)
    .order("level")
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ roles: data });
}

export async function POST(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const body = await req.json() as unknown;
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { permissions, ...roleData } = parsed.data;
  const admin = createSupabaseAdmin();

  const { data: role, error } = await admin
    .from("hq_roles")
    .insert({ ...roleData, is_system: false })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (permissions.length > 0) {
    const { data: perms } = await admin
      .from("hq_permissions")
      .select("id, slug")
      .in("slug", permissions);

    if (perms && perms.length > 0) {
      await admin.from("hq_role_permissions").insert(
        perms.map(p => ({ role_id: role.id, permission_id: p.id })),
      );
    }
  }

  return NextResponse.json({ role }, { status: 201 });
}
