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

// POST /api/websites/[id]/publish — publier le site + créer un snapshot de version
export async function POST(_req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const admin = createSupabaseAdmin();

  // Vérifier que le site appartient à l'utilisateur
  const { data: site } = await admin
    .from("websites")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!site) return NextResponse.json({ error: "Site introuvable" }, { status: 404 });

  // Charger toutes les pages + sections pour le snapshot
  const { data: pages } = await admin
    .from("website_pages")
    .select(`*, sections:website_sections(*)`)
    .eq("website_id", id)
    .order("position");

  const snapshot = {
    site: { name: site.name, theme: site.theme, lang: site.lang },
    pages: (pages ?? []).map(p => ({
      id: p.id, title: p.title, slug: p.slug, is_homepage: p.is_homepage,
      sections: (p.sections ?? []),
    })),
    published_at: new Date().toISOString(),
  };

  // Publier toutes les pages draft
  await admin
    .from("website_pages")
    .update({ status: "published" })
    .eq("website_id", id)
    .eq("user_id", user.id);

  // Compter les pages publiées
  const { count: publishedCount } = await admin
    .from("website_pages")
    .select("id", { count: "exact", head: true })
    .eq("website_id", id)
    .eq("status", "published");

  // Mettre à jour le site
  const { data: updated } = await admin
    .from("websites")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      published_pages: publishedCount ?? 0,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  // Créer un snapshot de version
  await admin.from("website_versions").insert({
    website_id: id,
    user_id: user.id,
    snapshot,
    label: `Publication — ${new Date().toLocaleString("fr-FR")}`,
  });

  return NextResponse.json({ website: updated, ok: true });
}

// DELETE /api/websites/[id]/publish — dépublier (passer en draft)
export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const admin = createSupabaseAdmin();

  const { data: updated } = await admin
    .from("websites")
    .update({ status: "draft", published_pages: 0 })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (!updated) return NextResponse.json({ error: "Site introuvable" }, { status: 404 });
  return NextResponse.json({ website: updated, ok: true });
}
