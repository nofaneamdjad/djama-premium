/**
 * /api/depenses/rules
 *
 * POST   — créer ou modifier une règle de catégorisation automatique
 * PATCH  — modifier une règle existante (y compris toggle active)
 * DELETE — supprimer une règle
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getAuthClient() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  return { user, supabase };
}

export async function POST(req: NextRequest) {
  const { user, supabase } = await getAuthClient();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json();
  const payload = { ...body, user_id: user.id };
  delete payload.id;

  const { data, error } = await supabase
    .from("expense_rules")
    .insert(payload)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { user, supabase } = await getAuthClient();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json() as { id: string; [key: string]: unknown };
  const { id, ...patch } = body;
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  delete patch.user_id;

  const { data, error } = await supabase
    .from("expense_rules")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { user, supabase } = await getAuthClient();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await req.json() as { id: string };
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const { error } = await supabase
    .from("expense_rules")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
