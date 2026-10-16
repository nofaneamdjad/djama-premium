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

type Params = { params: Promise<{ id: string; pageId: string }> };

// GET /api/websites/[id]/pages/[pageId] — page + sections triées
export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id, pageId } = await params;
  const admin = createSupabaseAdmin();

  const { data, error } = await admin
    .from("website_pages")
    .select(`*, sections:website_sections(*)`)
    .eq("id", pageId)
    .eq("website_id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Page introuvable" }, { status: 404 });

  // Trier les sections par position
  if (data.sections) {
    (data.sections as { position: number }[]).sort((a, b) => a.position - b.position);
  }

  return NextResponse.json({ page: data });
}

// PATCH /api/websites/[id]/pages/[pageId] — modifier title, slug, status, seo…
export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id, pageId } = await params;
  const body = await req.json() as Record<string, unknown>;

  const allowed = ["title", "slug", "is_homepage", "in_nav", "status", "position", "seo_title", "seo_description", "og_image_url"];
  const update: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in body) update[k] = body[k];
  }

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("website_pages")
    .update(update)
    .eq("id", pageId)
    .eq("website_id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ page: data });
}

// DELETE /api/websites/[id]/pages/[pageId]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id, pageId } = await params;
  const admin = createSupabaseAdmin();

  const { error } = await admin
    .from("website_pages")
    .delete()
    .eq("id", pageId)
    .eq("website_id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mettre à jour page_count
  const { count } = await admin
    .from("website_pages")
    .select("id", { count: "exact", head: true })
    .eq("website_id", id);
  await admin.from("websites").update({ page_count: count ?? 0 }).eq("id", id);

  return NextResponse.json({ ok: true });
}
