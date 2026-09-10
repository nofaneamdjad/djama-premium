import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
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

  // Écrire dans user_free_apps (RLS : INSERT WITH CHECK user_id = auth.uid() + max 2 apps)
  // La contrainte PRIMARY KEY garantit qu'une 2ème tentative échoue (locked)
  const { error: insertErr } = await supabase
    .from("user_free_apps")
    .insert({ user_id: user.id, selected_apps: slugs, locked_at: new Date().toISOString() });

  if (insertErr) {
    // code 23505 = violation de clé primaire = déjà sélectionné
    if (insertErr.code === "23505") {
      return NextResponse.json(
        { error: "La sélection est déjà verrouillée.", locked: true },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  // Aussi mettre à jour clients.free_apps pour la rétrocompatibilité
  // (utilise le supabase client user — RLS sur clients maintenant permissive pour SELECT,
  //  mais UPDATE toujours service_role only → on utilise le client user pour l'upsert
  //  car clients est géré côté webhook ; ici on fait juste le meilleur effort)
  try {
    const { createSupabaseAdmin } = await import("@/lib/supabase-server");
    const admin = createSupabaseAdmin();
    await admin.from("clients").upsert(
      { id: user.id, email: user.email!, free_apps: slugs, free_apps_locked_at: new Date().toISOString() },
      { onConflict: "email" }
    );
  } catch {}

  return NextResponse.json({ ok: true, free_apps: slugs });
}
