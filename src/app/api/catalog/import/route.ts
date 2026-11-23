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

interface ImportRow {
  description: string;
  type?: string;
  reference?: string;
  category?: string;
  unit_price?: number;
  devise?: string;
  vat_rate?: number;
  unit?: string;
  notes?: string;
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { rows } = await req.json() as { rows: ImportRow[] };
  if (!Array.isArray(rows) || rows.length === 0)
    return NextResponse.json({ error: "Aucune ligne à importer" }, { status: 400 });
  if (rows.length > 500)
    return NextResponse.json({ error: "Maximum 500 articles par import" }, { status: 400 });

  // Charger les références existantes pour détecter les doublons
  // La colonne reference peut ne pas exister (migration non appliquée) → existingRefs vide acceptable
  const { data: existing, error: refsErr } = await admin
    .from("catalog_items").select("reference").eq("user_id", user.id).not("reference", "is", null);
  const v1Mode = !!refsErr; // true si migration non appliquée
  const existingRefs = new Set((existing ?? []).map(r => r.reference as string));

  const toInsertV2: Record<string, unknown>[] = [];
  const toInsertV1: Record<string, unknown>[] = [];
  const errors: { row: number; reason: string }[] = [];
  const skipped: number[] = [];

  rows.forEach((row, i) => {
    const name = row.description?.toString().trim();
    if (!name) { errors.push({ row: i + 1, reason: "Nom manquant" }); return; }

    const ref = row.reference?.toString().trim() || null;
    if (ref && existingRefs.has(ref)) { skipped.push(i + 1); return; }

    const price = Number(row.unit_price);
    if (isNaN(price) || price < 0) { errors.push({ row: i + 1, reason: "Prix invalide" }); return; }

    const base = {
      user_id:     user.id,
      description: name,
      unit:        row.unit?.toString() || "",
      unit_price:  price,
      vat_rate:    Number(row.vat_rate) || 0,
    };

    toInsertV2.push({
      ...base,
      reference:   ref,
      type:        ["produit","service"].includes(row.type ?? "") ? row.type : "service",
      category:    row.category?.toString().trim() || null,
      status:      "actif",
      devise:      row.devise?.toString() || "EUR",
      notes:       row.notes?.toString().trim() || null,
      has_stock:   false,
      stock_qty:   0,
    });

    toInsertV1.push(base);
  });

  let imported = 0;
  let usedV1 = v1Mode;

  if (toInsertV2.length > 0) {
    const { error } = await admin.from("catalog_items").insert(toInsertV2);
    if (error) {
      // Fallback v1 : migration non appliquée
      usedV1 = true;
      const { error: fbErr } = await admin.from("catalog_items").insert(toInsertV1);
      if (fbErr) return NextResponse.json({ error: fbErr.message }, { status: 500 });
    }
    imported = toInsertV2.length;
  }

  return NextResponse.json({ ok: true, imported, skipped: skipped.length, errors, v1Fallback: usedV1 });
}
