/**
 * POST /api/notes/folder — créer un dossier
 * GET  /api/notes/folder — lister les dossiers de l'utilisateur
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

export async function GET() {
  const user = await getUser();
  if (!user) return err("Non authentifié", 401);

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("note_folders")
    .select("id, name, color")
    .eq("user_id", user.id)
    .order("name");

  if (error) return err(error.message, 500);
  return NextResponse.json({ folders: data ?? [] });
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return err("Non authentifié", 401);

  const { name, color } = await req.json() as { name?: string; color?: string };
  if (!name?.trim()) return err("Nom du dossier requis", 422);
  if (name.length > 100) return err("Nom trop long (max 100 caractères)", 422);

  const admin = createSupabaseAdmin();

  const { data: orgMember } = await admin
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: folder, error } = await admin
    .from("note_folders")
    .insert({
      user_id:         user.id,
      organization_id: orgMember?.organization_id ?? null,
      name:            name.trim().slice(0, 100),
      color:           color ?? "#c9a55a",
    })
    .select()
    .single();

  if (error) return err(error.message, 500);
  return NextResponse.json({ folder }, { status: 201 });
}
