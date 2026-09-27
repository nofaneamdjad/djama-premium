/**
 * /api/depenses/report
 *
 * POST   — créer une note de frais
 * PATCH  — modifier une note de frais
 * DELETE — archiver une note (soft-delete)
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
  if (!body.title?.trim()) return NextResponse.json({ error: "Titre requis" }, { status: 400 });

  const payload = { ...body, user_id: user.id };
  delete payload.id;
  delete payload.deleted_at; // client ne peut pas forcer deleted_at

  const { data, error } = await supabase
    .from("expense_reports")
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

  const { data: existing } = await supabase
    .from("expense_reports")
    .select("user_id")
    .eq("id", id)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: "Note introuvable" }, { status: 404 });
  if (existing.user_id !== user.id) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  delete patch.user_id;
  delete patch.deleted_at;

  const { data, error } = await supabase
    .from("expense_reports")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/** Soft-delete */
export async function DELETE(req: NextRequest) {
  const { user, supabase } = await getAuthClient();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await req.json() as { id: string };
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const { data: existing } = await supabase
    .from("expense_reports")
    .select("user_id")
    .eq("id", id)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: "Note introuvable" }, { status: 404 });
  if (existing.user_id !== user.id) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { error } = await supabase
    .from("expense_reports")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
