/**
 * GET /api/depenses/receipt-url?path=userId/timestamp-file.jpg
 * Retourne une URL signée (1h) pour afficher ou télécharger un justificatif.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const path = req.nextUrl.searchParams.get("path");
  if (!path) return NextResponse.json({ error: "path requis" }, { status: 400 });

  // Vérifier que le chemin appartient bien à l'utilisateur (premier segment = userId)
  const ownerId = path.split("/")[0];
  if (ownerId !== user.id) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { data, error } = await supabase.storage
    .from("receipts")
    .createSignedUrl(path, 3600);

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: error?.message ?? "Erreur URL signée" }, { status: 500 });
  }

  return NextResponse.json({ url: data.signedUrl });
}
