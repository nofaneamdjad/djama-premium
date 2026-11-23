/**
 * /api/admin/factures — CRUD factures et invoice_items
 * Remplace les écritures directes Supabase dans src/app/admin/factures/page.tsx
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

const UpdateInvoiceSchema = z.object({
  id:             z.string().uuid(),
  reference:      z.string().max(50).optional(),
  client_name:    z.string().max(200).optional(),
  client_email:   z.string().email().optional(),
  client_company: z.string().max(200).optional(),
  client_address: z.string().max(500).optional(),
  subject:        z.string().max(300).optional(),
  description:    z.string().max(2000).optional(),
  status:         z.enum(["brouillon","envoyée","payée","annulée"]).optional(),
  payment_status: z.enum(["en_attente","payé","partiellement_payé","remboursé"]).optional(),
  due_date:       z.string().nullable().optional(),
  tax_rate:       z.number().min(0).max(100).optional(),
  notes:          z.string().max(2000).optional(),
  footer_text:    z.string().max(2000).optional(),
  items:          z.array(ItemSchema).optional(),
});

const StatusUpdateSchema = z.object({
  id:             z.string().uuid(),
  payment_status: z.string().max(50),
  status:         z.string().max(50),
});

function getIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

const CreateInvoiceSchema = z.object({
  reference:      z.string().max(50).optional(),
  client_name:    z.string().max(200).optional(),
  client_email:   z.string().email().optional(),
  client_company: z.string().max(200).optional(),
  client_address: z.string().max(500).optional(),
  subject:        z.string().max(300).optional(),
  description:    z.string().max(2000).optional(),
  status:         z.string().max(50).optional(),
  payment_status: z.string().max(50).optional(),
  payment_method: z.string().max(100).optional(),
  issue_date:     z.string().nullable().optional(),
  due_date:       z.string().nullable().optional(),
  tax_rate:       z.number().min(0).max(100).optional(),
  subtotal:       z.number().optional(),
  tax_amount:     z.number().optional(),
  total:          z.number().optional(),
  notes:          z.string().max(2000).optional(),
  footer_text:    z.string().max(2000).optional(),
  template:       z.string().max(100).optional(),
  items:          z.array(ItemSchema).optional(),
});

/* POST /api/admin/factures — créer une nouvelle facture */
export async function POST(req: NextRequest) {
  const { admin, deny } = await requireAdminUser(req);
  if (deny) return deny;

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Corps invalide." }, { status: 400 }); }

  const parsed = CreateInvoiceSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides." }, { status: 400 });

  const { items, ...payload } = parsed.data;
  const sb = createSupabaseAdmin();

  const { data, error } = await sb.from("invoices")
    .insert([{ ...payload, updated_at: new Date().toISOString() }])
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (items && items.length > 0) {
    const rows = items.map((item, i) => ({ ...item, invoice_id: data.id, sort_order: i }));
    const { error: itemErr } = await sb.from("invoice_items").insert(rows);
    if (itemErr) return NextResponse.json({ error: itemErr.message }, { status: 500 });
  }

  await import("@/lib/admin-auth-v2").then(({ logAdminAction }) =>
    logAdminAction({ admin, action: "CREATE_INVOICE", resource: "invoices", resourceId: data.id, ip: getIp(req) })
  );

  return NextResponse.json({ ok: true, id: data.id });
}

/* PUT /api/admin/factures — mise à jour complète d'une facture */
export async function PUT(req: NextRequest) {
  const { admin, deny } = await requireAdminUser(req);
  if (deny) return deny;

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Corps invalide." }, { status: 400 }); }

  const parsed = UpdateInvoiceSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides." }, { status: 400 });

  const { id, items, ...payload } = parsed.data;
  const sb = createSupabaseAdmin();

  const { error } = await sb.from("invoices")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (items !== undefined) {
    await sb.from("invoice_items").delete().eq("invoice_id", id);
    if (items.length > 0) {
      const rows = items.map((item, i) => ({ ...item, invoice_id: id, sort_order: i }));
      const { error: itemErr } = await sb.from("invoice_items").insert(rows);
      if (itemErr) return NextResponse.json({ error: itemErr.message }, { status: 500 });
    }
  }

  await import("@/lib/admin-auth-v2").then(({ logAdminAction }) =>
    logAdminAction({ admin, action: "UPDATE_INVOICE", resource: "invoices", resourceId: id, ip: getIp(req) })
  );

  return NextResponse.json({ ok: true });
}

/* DELETE /api/admin/factures?id=<uuid> — suppression d'une facture */
export async function DELETE(req: NextRequest) {
  const { admin, deny } = await requireAdminUser(req);
  if (deny) return deny;

  const id = new URL(req.url).searchParams.get("id");
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
    return NextResponse.json({ error: "id invalide." }, { status: 400 });
  }

  const sb = createSupabaseAdmin();
  const { error } = await sb.from("invoices").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await import("@/lib/admin-auth-v2").then(({ logAdminAction }) =>
    logAdminAction({ admin, action: "DELETE_INVOICE", resource: "invoices", resourceId: id, ip: getIp(req), severity: "warning" })
  );

  return NextResponse.json({ ok: true });
}

/* PATCH /api/admin/factures — mise à jour du statut de paiement */
export async function PATCH(req: NextRequest) {
  const { admin, deny } = await requireAdminUser(req);
  if (deny) return deny;

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Corps invalide." }, { status: 400 }); }

  const parsed = StatusUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides." }, { status: 400 });

  const { id, payment_status, status } = parsed.data;
  const sb = createSupabaseAdmin();

  const { error } = await sb.from("invoices")
    .update({ payment_status, status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await import("@/lib/admin-auth-v2").then(({ logAdminAction }) =>
    logAdminAction({ admin, action: "UPDATE_INVOICE_STATUS", resource: "invoices", resourceId: id, ip: getIp(req) })
  );

  return NextResponse.json({ ok: true });
}
