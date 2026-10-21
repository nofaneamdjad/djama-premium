import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { z } from "zod";

const CreateSchema = z.object({
  name:        z.string().min(2).max(80),
  slug:        z.string().min(2).max(40).regex(/^[a-z0-9-]+$/),
  description: z.string().max(300).optional(),
  color:       z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export async function GET(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("hq_departments")
    .select(`
      *,
      hq_employees!hq_departments_head_employee_id_fkey(id, first_name, last_name),
      employee_count:hq_employees(count)
    `)
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ departments: data });
}

export async function POST(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const body = await req.json() as unknown;
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("hq_departments")
    .insert(parsed.data)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ department: data }, { status: 201 });
}
