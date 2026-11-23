/**
 * /api/admin/devis — CRUD devis, quote_items, conversion en facture
 * Remplace les écritures directes Supabase dans src/app/admin/devis/page.tsx
 * Point 4 V1.7-SECU : toutes les écritures passent par service_role côté serveur
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { requireAdminUser }          from "@/lib/admin-auth-v2";
import { z }                         from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity:    z.number().min(0),
  unit_price:  z.number().min(0),
  total:       z.number().min(0),
  sort_order:  z.number().int().optional(),
});

const UpsertDevisSchema = z.object({
  id:           z.string().uuid().optional(),
  client_name:  z.string().max(200),
  client_email: z.string().email(),
  phone:        z.string().max(50).optional(),
  service:      z.string().max(200).optional(),
  budget:       z.number().optional(),
  message:      z.string().max(2000).optional(),
  status:       z.string().max(50).optional(),
  items:        z.array(ItemSchema).optional(),
});

const StatusSchema = z.object({
  id:     z.string().uuid(),
  status: z.string().max(50),
});

const ConvertSchema = z.object({
  quoteId:      z.string().uuid(),
  invoiceData:  z.record(z.string(), z.unknown()),
  items:        z.array(ItemSchema).optional(),
});

function getIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

function generateRef(): string {
  return `DEV-${Date.now().toString(36).toUpperCase()}`;
}

/* POST /api/admin/devis — créer ou mettre à jour un devis */
export async function POST(req: NextRequest) {
  const { admin, deny } = await requireAdminUser(req);
  if (deny) return deny;

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Corps invalide." }, { status: 400 }); }

  const parsed = UpsertDevisSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides." }, { status: 400 });

  const { id, items, ...payload } = parsed.data;
  const sb = createSupabaseAdmin();

  let quoteId: string;
  let action: string;

  if (id) {
    const { error } = await sb.from("quotes")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    quoteId = id;
    action = "UPDATE_QUOTE";
  } else {
    const { data, error } = await sb.from("quotes")
      .insert([{ ...payload, reference: generateRef() }])
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    quoteId = data.id;
    action = "CREATE_QUOTE";
  }

  if (items !== undefined) {
    await sb.from("quote_items").delete().eq("quote_id", quoteId);
    if (items.length > 0) {
      const rows = items.map((item, i) => ({ ...item, quote_id: quoteId, sort_order: i }));
      const { error: itemErr } = await sb.from("quote_items").insert(rows);
      if (itemErr) return NextResponse.json({ error: itemErr.message }, { status: 500 });
    }
  }

  await import("@/lib/admin-auth-v2").then(({ logAdminAction }) =>
    logAdminAction({ admin, action, resource: "quotes", resourceId: quoteId, ip: getIp(req) })
  );

  return NextResponse.json({ ok: true, id: quoteId });
}

/* DELETE /api/admin/devis?id=<uuid> — suppression d'un devis */
export async function DELETE(req: NextRequest) {
  const { admin, deny } = await requireAdminUser(req);
  if (deny) return deny;

  const id = new URL(req.url).searchParams.get("id");
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
    return NextResponse.json({ error: "id invalide." }, { status: 400 });
  }

  const sb = createSupabaseAdmin();
  const { error } = await sb.from("quotes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await import("@/lib/admin-auth-v2").then(({ logAdminAction }) =>
    logAdminAction({ admin, action: "DELETE_QUOTE", resource: "quotes", resourceId: id, ip: getIp(req), severity: "warning" })
  );

  return NextResponse.json({ ok: true });
}

/* PATCH /api/admin/devis — mise à jour statut */
export async function PATCH(req: NextRequest) {
  const { admin, deny } = await requireAdminUser(req);
  if (deny) return deny;

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Corps invalide." }, { status: 400 }); }

  const parsed = StatusSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides." }, { status: 400 });

  const { id, status } = parsed.data;
  const sb = createSupabaseAdmin();
  const { error } = await sb.from("quotes")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await import("@/lib/admin-auth-v2").then(({ logAdminAction }) =>
    logAdminAction({ admin, action: "UPDATE_QUOTE_STATUS", resource: "quotes", resourceId: id, ip: getIp(req) })
  );

  return NextResponse.json({ ok: true });
}

/* PUT /api/admin/devis — convertir un devis en facture */
export async function PUT(req: NextRequest) {
  const { admin, deny } = await requireAdminUser(req);
  if (deny) return deny;

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Corps invalide." }, { status: 400 }); }

  const parsed = ConvertSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides." }, { status: 400 });

  const { quoteId, invoiceData, items } = parsed.data;
  const sb = createSupabaseAdmin();

  const ref = `FAC-${Date.now().toString(36).toUpperCase()}`;
  const { data: invoice, error: invErr } = await sb.from("invoices")
    .insert([{ ...invoiceData, reference: ref }])
    .select("id")
    .single();

  if (invErr) return NextResponse.json({ error: invErr.message }, { status: 500 });

  if (items && items.length > 0) {
    const rows = items.map((item, i) => ({ ...item, invoice_id: invoice.id, sort_order: i }));
    await sb.from("invoice_items").insert(rows);
  }

  await sb.from("quotes")
    .update({ status: "converti", updated_at: new Date().toISOString() })
    .eq("id", quoteId);

  await import("@/lib/admin-auth-v2").then(({ logAdminAction }) =>
    logAdminAction({ admin, action: "CONVERT_QUOTE_TO_INVOICE", resource: "quotes", resourceId: quoteId, ip: getIp(req), details: { invoice_id: invoice.id } })
  );

  return NextResponse.json({ ok: true, invoiceId: invoice.id });
}
