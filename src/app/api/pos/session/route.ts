import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

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

/* GET /api/pos/session — session ouverte courante */
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const db = adminClient();
  const { data } = await db
    .from("pos_sessions")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "open")
    .order("opened_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return NextResponse.json({ session: null });

  /* Cash movements de la session */
  const { data: moves } = await db
    .from("pos_cash_movements")
    .select("*")
    .eq("session_id", data.id)
    .order("created_at");

  return NextResponse.json({ session: data, cash_movements: moves ?? [] });
}

/* POST /api/pos/session — ouvrir ou fermer une session */
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json() as {
    action:         "open" | "close" | "cash_movement";
    terminal_name?: string;
    opening_cash?:  number;
    /* close */
    session_id?:    string;
    closing_cash?:  number;
    closing_notes?: string;
    /* cash_movement */
    type?:          "in" | "out";
    amount?:        number;
    reason?:        string;
  };

  const db = adminClient();

  /* ── Ouvrir session ── */
  if (body.action === "open") {
    /* Vérifier qu'il n'y a pas déjà une session ouverte */
    const { data: existing } = await db
      .from("pos_sessions")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "open")
      .maybeSingle();
    if (existing) return NextResponse.json({ error: "Une session est déjà ouverte" }, { status: 409 });

    const { data: session, error } = await db
      .from("pos_sessions")
      .insert({
        user_id:       user.id,
        terminal_name: body.terminal_name ?? "Caisse principale",
        opening_cash:  body.opening_cash ?? 0,
        status:        "open",
        opened_by:     user.id,
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ session });
  }

  /* ── Fermer session ── */
  if (body.action === "close") {
    if (!body.session_id) return NextResponse.json({ error: "session_id requis" }, { status: 400 });

    /* Vérifier ownership */
    const { data: session } = await db
      .from("pos_sessions")
      .select("*")
      .eq("id", body.session_id)
      .eq("user_id", user.id)
      .eq("status", "open")
      .single();
    if (!session) return NextResponse.json({ error: "Session introuvable ou déjà fermée" }, { status: 404 });

    /* Calcul espèces attendues */
    const { data: cashMoves } = await db
      .from("pos_cash_movements")
      .select("type,amount")
      .eq("session_id", body.session_id);
    const cashIn  = (cashMoves ?? []).filter(m => m.type === "in").reduce((s, m) => s + (m.amount as number), 0);
    const cashOut = (cashMoves ?? []).filter(m => m.type === "out").reduce((s, m) => s + (m.amount as number), 0);
    const expectedCash = (session.opening_cash as number)
      + (session.total_cash as number)
      + cashIn - cashOut;

    const closingCash  = body.closing_cash ?? 0;
    const difference   = closingCash - expectedCash;

    const { data: closed, error } = await db
      .from("pos_sessions")
      .update({
        status:          "closed",
        closed_by:       user.id,
        closing_cash:    closingCash,
        expected_cash:   expectedCash,
        cash_difference: difference,
        closing_notes:   body.closing_notes ?? "",
        closed_at:       new Date().toISOString(),
      })
      .eq("id", body.session_id)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ session: closed, expected_cash: expectedCash, difference });
  }

  /* ── Mouvement de caisse ── */
  if (body.action === "cash_movement") {
    if (!body.session_id || !body.type || !body.amount) {
      return NextResponse.json({ error: "session_id, type, amount requis" }, { status: 400 });
    }
    if (body.amount <= 0) return NextResponse.json({ error: "Montant invalide" }, { status: 400 });

    const { data: move, error } = await db
      .from("pos_cash_movements")
      .insert({
        user_id:    user.id,
        session_id: body.session_id,
        type:       body.type,
        amount:     body.amount,
        reason:     body.reason ?? "",
        created_by: user.id,
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ movement: move });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
