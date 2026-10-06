/**
 * POST /api/coaching-ia/progress
 * Upsert la progression d'un chapitre pour l'utilisateur authentifié.
 * Body: { legacy_id: string; completed: boolean; quiz_score?: number }
 *
 * GET /api/coaching-ia/progress
 * Retourne la progression complète (legacy_ids des chapitres terminés).
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { checkRateLimitAsync as checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const LEGACY_ID_RE = /^\d{1,2}\.\d{1,2}$/;

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
}

/* ── GET — retourne les chapitres terminés ── */
export async function GET() {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const { allowed } = await checkRateLimit(user.id + ":progress:get", 60, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });

  /* Progression via les IDs catalog */
  const { data: progRows } = await supabase
    .from("coaching_chapter_progress")
    .select("chapter_id, completed, quiz_score, completed_at")
    .eq("user_id", user.id)
    .eq("completed", true);

  if (!progRows?.length) return NextResponse.json({ completed: [] });

  /* Résoudre les legacy_ids */
  const chapterIds = progRows.map((p) => p.chapter_id);
  const { data: chapters } = await supabase
    .from("coaching_chapters_catalog")
    .select("id, legacy_id")
    .in("id", chapterIds);

  const legacyMap = new Map((chapters ?? []).map((c) => [c.id, c.legacy_id]));

  const completed = progRows
    .map((p) => legacyMap.get(p.chapter_id))
    .filter(Boolean) as string[];

  return NextResponse.json({ completed });
}

/* ── POST — upsert progression d'un chapitre ── */
export async function POST(req: NextRequest) {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const { allowed } = await checkRateLimit(user.id + ":progress:post", 30, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });

  const body = await req.json() as {
    legacy_id:  string;
    completed:  boolean;
    quiz_score?: number;
  };

  if (!body.legacy_id || !LEGACY_ID_RE.test(body.legacy_id)) {
    return NextResponse.json({ error: "legacy_id invalide" }, { status: 400 });
  }
  if (typeof body.completed !== "boolean") {
    return NextResponse.json({ error: "completed doit être un booléen" }, { status: 400 });
  }
  if (body.quiz_score !== undefined && (typeof body.quiz_score !== "number" || body.quiz_score < 0 || body.quiz_score > 100)) {
    return NextResponse.json({ error: "quiz_score invalide" }, { status: 400 });
  }

  /* Résoudre le chapter_id depuis le legacy_id */
  const { data: chapter } = await supabase
    .from("coaching_chapters_catalog")
    .select("id")
    .eq("legacy_id", body.legacy_id)
    .single();

  if (!chapter) {
    /* Chapitre inconnu du catalog — fallback sur coaching_progress (legacy) */
    await supabase.from("coaching_progress").upsert({
      user_id:      user.id,
      cours_id:     body.legacy_id,
      completed:    body.completed,
      quiz_score:   body.quiz_score ?? null,
      completed_at: body.completed ? new Date().toISOString() : null,
    }, { onConflict: "user_id,cours_id" });
    return NextResponse.json({ ok: true, via: "legacy" });
  }

  /* Upsert dans coaching_chapter_progress */
  const { error } = await supabase
    .from("coaching_chapter_progress")
    .upsert({
      user_id:      user.id,
      chapter_id:   chapter.id,
      completed:    body.completed,
      quiz_score:   body.quiz_score ?? null,
      last_seen_at: new Date().toISOString(),
      completed_at: body.completed ? new Date().toISOString() : null,
    }, { onConflict: "user_id,chapter_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  /* Aussi écrire dans coaching_progress pour rétrocompatibilité */
  await supabase.from("coaching_progress").upsert({
    user_id:      user.id,
    cours_id:     body.legacy_id,
    completed:    body.completed,
    quiz_score:   body.quiz_score ?? null,
    completed_at: body.completed ? new Date().toISOString() : null,
  }, { onConflict: "user_id,cours_id" });

  return NextResponse.json({ ok: true, via: "catalog" });
}
