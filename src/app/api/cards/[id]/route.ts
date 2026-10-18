import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import type { BusinessCard } from "@/lib/cards/types";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

async function getUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// GET /api/cards/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const admin = createSupabaseAdmin();

  const { data: card, error } = await admin
    .from("business_cards")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !card) return NextResponse.json({ error: "Carte introuvable" }, { status: 404 });
  return NextResponse.json({ card });
}

// PATCH /api/cards/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const body = await req.json() as Partial<BusinessCard>;

  // Champs non modifiables directement
  const { id: _id, user_id: _uid, slug: _slug, created_at: _c, ...updates } = body as Record<string, unknown>;
  void _id; void _uid; void _slug; void _c;

  // Mettre à jour published_at si on passe à active
  if (updates.status === "active" && !updates.published_at) {
    updates.published_at = new Date().toISOString();
  }

  // Recalculer le champ name depuis first_name/last_name
  if (updates.first_name !== undefined || updates.last_name !== undefined) {
    const admin = createSupabaseAdmin();
    const { data: current } = await admin
      .from("business_cards")
      .select("first_name, last_name, name")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    const fn = (updates.first_name as string) ?? current?.first_name ?? "";
    const ln = (updates.last_name  as string) ?? current?.last_name  ?? "";
    if (fn || ln) updates.name = `${fn} ${ln}`.trim();
  }

  const admin = createSupabaseAdmin();
  const { data: card, error } = await admin
    .from("business_cards")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!card) return NextResponse.json({ error: "Carte introuvable" }, { status: 404 });
  return NextResponse.json({ card });
}

// DELETE /api/cards/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const admin = createSupabaseAdmin();

  const { error } = await admin
    .from("business_cards")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
