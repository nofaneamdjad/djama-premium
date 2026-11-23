/**
 * /api/admin/parametres — mise à jour des settings et social links
 * Remplace les écritures directes Supabase dans src/app/admin/parametres/page.tsx
 * Point 4 V1.7-SECU : toutes les écritures passent par service_role côté serveur
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { requireAdminUser }          from "@/lib/admin-auth-v2";
import { z }                         from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* GET /api/admin/parametres — lire tous les settings et liens sociaux */
export async function GET(req: NextRequest) {
  const { deny } = await requireAdminUser(req);
  if (deny) return deny;

  const sb = createSupabaseAdmin();
  const [settingsRes, socialRes] = await Promise.all([
    sb.from("site_settings").select("*").order("section").order("key"),
    sb.from("social_links").select("*").order("sort_order"),
  ]);

  if (settingsRes.error) return NextResponse.json({ error: settingsRes.error.message }, { status: 500 });
  if (socialRes.error)   return NextResponse.json({ error: socialRes.error.message  }, { status: 500 });

  return NextResponse.json({
    settings:    settingsRes.data ?? [],
    socialLinks: socialRes.data  ?? [],
  });
}

const SaveSettingsSchema = z.object({
  updates: z.record(z.string().min(1), z.string().max(5000)),
});

const UpdateSocialSchema = z.object({
  id:         z.string().uuid(),
  url:        z.string().max(500).optional(),
  active:     z.boolean().optional(),
  sort_order: z.number().int().optional(),
});

function getIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/* PUT /api/admin/parametres — sauvegarder tous les settings */
export async function PUT(req: NextRequest) {
  const { admin, deny } = await requireAdminUser(req);
  if (deny) return deny;

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Corps invalide." }, { status: 400 }); }

  const parsed = SaveSettingsSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides." }, { status: 400 });

  const { updates } = parsed.data;
  const sb = createSupabaseAdmin();
  const now = new Date().toISOString();

  const ops = Object.entries(updates).map(([key, value]) =>
    sb.from("site_settings")
      .update({ value, updated_at: now })
      .eq("key", key)
  );

  const results = await Promise.all(ops);
  const failed = results.filter(r => r.error);
  if (failed.length > 0) {
    return NextResponse.json({ error: `${failed.length} mise(s) à jour échouée(s).` }, { status: 500 });
  }

  await import("@/lib/admin-auth-v2").then(({ logAdminAction }) =>
    logAdminAction({ admin, action: "UPDATE_SITE_SETTINGS", resource: "site_settings", ip: getIp(req), details: { keys: Object.keys(updates) } })
  );

  return NextResponse.json({ ok: true });
}

/* PATCH /api/admin/parametres — mettre à jour un lien social */
export async function PATCH(req: NextRequest) {
  const { admin, deny } = await requireAdminUser(req);
  if (deny) return deny;

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Corps invalide." }, { status: 400 }); }

  const parsed = UpdateSocialSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides." }, { status: 400 });

  const { id, ...patch } = parsed.data;
  const sb = createSupabaseAdmin();

  const { data, error } = await sb.from("social_links")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await import("@/lib/admin-auth-v2").then(({ logAdminAction }) =>
    logAdminAction({ admin, action: "UPDATE_SOCIAL_LINK", resource: "social_links", resourceId: id, ip: getIp(req) })
  );

  return NextResponse.json({ ok: true, data });
}
