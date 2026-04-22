/**
 * POST /api/admin/upload
 *
 * Upload un fichier vers Supabase Storage en utilisant la service_role key
 * (côté serveur → bypass RLS complet).
 *
 * Pourquoi cette route existe :
 *   L'admin DJAMA utilise une auth localStorage ("djama_admin=ok"), pas Supabase Auth.
 *   Le client Supabase front n'a donc jamais de session JWT → rôle "anon".
 *   Les policies RLS "INSERT FOR authenticated" ne matchent jamais côté client.
 *   Solution : passer l'upload par cette route qui utilise createSupabaseAdmin()
 *   avec la service_role_key → RLS bypassed.
 *
 * Body (FormData) :
 *   file    File    Fichier à uploader
 *   bucket  string  Bucket Supabase (défaut : "logos")
 *   path    string  Chemin dans le bucket (ex: "1713890123-abc.webp")
 *
 * Auth :
 *   Header  x-djama-admin: ok   (valeur posée par localStorage côté admin)
 *
 * Réponse :
 *   200  { url: string }      URL publique du fichier
 *   400  { error: string }    Paramètre manquant
 *   401  { error: string }    Header admin absent
 *   500  { error: string }    Erreur Supabase ou serveur
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime  = "nodejs";

// ─── Vérification admin ───────────────────────────────────────────────────────
function isAdmin(req: NextRequest): boolean {
  return req.headers.get("x-djama-admin") === "ok";
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {

  // 1. Auth basique
  if (!isAdmin(req)) {
    console.warn("[upload] tentative non autorisée — header x-djama-admin absent");
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file     = formData.get("file")   as File   | null;
    const bucket   = (formData.get("bucket") as string | null) ?? "logos";
    const path     = formData.get("path")   as string | null;

    // 2. Validation
    if (!file) {
      return NextResponse.json({ error: "Paramètre 'file' manquant" }, { status: 400 });
    }
    if (!path || path.startsWith("/")) {
      return NextResponse.json(
        { error: `Paramètre 'path' invalide : "${path}". Ne doit pas commencer par "/".` },
        { status: 400 },
      );
    }

    console.log(`[upload] bucket=${bucket} path=${path} size=${file.size} type=${file.type}`);

    // 3. Lecture du fichier
    const arrayBuffer = await file.arrayBuffer();
    const buffer      = Buffer.from(arrayBuffer);

    // 4. Upload via service_role (bypass RLS)
    const sb = createSupabaseAdmin();

    const { error: storageError } = await sb.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType:  file.type || "application/octet-stream",
        cacheControl: "3600",
        upsert:       true,
      });

    if (storageError) {
      console.error("[upload] storageError:", JSON.stringify(storageError));
      return NextResponse.json(
        {
          error:      storageError.message,
          statusCode: (storageError as unknown as Record<string, unknown>).statusCode,
          details:    storageError,
        },
        { status: 500 },
      );
    }

    // 5. URL publique
    const { data: urlData } = sb.storage.from(bucket).getPublicUrl(path);
    const url = urlData.publicUrl;

    console.log(`[upload] succès → ${url}`);
    return NextResponse.json({ url });

  } catch (err) {
    console.error("[upload] exception:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
