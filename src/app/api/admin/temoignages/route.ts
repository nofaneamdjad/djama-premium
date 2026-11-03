/**
 * /api/admin/temoignages — CRUD témoignages
 * Remplace les écritures directes Supabase dans src/app/admin/temoignages/page.tsx
 * Point 4 V1.7-SECU : toutes les écritures passent par service_role côté serveur
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { requireAdminUser }          from "@/lib/admin-auth-v2";
import { z }                         from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TestimonialSchema = z.object({
  id:         z.string().uuid().optional(),
  name:       z.string().min(1).max(200),
  role:       z.string().max(200).optional(),
  company:    z.string().max(200).optional(),
  content:    z.string().min(1).max(2000),
  rating:     z.number().int().min(1).max(5).optional(),
  avatar_url: z.string().max(500).optional(),
  visible:    z.boolean().optional(),
});

function getIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/* POST /api/admin/temoignages — créer ou mettre à jour un témoignage */
export async function POST(req: NextRequest) {
  const { admin, deny } = await requireAdminUser(req);
  if (deny) return deny;

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Corps invalide." }, { status: 400 }); }

  const parsed = TestimonialSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides." }, { status: 400 });

  const { id, ...payload } = parsed.data;
  const sb = createSupabaseAdmin();

  let action: string;
  let resourceId: string | undefined;

  if (id) {
    const { error } = await sb.from("testimonials").update({ ...payload }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    action = "UPDATE_TESTIMONIAL";
    resourceId = id;
  } else {
    const { data, error } = await sb.from("testimonials").insert({ ...payload }).select("id").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    action = "CREATE_TESTIMONIAL";
    resourceId = data.id;
  }

  await import("@/lib/admin-auth-v2").then(({ logAdminAction }) =>
    logAdminAction({ admin, action, resource: "testimonials", resourceId, ip: getIp(req) })
  );

  return NextResponse.json({ ok: true, id: resourceId });
}

/* DELETE /api/admin/temoignages?id=<uuid> — suppression d'un témoignage */
export async function DELETE(req: NextRequest) {
  const { admin, deny } = await requireAdminUser(req);
  if (deny) return deny;

  const id = new URL(req.url).searchParams.get("id");
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
    return NextResponse.json({ error: "id invalide." }, { status: 400 });
  }

  const sb = createSupabaseAdmin();
  const { error } = await sb.from("testimonials").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await import("@/lib/admin-auth-v2").then(({ logAdminAction }) =>
    logAdminAction({ admin, action: "DELETE_TESTIMONIAL", resource: "testimonials", resourceId: id, ip: getIp(req), severity: "warning" })
  );

  return NextResponse.json({ ok: true });
}
