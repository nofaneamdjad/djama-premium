/**
 * /api/admin/clients-write — création client (user_access)
 * Remplace l'écriture directe Supabase dans src/app/admin/clients/page.tsx
 * Point 4 V1.7-SECU : toutes les écritures passent par service_role côté serveur
 *
 * Note : "clients" existe déjà comme dossier d'API admin (route clients users),
 * ce fichier est donc nommé "clients-write" pour éviter le conflit.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { requireAdminUser }          from "@/lib/admin-auth-v2";
import { z }                         from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CreateClientSchema = z.object({
  name:             z.string().min(1).max(200),
  email:            z.string().email().max(255),
  phone:            z.string().max(50).optional(),
  source:           z.string().max(100).optional(),
  espace_premium:   z.boolean().optional(),
  coaching_ia:      z.boolean().optional(),
  soutien_scolaire: z.boolean().optional(),
  outils_saas:      z.boolean().optional(),
  notes:            z.string().max(2000).optional(),
});

function getIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/* POST /api/admin/clients-write — créer un client */
export async function POST(req: NextRequest) {
  const { admin, deny } = await requireAdminUser(req);
  if (deny) return deny;

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Corps invalide." }, { status: 400 }); }

  const parsed = CreateClientSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides." }, { status: 400 });

  const payload = {
    ...parsed.data,
    email: parsed.data.email.trim().toLowerCase(),
    name:  parsed.data.name.trim(),
    phone: parsed.data.phone?.trim() || null,
    notes: parsed.data.notes?.trim() || null,
  };

  const sb = createSupabaseAdmin();
  const { data, error } = await sb.from("user_access").insert([payload]).select("id").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await import("@/lib/admin-auth-v2").then(({ logAdminAction }) =>
    logAdminAction({ admin, action: "CREATE_CLIENT", resource: "user_access", resourceId: data.id, ip: getIp(req) })
  );

  return NextResponse.json({ ok: true, id: data.id });
}
