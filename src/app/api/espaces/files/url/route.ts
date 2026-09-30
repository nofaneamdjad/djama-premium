/**
 * GET /api/espaces/files/url?file_id=...
 *
 * Génère une URL signée (1h) pour télécharger un fichier d'un espace privé.
 * Requiert accès en lecture à l'espace.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { getSpaceRole, canReadSpace } from "@/lib/space-permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const file_id = new URL(req.url).searchParams.get("file_id");
  if (!file_id) return NextResponse.json({ error: "file_id requis." }, { status: 400 });

  const admin = createSupabaseAdmin();

  const { data: file } = await admin
    .from("space_files")
    .select("space_id, storage_path, name")
    .eq("id", file_id)
    .single();

  if (!file) return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });

  const { role } = await getSpaceRole(user.id, (file as { space_id: string }).space_id, admin);
  if (!canReadSpace(role))
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  const { data: signed, error } = await admin.storage
    .from("space-files")
    .createSignedUrl((file as { storage_path: string }).storage_path, 3600);

  if (error || !signed?.signedUrl)
    return NextResponse.json({ error: error?.message ?? "Erreur génération URL." }, { status: 500 });

  return NextResponse.json({ url: signed.signedUrl, name: (file as { name: string }).name });
}
