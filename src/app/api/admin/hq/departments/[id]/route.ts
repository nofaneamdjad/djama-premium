import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { z } from "zod";

const UpdateSchema = z.object({
  name:             z.string().min(2).max(80).optional(),
  description:      z.string().max(300).optional(),
  color:            z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  head_employee_id: z.string().uuid().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const { id } = await params;
  const body = await req.json() as unknown;
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("hq_departments")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ department: data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const { id } = await params;
  const admin = createSupabaseAdmin();

  // Vérifie qu'aucun employé actif n'est dans ce département
  const { count } = await admin
    .from("hq_employees")
    .select("id", { count: "exact", head: true })
    .eq("department_id", id)
    .in("status", ["active", "invited"]);

  if (count && count > 0) {
    return NextResponse.json(
      { error: "Impossible de supprimer un département avec des employés actifs." },
      { status: 409 },
    );
  }

  const { error } = await admin.from("hq_departments").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
