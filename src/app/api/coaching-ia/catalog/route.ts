/**
 * GET /api/coaching-ia/catalog
 * Retourne la formation + ses modules + ses chapitres pour l'utilisateur authentifié.
 * Requiert : coaching_ia_active ou accès preview.
 */
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  /* ── Fetch formation principale ── */
  const { data: formation, error: fErr } = await supabase
    .from("coaching_formations")
    .select("id, slug, title, tagline, description, duration, level")
    .eq("slug", "coaching-ia-djama")
    .eq("is_active", true)
    .single();

  if (fErr || !formation) {
    return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });
  }

  /* ── Fetch modules ── */
  const { data: modules, error: mErr } = await supabase
    .from("coaching_modules_catalog")
    .select("id, slug, title, tagline, description, color, rgb, duration, sort_order")
    .eq("formation_id", formation.id)
    .eq("is_active", true)
    .order("sort_order");

  if (mErr) return NextResponse.json({ error: "Erreur modules" }, { status: 500 });

  /* ── Fetch chapitres ── */
  const moduleIds = (modules ?? []).map((m) => m.id);
  const { data: chapters, error: cErr } = await supabase
    .from("coaching_chapters_catalog")
    .select("id, module_id, legacy_id, title, chapter_type, duration, sort_order")
    .in("module_id", moduleIds)
    .eq("is_active", true)
    .order("sort_order");

  if (cErr) return NextResponse.json({ error: "Erreur chapitres" }, { status: 500 });

  /* ── Fetch progression de l'utilisateur ── */
  const { data: progress } = await supabase
    .from("coaching_chapter_progress")
    .select("chapter_id, completed, quiz_score, completed_at, last_seen_at")
    .eq("user_id", user.id);

  /* ── Assemble ── */
  const progressMap = new Map(
    (progress ?? []).map((p) => [p.chapter_id, p]),
  );

  const modulesWithChapters = (modules ?? []).map((m) => ({
    ...m,
    chapters: (chapters ?? [])
      .filter((c) => c.module_id === m.id)
      .map((c) => ({
        ...c,
        progress: progressMap.get(c.id) ?? null,
      })),
  }));

  return NextResponse.json({ formation, modules: modulesWithChapters });
}
