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

// Colonnes v2 (avec migration appliquée)
const FIELDS_V2 = "id,description,name,reference,type,category,status,unit,unit_price,vat_rate,devise,notes,has_stock,stock_qty,created_at,updated_at";
// Colonnes v1 (sans migration) — rétrocompatibilité
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

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status   = searchParams.get("status") ?? "actif";
  const type     = searchParams.get("type");
  const category = searchParams.get("category");
  const search   = searchParams.get("search");

  // Essai v2 (avec nouveaux champs)
  let q = admin.from("catalog_items").select(FIELDS_V2).eq("user_id", user.id);
  if (status !== "all") q = q.eq("status", status);
  if (type && type !== "all") q = q.eq("type", type);
  if (category && category !== "all") q = q.eq("category", category);
  if (search) q = q.ilike("description", `%${search}%`);
  q = q.order("created_at", { ascending: false });

  const { data, error } = await q;

  let items: ReturnType<typeof normalizeItem>[];
  if (error) {
    // Fallback v1 : migration pas encore appliquée
    const qv1 = admin.from("catalog_items").select(FIELDS_V1)
      .eq("user_id", user.id).order("created_at", { ascending: false });
    const { data: fallback } = await qv1;
    items = (fallback ?? []).map(normalizeItem);
  } else {
    items = (data ?? []).map(normalizeItem);
  }

  // Stats sur tout le catalogue (tentative v2, fallback v1)
  const { data: allV2, error: statsErr } = await admin
    .from("catalog_items").select("type,category,status").eq("user_id", user.id);

  let stats: { total: number; archived: number; products: number; services: number; categories: number };
  let categories: string[];

  if (!statsErr && allV2) {
    stats = {
      total:      allV2.filter(i => !i.status || i.status === "actif").length,
      archived:   allV2.filter(i => i.status === "archivé").length,
      products:   allV2.filter(i => i.type === "produit" && (!i.status || i.status === "actif")).length,
      services:   allV2.filter(i => (!i.type || i.type === "service") && (!i.status || i.status === "actif")).length,
      categories: [...new Set(allV2.filter(i => i.category).map(i => i.category as string))].length,
    };
    categories = [...new Set(allV2.filter(i => i.category).map(i => i.category as string))].sort();
  } else {
    // Fallback v1 : compter tous les items (pas de distinction actif/archivé)
    const { data: countData } = await admin
      .from("catalog_items").select("id", { count: "exact" }).eq("user_id", user.id);
    const total = countData?.length ?? items.length;
    stats = { total, archived: 0, products: 0, services: total, categories: 0 };
    categories = [];
  }

  return NextResponse.json({ items, stats, categories });
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json() as Record<string, unknown>;
  const description = body.description?.toString().trim();
  if (!description)
    return NextResponse.json({ error: "Le nom de l'article est obligatoire" }, { status: 400 });

  // Essai v2
  const v2Payload = {
    user_id:    user.id,
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
  };

  const { data, error } = await admin.from("catalog_items").insert(v2Payload).select(FIELDS_V2).single();

  if (error) {
    // Fallback v1
    const { data: fb, error: fbErr } = await admin.from("catalog_items").insert({
      user_id:    user.id,
      description,
      unit:       body.unit?.toString() || "",
      unit_price: Number(body.unit_price) || 0,
      vat_rate:   Number(body.vat_rate) || 0,
    }).select(FIELDS_V1).single();
    if (fbErr) return NextResponse.json({ error: fbErr.message }, { status: 500 });
    return NextResponse.json({ item: normalizeItem(fb as Record<string, unknown>), v1Fallback: true }, { status: 201 });
  }

  return NextResponse.json({ item: normalizeItem(data as Record<string, unknown>) }, { status: 201 });
}
