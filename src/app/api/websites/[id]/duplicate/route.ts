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

// POST /api/websites/[id]/duplicate — duplique un site complet (pages + sections)
export async function POST(_req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const admin = createSupabaseAdmin();

  // Charger le site source
  const { data: src, error: srcErr } = await admin
    .from("websites")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (srcErr || !src) return NextResponse.json({ error: "Site introuvable" }, { status: 404 });

  // Créer le site dupliqué
  const { data: newSite, error: siteErr } = await admin
    .from("websites")
    .insert({
      user_id:        user.id,
      organization_id: src.organization_id,
      name:           `Copie de ${src.name}`,
      description:    src.description,
      status:         "draft",
      lang:           src.lang,
      secondary_langs: src.secondary_langs,
      theme:          src.theme,
      seo_title:      src.seo_title,
      seo_description: src.seo_description,
      template_id:    src.template_id,
    })
    .select()
    .single();

  if (siteErr || !newSite) return NextResponse.json({ error: siteErr?.message ?? "Erreur création" }, { status: 500 });

  // Charger les pages source
  const { data: srcPages } = await admin
    .from("website_pages")
    .select("*, sections:website_sections(*)")
    .eq("website_id", id)
    .eq("user_id", user.id)
    .order("position");

  for (const page of srcPages ?? []) {
    const { sections: srcSections, ...pageFields } = page as typeof page & { sections: Record<string, unknown>[] };

    const { data: newPage } = await admin
      .from("website_pages")
      .insert({
        website_id: newSite.id,
        user_id:    user.id,
        title:      pageFields.title,
        slug:       pageFields.slug,
        position:   pageFields.position,
        is_homepage: pageFields.is_homepage,
        in_nav:     pageFields.in_nav,
        status:     pageFields.status,
        lang:       pageFields.lang ?? null,
        seo_title:  pageFields.seo_title,
        seo_description: pageFields.seo_description,
      })
      .select()
      .single();

    if (!newPage) continue;

    for (const sec of srcSections ?? []) {
      await admin.from("website_sections").insert({
        page_id:    newPage.id,
        website_id: newSite.id,
        user_id:    user.id,
        type:       sec.type,
        position:   sec.position,
        visible:    sec.visible,
        props:      sec.props,
        styles:     sec.styles,
      });
    }
  }

  // Mettre à jour page_count
  await admin.from("websites")
    .update({ page_count: (srcPages ?? []).length })
    .eq("id", newSite.id);

  return NextResponse.json({ website: { ...newSite, page_count: (srcPages ?? []).length } });
}
