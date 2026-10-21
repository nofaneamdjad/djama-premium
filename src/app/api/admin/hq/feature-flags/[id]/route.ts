import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const { id } = await params;
  const body = await req.json() as Record<string, unknown>;

  const allowed = new Set(["enabled", "label", "description", "scope"]);
  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (allowed.has(k)) fields[k] = v;
  }
  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: "Aucun champ valide." }, { status: 400 });
  }
  fields.updated_at = new Date().toISOString();

  const sb = createSupabaseAdmin();
  const { data, error } = await sb
    .from("hq_feature_flags")
    .update(fields)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ flag: data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const { id } = await params;
  const sb = createSupabaseAdmin();

  // Bloquer la suppression des flags système
  const { data: flag } = await sb
    .from("hq_feature_flags")
    .select("key")
    .eq("id", id)
    .single();

  const SYSTEM_KEYS = new Set([
    "chatbot_ia","website_builder","analytics_avances","carte_visite",
    "module_banque","module_signature","module_declarations","prestataires","coaching_ia"
  ]);
  if (flag && SYSTEM_KEYS.has(flag.key)) {
    return NextResponse.json({ error: "Ce flag système ne peut pas être supprimé." }, { status: 403 });
  }

  const { error } = await sb.from("hq_feature_flags").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
