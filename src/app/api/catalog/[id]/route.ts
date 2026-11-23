import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function getUser() {
  const store = await cookies();
  const auth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => store.getAll(), setAll: () => {} } },
  );
  return (await auth.auth.getUser()).data.user;
}

const FIELDS_V2 = "id,description,name,reference,type,category,status,unit,unit_price,vat_rate,devise,notes,has_stock,stock_qty,created_at,updated_at";
const FIELDS_V1 = "id,description,unit,unit_price,vat_rate,created_at";

function normalizeItem(item: Record<string, unknown>) {
  return {
    id:          item.id,
    description: item.description,
    name:        item.name ?? null,
    reference:   item.reference ?? null,
    type:        item.type ?? "service",
    category:    item.category ?? null,
    status:      item.status ?? "actif",
    unit:        item.unit ?? "",
    unit_price:  item.unit_price ?? 0,
    vat_rate:    item.vat_rate ?? 0,
    devise:      item.devise ?? "EUR",
    notes:       item.notes ?? null,
    has_stock:   item.has_stock ?? false,
    stock_qty:   item.stock_qty ?? 0,
    created_at:  item.created_at,
    updated_at:  item.updated_at ?? null,
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const { id } = await params;

  const { data, error } = await admin
    .from("catalog_items").select(FIELDS_V2)
    .eq("id", id).eq("user_id", user.id).single();

  if (error) {
    // Fallback v1
    const { data: fb, error: fbErr } = await admin
      .from("catalog_items").select(FIELDS_V1)
      .eq("id", id).eq("user_id", user.id).single();
    if (fbErr || !fb) return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
    return NextResponse.json({ item: normalizeItem(fb as Record<string, unknown>) });
  }

  return NextResponse.json({ item: normalizeItem(data as Record<string, unknown>) });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const { id } = await params;
  const body = await req.json() as Record<string, unknown>;

  const description = body.description?.toString().trim();
  if (!description)
    return NextResponse.json({ error: "Le nom de l'article est obligatoire" }, { status: 400 });

  // Essai v2
  const { data, error } = await admin
    .from("catalog_items")
    .update({
      description,
      name:        body.name?.toString().trim() || null,
      reference:   body.reference?.toString().trim() || null,
      type:        ["produit","service"].includes(body.type as string) ? body.type : "service",
      category:    body.category?.toString().trim() || null,
      status:      body.status === "archivé" ? "archivé" : "actif",
      unit:        body.unit?.toString() || "",
      unit_price:  Number(body.unit_price) || 0,
      vat_rate:    Number(body.vat_rate) || 0,
      devise:      body.devise?.toString() || "EUR",
      notes:       body.notes?.toString().trim() || null,
      has_stock:   Boolean(body.has_stock),
      stock_qty:   Number(body.stock_qty) || 0,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select(FIELDS_V2)
    .single();

  if (error) {
    // Fallback v1 : n'update que les champs existants
    const { data: fb, error: fbErr } = await admin
      .from("catalog_items")
      .update({
        description,
        unit:       body.unit?.toString() || "",
        unit_price: Number(body.unit_price) || 0,
        vat_rate:   Number(body.vat_rate) || 0,
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select(FIELDS_V1)
      .single();
    if (fbErr) return NextResponse.json({ error: fbErr.message }, { status: 500 });
    return NextResponse.json({ item: normalizeItem(fb as Record<string, unknown>), v1Fallback: true });
  }

  return NextResponse.json({ item: normalizeItem(data as Record<string, unknown>) });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const { id } = await params;

  // Archiver plutôt que supprimer (protection données historiques)
  const { error } = await admin
    .from("catalog_items")
    .update({ status: "archivé" })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    // La colonne status n'existe pas — migration non appliquée
    // On NE supprime JAMAIS les données comme fallback : retour 503 clair
    return NextResponse.json(
      { error: "Archivage impossible : migration requise (colonne status manquante).", migrationRequired: true },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true, archived: true });
}
