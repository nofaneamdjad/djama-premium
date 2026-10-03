import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { checkRateLimitAsync as checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "scanner-docs";
const ALLOWED_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf",
]);
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

// GET /api/scanner/documents — liste des documents
export async function GET(_req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data, error } = await supabase
    .from("scanned_documents")
    .select("id, title, doc_type, status, mime_type, file_size, tags, created_at, analyzed_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ documents: data ?? [] });
}

// POST /api/scanner/documents — upload d'un nouveau document
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed } = await checkRateLimit(`scanner:upload:${user.id}`, 50, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Trop de fichiers uploadés. Réessayez dans une heure." }, { status: 429 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Fichier requis." }, { status: 400 });

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Format non supporté. Utilisez JPEG, PNG, WebP, GIF ou PDF." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 10 Mo)." }, { status: 400 });
  }

  // Résoudre organization_id
  const { data: orgData } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();
  const organization_id = orgData?.organization_id ?? null;

  // Générer un chemin de stockage : {user_id}/{docId}/{filename}
  const docId = crypto.randomUUID();
  const ext = file.name.split(".").pop() ?? (file.type.includes("pdf") ? "pdf" : "jpg");
  const safeName = `doc_${Date.now()}.${ext}`;
  const filePath = `${user.id}/${docId}/${safeName}`;

  // Upload vers Storage (admin pour bypass Storage RLS côté écriture serveur)
  const admin = createSupabaseAdmin();
  const bytes = await file.arrayBuffer();
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(filePath, bytes, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: "Erreur lors du téléversement du fichier." }, { status: 500 });
  }

  // Créer l'entrée en base
  const { data: doc, error: dbError } = await supabase
    .from("scanned_documents")
    .insert({
      id: docId,
      user_id: user.id,
      organization_id,
      title: file.name.replace(/\.[^.]+$/, "") || "Document scanné",
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      status: "uploaded",
    })
    .select("id, title, doc_type, status, mime_type, file_size, created_at")
    .single();

  if (dbError) {
    // Nettoyer le fichier uploadé si l'insertion DB échoue
    await admin.storage.from(BUCKET).remove([filePath]);
    return NextResponse.json({ error: "Erreur lors de l'enregistrement." }, { status: 500 });
  }

  return NextResponse.json({ document: doc }, { status: 201 });
}
