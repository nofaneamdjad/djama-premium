// Supprimer un média
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const BUCKET = "website-media";

async function getUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

type Params = { params: Promise<{ id: string; mediaId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id, mediaId } = await params;
  const admin = createSupabaseAdmin();

  const { data: media } = await admin
    .from("website_media")
    .select("storage_path")
    .eq("id", mediaId)
    .eq("website_id", id)
    .eq("user_id", user.id)
    .single();

  if (!media) return NextResponse.json({ error: "Média introuvable" }, { status: 404 });

  await admin.storage.from(BUCKET).remove([media.storage_path as string]);
  await admin.from("website_media").delete().eq("id", mediaId);

  return NextResponse.json({ ok: true });
}
