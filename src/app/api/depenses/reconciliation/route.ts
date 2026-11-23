/**
 * GET  /api/depenses/reconciliation   — dernier rapprochement sauvegardé
 * POST /api/depenses/reconciliation   — créer ou mettre à jour un rapprochement
 * DELETE /api/depenses/reconciliation — supprimer un rapprochement par id
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getAuth() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  return { user, supabase };
}

/** Renvoie le rapprochement le plus récent de l'utilisateur */
export async function GET() {
  const { user, supabase } = await getAuth();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data, error } = await supabase
    .from("bank_reconciliations")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? null);
}

/** Crée ou met à jour un rapprochement (upsert par id) */
export async function POST(req: NextRequest) {
  const { user, supabase } = await getAuth();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json() as { id?: string; label?: string; txs: unknown[] };
  if (!Array.isArray(body.txs)) {
    return NextResponse.json({ error: "txs requis (array)" }, { status: 400 });
  }

  if (body.id) {
    const { data, error } = await supabase
      .from("bank_reconciliations")
      .update({ label: body.label ?? null, txs: body.txs, updated_at: new Date().toISOString() })
      .eq("id", body.id)
      .eq("user_id", user.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  const { data, error } = await supabase
    .from("bank_reconciliations")
    .insert({ user_id: user.id, label: body.label ?? null, txs: body.txs })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

/** Supprime un rapprochement */
export async function DELETE(req: NextRequest) {
  const { user, supabase } = await getAuth();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await req.json() as { id: string };
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const { error } = await supabase
    .from("bank_reconciliations")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
