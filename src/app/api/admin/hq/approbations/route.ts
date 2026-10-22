import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const CreateSchema = z.object({
  type:        z.enum(["offboarding","role_change","access_grant","suspension","budget","autre"]),
  titre:       z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  priority:    z.enum(["urgente","haute","normale","basse"]).default("normale"),
  target_id:   z.string().uuid().optional(),
  details:     z.record(z.string(), z.unknown()).optional(),
  expires_at:  z.string().datetime().optional(),
  requested_by: z.string().uuid(),
});

export async function GET(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const { searchParams } = new URL(req.url);
  const statut   = searchParams.get("statut") ?? "en_attente";
  const type     = searchParams.get("type");
  const priority = searchParams.get("priority");

  const sb = createSupabaseAdmin();
  let query = sb
    .from("hq_approvals")
    .select(`
      *,
      requester:requested_by(id, first_name, last_name, job_title, hq_departments(name,color)),
      target:target_id(id, first_name, last_name, job_title),
      reviewer:reviewed_by(id, first_name, last_name)
    `)
    .order("priority", { ascending: true }) // urgente en premier
    .order("created_at", { ascending: false });

  if (statut !== "all") query = query.eq("statut", statut);
  if (type)     query = query.eq("type", type);
  if (priority) query = query.eq("priority", priority);

  // Expirer automatiquement les demandes dépassées
  await sb.rpc("expire_hq_approvals").maybeSingle();

  const { data, error } = await query.limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Compter par statut
  const [{ count: enAttente }, { count: total }] = await Promise.all([
    sb.from("hq_approvals").select("*", { count: "exact", head: true }).eq("statut", "en_attente"),
    sb.from("hq_approvals").select("*", { count: "exact", head: true }),
  ]);

  return NextResponse.json({
    approvals: data ?? [],
    counts: { enAttente: enAttente ?? 0, total: total ?? 0 },
  });
}

export async function POST(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const body   = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides" }, { status: 400 });
  }

  const sb = createSupabaseAdmin();
  const { data, error } = await sb
    .from("hq_approvals")
    .insert({
      ...parsed.data,
      details: parsed.data.details ?? {},
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit log
  await sb.from("hq_audit_log").insert({
    action:       "approval.created",
    entity_type:  "hq_approvals",
    entity_id:    data.id,
    performed_by: parsed.data.requested_by,
    details:      { type: parsed.data.type, titre: parsed.data.titre },
  });

  return NextResponse.json({ approval: data }, { status: 201 });
}
