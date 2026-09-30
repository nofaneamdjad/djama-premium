/**
 * /api/chrono/session
 *
 * GET    — restaure la session de timer active (persistance après refresh)
 * POST   — démarre un nouveau timer (remplace toute session en cours)
 * PATCH  — pause | resume (action dans le body)
 * DELETE — annule le timer sans sauvegarder
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getAuthUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

function err(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

// ── GET : récupérer la session active ────────────────────────────────────────
export async function GET() {
  const user = await getAuthUser();
  if (!user) return err("Non authentifié", 401);

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("timer_sessions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return err(error.message, 500);
  return NextResponse.json({ session: data });
}

// ── POST : démarrer un nouveau timer ─────────────────────────────────────────
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return err("Non authentifié", 401);

  const body = await req.json() as {
    project?: string;
    client_name?: string;
    task_title?: string;
    hourly_rate?: number;
    is_billable?: boolean;
    timer_mode?: string;
    category?: string;
    notes?: string;
    countdown_target_s?: number;
  };

  // Validation taux horaire
  const hourly_rate = body.hourly_rate ?? 0;
  if (hourly_rate < 0 || hourly_rate > 100_000) {
    return err("Taux horaire invalide (0–100 000)", 422);
  }

  const timer_mode = body.timer_mode ?? "classic";
  if (!["classic", "pomodoro", "countdown", "focus"].includes(timer_mode)) {
    return err("Mode invalide", 422);
  }

  const admin = createSupabaseAdmin();

  // Récupérer l'organisation de l'utilisateur
  const { data: orgMember } = await admin
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  // Upsert : 1 seule session active par utilisateur (contrainte UNIQUE sur user_id)
  const { data: session, error } = await admin
    .from("timer_sessions")
    .upsert(
      {
        user_id:            user.id,
        organization_id:    orgMember?.organization_id ?? null,
        started_at:         new Date().toISOString(),
        paused_at:          null,
        total_paused_seconds: 0,
        project:            (body.project ?? "").trim() || "Sans projet",
        client_name:        (body.client_name ?? "").trim(),
        task_title:         (body.task_title ?? "").trim(),
        hourly_rate,
        currency:           "EUR",
        is_billable:        body.is_billable ?? true,
        timer_mode,
        pomodoro_cycle:     0,
        countdown_target_s: body.countdown_target_s ?? null,
        notes:              (body.notes ?? "").trim(),
        category:           body.category ?? "autre",
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) return err(error.message, 500);
  return NextResponse.json({ session }, { status: 201 });
}

// ── PATCH : pause / resume / pomodoro_cycle ───────────────────────────────────
export async function PATCH(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return err("Non authentifié", 401);

  const body = await req.json() as {
    action: "pause" | "resume" | "increment_cycle";
  };

  const admin = createSupabaseAdmin();

  // Récupérer la session active
  const { data: session, error: fetchErr } = await admin
    .from("timer_sessions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchErr) return err(fetchErr.message, 500);
  if (!session) return err("Aucune session active", 404);

  let update: Record<string, unknown> = {};

  if (body.action === "pause") {
    if (session.paused_at) return err("Session déjà en pause", 409);
    update = { paused_at: new Date().toISOString() };

  } else if (body.action === "resume") {
    if (!session.paused_at) return err("Session non en pause", 409);
    const pausedSec = Math.floor(
      (Date.now() - new Date(session.paused_at).getTime()) / 1000
    );
    update = {
      paused_at: null,
      total_paused_seconds: (session.total_paused_seconds ?? 0) + pausedSec,
    };

  } else if (body.action === "increment_cycle") {
    update = { pomodoro_cycle: (session.pomodoro_cycle ?? 0) + 1 };

  } else {
    return err("Action invalide", 422);
  }

  const { data: updated, error: updErr } = await admin
    .from("timer_sessions")
    .update(update)
    .eq("user_id", user.id)
    .select()
    .single();

  if (updErr) return err(updErr.message, 500);
  return NextResponse.json({ session: updated });
}

// ── DELETE : annuler le timer (sans sauvegarder) ─────────────────────────────
export async function DELETE() {
  const user = await getAuthUser();
  if (!user) return err("Non authentifié", 401);

  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("timer_sessions")
    .delete()
    .eq("user_id", user.id);

  if (error) return err(error.message, 500);
  return NextResponse.json({ ok: true });
}
