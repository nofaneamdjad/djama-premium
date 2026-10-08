/**
 * DELETE /api/notes/folder/[id] — supprimer un dossier
 * Les notes du dossier gardent leurs données (folder_id → NULL via ON DELETE SET NULL)
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getUser() {
  const cs = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cs.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

function err(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user) return err("Non authentifié", 401);

  const { id } = await params;
  const admin = createSupabaseAdmin();

  const { data: folder, error: fetchErr } = await admin
    .from("note_folders")
    .select("id, user_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) return err(fetchErr.message, 500);
  if (!folder)  return err("Dossier introuvable", 404);
  if (folder.user_id !== user.id) return err("Accès interdit", 403);

  const { error } = await admin
    .from("note_folders")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return err(error.message, 500);
  return NextResponse.json({ ok: true });
}
