// Gestion des redirections URL Website Builder
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

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

type Params = { params: Promise<{ id: string }> };

// GET — liste des redirections
export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const admin = createSupabaseAdmin();

  const { data: site } = await admin.from("websites").select("id").eq("id", id).eq("user_id", user.id).single();
  if (!site) return NextResponse.json({ error: "Site introuvable" }, { status: 404 });

  const { data: redirections } = await admin
    .from("website_redirections")
    .select("*")
    .eq("website_id", id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ redirections: redirections ?? [] });
}

// POST — créer une redirection
export async function POST(req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const admin = createSupabaseAdmin();

  const { data: site } = await admin.from("websites").select("id").eq("id", id).eq("user_id", user.id).single();
  if (!site) return NextResponse.json({ error: "Site introuvable" }, { status: 404 });

  const body = await req.json() as {
    from_path?: string;
    to_url?: string;
    status_code?: number;
    enabled?: boolean;
  };

  if (!body.from_path || !body.to_url) {
    return NextResponse.json({ error: "from_path et to_url requis" }, { status: 400 });
  }

  // Normaliser from_path : toujours commencer par /
  const fromPath = body.from_path.startsWith("/") ? body.from_path : `/${body.from_path}`;
  const statusCode = [301, 302, 307, 308].includes(body.status_code ?? 301) ? (body.status_code ?? 301) : 301;

  // Vérifier doublon
  const { data: existing } = await admin
    .from("website_redirections")
    .select("id")
    .eq("website_id", id)
    .eq("from_path", fromPath)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Une redirection existe déjà pour ce chemin" }, { status: 409 });
  }

  const { data: row, error } = await admin
    .from("website_redirections")
    .insert({ website_id: id, user_id: user.id, from_path: fromPath, to_url: body.to_url, status_code: statusCode, enabled: body.enabled ?? true })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ redirection: row }, { status: 201 });
}

// PATCH — activer/désactiver ou modifier
export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const admin = createSupabaseAdmin();

  const url = new URL(req.url);
  const redirectionId = url.searchParams.get("redirection_id");
  if (!redirectionId) return NextResponse.json({ error: "redirection_id requis" }, { status: 400 });

  const body = await req.json() as { to_url?: string; status_code?: number; enabled?: boolean };

  const updates: Record<string, unknown> = {};
  if (body.to_url !== undefined)      updates.to_url      = body.to_url;
  if (body.status_code !== undefined) updates.status_code = body.status_code;
  if (body.enabled !== undefined)     updates.enabled     = body.enabled;

  const { data: row, error } = await admin
    .from("website_redirections")
    .update(updates)
    .eq("id", redirectionId)
    .eq("website_id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ redirection: row });
}

// DELETE — supprimer une redirection
export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const admin = createSupabaseAdmin();

  const url = new URL(req.url);
  const redirectionId = url.searchParams.get("redirection_id");
  if (!redirectionId) return NextResponse.json({ error: "redirection_id requis" }, { status: 400 });

  await admin
    .from("website_redirections")
    .delete()
    .eq("id", redirectionId)
    .eq("website_id", id)
    .eq("user_id", user.id);

  return NextResponse.json({ ok: true });
}
