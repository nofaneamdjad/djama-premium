/**
 * POST /api/artifacts/signed-url
 * Génère une URL signée côté serveur (service role) pour télécharger un artifact.
 * L'utilisateur doit posséder l'artifact (vérifié via artifact_files + RLS).
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const cs = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cs.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { bucket, path } = await req.json() as { bucket?: string; path?: string };
  if (!bucket || !path) return NextResponse.json({ error: "bucket et path requis" }, { status: 400 });

  // Vérifier la propriété : le path doit commencer par l'userId (convention: {userId}/...)
  // Fallback : vérification via artifact_files si la table existe
  const pathOwned = path.startsWith(`${user.id}/`);
  if (!pathOwned) {
    // Fallback: check artifact_files table (may not exist)
    const { data: af } = await sb
      .from("artifact_files")
      .select("id")
      .eq("storage_bucket", bucket)
      .eq("storage_path", path)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!af) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  // Générer l'URL signée avec le service role
  const admin = createSupabaseAdmin();
  const { data, error } = await admin.storage.from(bucket).createSignedUrl(path, 3600);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ url: data.signedUrl });
}
