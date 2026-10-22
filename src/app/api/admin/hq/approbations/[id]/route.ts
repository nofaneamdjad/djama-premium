import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const ReviewSchema = z.object({
  action:         z.enum(["approuve","rejete"]),
  review_comment: z.string().max(1000).optional(),
  reviewed_by:    z.string().uuid(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const { id } = await params;
  const body   = await req.json();
  const parsed = ReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides" }, { status: 400 });
  }

  const sb = createSupabaseAdmin();

  // Vérifier que l'approbation existe et est en attente
  const { data: existing } = await sb
    .from("hq_approvals")
    .select("id, statut, type, titre")
    .eq("id", id)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: "Approbation introuvable." }, { status: 404 });
  if (existing.statut !== "en_attente") {
    return NextResponse.json({ error: "Cette demande a déjà été traitée." }, { status: 409 });
  }

  const { data, error } = await sb
    .from("hq_approvals")
    .update({
      statut:         parsed.data.action,
      reviewed_by:    parsed.data.reviewed_by,
      reviewed_at:    new Date().toISOString(),
      review_comment: parsed.data.review_comment,
      updated_at:     new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit log
  await sb.from("hq_audit_log").insert({
    action:       `approval.${parsed.data.action}`,
    entity_type:  "hq_approvals",
    entity_id:    id,
    performed_by: parsed.data.reviewed_by,
    details:      { type: existing.type, titre: existing.titre },
  });

  return NextResponse.json({ approval: data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const { id } = await params;
  const sb = createSupabaseAdmin();

  const { data: existing } = await sb
    .from("hq_approvals")
    .select("statut")
    .eq("id", id)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  if (existing.statut !== "en_attente") {
    return NextResponse.json({ error: "Seules les demandes en attente peuvent être supprimées." }, { status: 409 });
  }

  const { error } = await sb.from("hq_approvals").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
