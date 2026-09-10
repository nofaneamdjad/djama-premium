import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { VALID_FREE_SLUGS } from "@/lib/free-plan";

const MAX_FREE_APPS = 2;

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const slugs: string[] = Array.isArray(body?.slugs) ? body.slugs : [];

  if (slugs.length === 0 || slugs.length > MAX_FREE_APPS) {
    return NextResponse.json(
      { error: `Sélectionnez entre 1 et ${MAX_FREE_APPS} applications.` },
      { status: 400 }
    );
  }

  const invalid = slugs.filter(s => !VALID_FREE_SLUGS.has(s));
  if (invalid.length > 0) {
    return NextResponse.json(
      { error: `Application(s) inconnue(s): ${invalid.join(", ")}` },
      { status: 400 }
    );
  }

  const admin = createSupabaseAdmin();

  // Vérifier si déjà verrouillé
  const { data: existing } = await admin
    .from("clients")
    .select("free_apps_locked_at")
    .eq("id", user.id)
    .maybeSingle();

  if (existing?.free_apps_locked_at) {
    return NextResponse.json(
      { error: "La sélection d'applications est déjà verrouillée.", locked: true },
      { status: 409 }
    );
  }

  const now = new Date().toISOString();

  // Enregistrer dans la table clients
  const { error: dbErr } = await admin.from("clients").upsert(
    { id: user.id, email: user.email!, free_apps: slugs, free_apps_locked_at: now },
    { onConflict: "id" }
  );
  if (dbErr) {
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, free_apps: slugs });
}
