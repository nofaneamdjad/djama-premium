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

// GET /api/websites/[id]/pages — toutes les pages + sections
export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const admin = createSupabaseAdmin();

  const { data: pages, error } = await admin
    .from("website_pages")
    .select(`*, sections:website_sections(*)`)
    .eq("website_id", id)
    .eq("user_id", user.id)
    .order("position");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pages: pages ?? [] });
}

// POST /api/websites/[id]/pages — créer une nouvelle page
export async function POST(req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const body = await req.json() as { title: string; slug?: string; is_homepage?: boolean; in_nav?: boolean };

  if (!body.title?.trim()) return NextResponse.json({ error: "Titre requis" }, { status: 400 });

  const admin = createSupabaseAdmin();

  // Calculer la position (à la fin)
  const { count } = await admin
    .from("website_pages")
    .select("id", { count: "exact", head: true })
    .eq("website_id", id)
    .eq("user_id", user.id);

  const slug = body.slug?.trim() || body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const { data, error } = await admin
    .from("website_pages")
    .insert({
      website_id: id,
      user_id: user.id,
      title: body.title.trim(),
      slug,
      is_homepage: body.is_homepage ?? false,
      in_nav: body.in_nav ?? true,
      position: count ?? 0,
      status: "draft",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mettre à jour page_count du site
  await admin.rpc("update_website_page_count" as never, { p_website_id: id } as never).maybeSingle();
  // Fallback manuel si RPC absent
  const { count: total } = await admin
    .from("website_pages")
    .select("id", { count: "exact", head: true })
    .eq("website_id", id);
  await admin.from("websites").update({ page_count: total ?? 0 }).eq("id", id);

  return NextResponse.json({ page: data }, { status: 201 });
}
