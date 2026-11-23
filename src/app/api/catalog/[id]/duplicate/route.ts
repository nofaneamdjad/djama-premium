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

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const { id } = await params;

  const { data: src, error: srcErr } = await admin
    .from("catalog_items").select("*")
    .eq("id", id).eq("user_id", user.id).single();

  if (srcErr || !src) return NextResponse.json({ error: "Article introuvable" }, { status: 404 });

  // Essai v2 (tous les champs)
  const { data, error } = await admin.from("catalog_items").insert({
    user_id:     user.id,
    description: `${src.description} (copie)`,
    name:        src.name ? `${src.name} (copie)` : null,
    reference:   src.reference ? `${src.reference}-COPY` : null,
    type:        src.type,
    category:    src.category,
    status:      "actif",
    unit:        src.unit,
    unit_price:  src.unit_price,
    vat_rate:    src.vat_rate,
    devise:      src.devise ?? "EUR",
    notes:       src.notes,
    has_stock:   src.has_stock ?? false,
    stock_qty:   0,
  }).select("id,description,name,reference,type,category,status,unit,unit_price,vat_rate,devise,notes,has_stock,stock_qty,created_at,updated_at").single();

  if (error) {
    // Fallback v1
    const { data: fb, error: fbErr } = await admin.from("catalog_items").insert({
      user_id:     user.id,
      description: `${src.description} (copie)`,
      unit:        src.unit,
      unit_price:  src.unit_price,
      vat_rate:    src.vat_rate,
    }).select("id,description,unit,unit_price,vat_rate,created_at").single();
    if (fbErr) return NextResponse.json({ error: fbErr.message }, { status: 500 });
    return NextResponse.json({ item: fb, v1Fallback: true }, { status: 201 });
  }

  return NextResponse.json({ item: data }, { status: 201 });
}
