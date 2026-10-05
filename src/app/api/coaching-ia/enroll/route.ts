/**
 * POST /api/coaching-ia/enroll
 * Inscrit automatiquement l'utilisateur à la formation principale si pas déjà inscrit.
 * Appelé une fois à l'ouverture de l'espace (silencieux si déjà inscrit).
 * Requiert : utilisateur authentifié avec coaching_ia_active = true.
 */
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  /* Vérifier accès coaching */
  const { data: access } = await supabase
    .from("user_access")
    .select("coaching_ia")
    .eq("user_id", user.id)
    .single();

  if (!access?.coaching_ia) {
    return NextResponse.json({ error: "Accès coaching non activé" }, { status: 403 });
  }

  /* Résoudre formation */
  const { data: formation } = await supabase
    .from("coaching_formations")
    .select("id")
    .eq("slug", "coaching-ia-djama")
    .single();

  if (!formation) {
    return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });
  }

  /* Upsert enrollment (idempotent) */
  const { error } = await supabase
    .from("coaching_enrollments")
    .upsert(
      { user_id: user.id, formation_id: formation.id, status: "active" },
      { onConflict: "user_id,formation_id", ignoreDuplicates: true },
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
