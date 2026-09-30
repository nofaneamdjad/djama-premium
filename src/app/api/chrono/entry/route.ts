/**
 * POST /api/chrono/entry
 * Arrête le timer actif ET/OU enregistre une entrée de temps.
 *
 * Deux cas d'usage :
 *   1. stop_timer=true  → calcule la durée côté serveur depuis timer_sessions,
 *                          puis sauvegarde + supprime la session active
 *   2. stop_timer=false → entrée manuelle (durée fournie par le client,
 *                          plafonnée à 1440 min et validée)
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getAuthUser() {
  const cookieStore = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

function err(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return err("Non authentifié", 401);

  const body = await req.json() as {
    stop_timer?: boolean;
    // Champs communs
    project?: string;
    client_name?: string;
    task_title?: string;
    description?: string;
    category?: string;
    hourly_rate?: number;
    is_billable?: boolean;
    timer_mode?: string;
    notes?: string;
    // Entrée manuelle uniquement
    date?: string;
    duration_minutes?: number;
    // Override Pomodoro
    pomodoro_num?: number;
  };

  const admin = createSupabaseAdmin();

  let durationMinutes: number;
  let sessionOrg: string | null = null;
  let startedAt: string | null = null;
  let endedAt: string | null = null;

  if (body.stop_timer) {
    // ── Cas 1 : arrêt du timer — durée calculée côté serveur ────────────────
    const { data: session, error: sErr } = await admin
      .from("timer_sessions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (sErr) return err(sErr.message, 500);
    if (!session) return err("Aucune session active trouvée", 404);

    const now = Date.now();
    const startedMs = new Date(session.started_at).getTime();
    let totalElapsedS = Math.floor((now - startedMs) / 1000);

    // Soustraire le temps en pause
    let pausedSec = session.total_paused_seconds ?? 0;
    if (session.paused_at) {
      // Timer encore en pause au moment de l'arrêt
      pausedSec += Math.floor((now - new Date(session.paused_at).getTime()) / 1000);
    }
    totalElapsedS = Math.max(0, totalElapsedS - pausedSec);

    durationMinutes = Math.max(1, Math.round(totalElapsedS / 60));
    // Plafond : 1440 min (24h) par session
    durationMinutes = Math.min(1440, durationMinutes);

    sessionOrg = session.organization_id ?? null;
    startedAt  = session.started_at;
    endedAt    = new Date(now).toISOString();

    // Supprimer la session active
    await admin.from("timer_sessions").delete().eq("user_id", user.id);

  } else {
    // ── Cas 2 : entrée manuelle ───────────────────────────────────────────────
    const rawDuration = Math.floor(Number(body.duration_minutes));
    if (!rawDuration || rawDuration <= 0) return err("Durée invalide", 422);
    if (rawDuration > 1440) return err("Durée max : 1440 minutes (24h)", 422);
    durationMinutes = rawDuration;

    // Récupérer l'organisation
    const { data: orgMember } = await admin
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    sessionOrg = orgMember?.organization_id ?? null;
  }

  // ── Validation taux horaire ───────────────────────────────────────────────
  const rawRate = body.hourly_rate !== undefined ? Number(body.hourly_rate) : null;
  if (rawRate !== null && (rawRate < 0 || rawRate > 100_000)) {
    return err("Taux horaire invalide (0–100 000)", 422);
  }

  // ── Validation mode ───────────────────────────────────────────────────────
  const timerMode = body.timer_mode ?? "classic";
  const validModes = ["classic", "pomodoro", "countdown", "focus", "manual"];
  if (!validModes.includes(timerMode)) return err("Mode invalide", 422);

  // ── Construction du titre (Pomodoro) ──────────────────────────────────────
  const rawTitle = (body.task_title ?? "").trim();
  const pomNum   = body.pomodoro_num;
  const taskTitle = pomNum
    ? (rawTitle ? `${rawTitle} (Pomodoro #${pomNum})` : `Pomodoro #${pomNum}`)
    : rawTitle;

  // ── Insertion time_entries ────────────────────────────────────────────────
  const { data: entry, error: insertErr } = await admin
    .from("time_entries")
    .insert({
      user_id:          user.id,
      organization_id:  sessionOrg,
      task_title:       taskTitle,
      project:          (body.project ?? "").trim() || "Sans projet",
      client_name:      (body.client_name ?? "").trim() || null,
      description:      (body.description ?? rawTitle) || null,
      category:         body.category ?? "autre",
      date:             body.date ?? new Date().toISOString().slice(0, 10),
      duration_minutes: durationMinutes,
      hourly_rate:      rawRate,
      is_billable:      body.is_billable ?? true,
      is_billed:        false,
      timer_mode:       timerMode,
      notes:            (body.notes ?? "").trim(),
      currency:         "EUR",
      started_at:       startedAt,
      ended_at:         endedAt,
    })
    .select()
    .single();

  if (insertErr) return err(insertErr.message, 500);
  return NextResponse.json({ entry }, { status: 201 });
}
