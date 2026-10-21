import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const CreateSchema = z.object({
  titre:       z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  severite:    z.enum(["critique","eleve","moyen","faible"]).default("moyen"),
  assigned_to: z.string().uuid().optional(),
});

const PatchSchema = z.object({
  id:          z.string().uuid(),
  statut:      z.enum(["ouvert","en_cours","resolu","ferme"]).optional(),
  severite:    z.enum(["critique","eleve","moyen","faible"]).optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  description: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides" }, { status: 400 });
  }

  const sb = createSupabaseAdmin();
  const { data, error } = await sb
    .from("hq_incidents")
    .insert(parsed.data)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ incident: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const body = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides" }, { status: 400 });
  }

  const { id, ...fields } = parsed.data;
  const update: Record<string, unknown> = { ...fields, updated_at: new Date().toISOString() };
  if (fields.statut === "resolu" || fields.statut === "ferme") {
    update.resolved_at = new Date().toISOString();
  }

  const sb = createSupabaseAdmin();
  const { data, error } = await sb
    .from("hq_incidents")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ incident: data });
}
