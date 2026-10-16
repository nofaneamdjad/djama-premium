import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { DEFAULT_THEME } from "@/lib/website-builder/types";
import { SITE_TEMPLATES } from "@/lib/website-builder/templates";
import { getSectionMeta } from "@/lib/website-builder/sections-meta";
import type { SectionType } from "@/lib/website-builder/types";

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

// GET /api/websites — liste tous les sites de l'utilisateur
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("websites")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ websites: data });
}

// POST /api/websites — créer un site (depuis template ou blank)
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json() as {
    name: string;
    template_id?: string;
    lang?: string;
    subdomain?: string;
  };

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Nom du site requis" }, { status: 400 });
  }

  const tpl = body.template_id ? SITE_TEMPLATES.find(t => t.id === body.template_id) : null;
  const theme = tpl ? { ...DEFAULT_THEME, ...tpl.theme } : DEFAULT_THEME;

  const admin = createSupabaseAdmin();

  // Créer le site
  const { data: site, error: siteErr } = await admin
    .from("websites")
    .insert({
      user_id: user.id,
      name: body.name.trim(),
      lang: body.lang ?? "fr",
      theme,
      status: "draft",
      template_id: body.template_id ?? null,
      subdomain: body.subdomain ?? null,
    })
    .select()
    .single();

  if (siteErr) return NextResponse.json({ error: siteErr.message }, { status: 500 });

  // Créer les pages du template
  if (tpl?.pages?.length) {
    for (const [pi, tplPage] of tpl.pages.entries()) {
      const { data: page, error: pageErr } = await admin
        .from("website_pages")
        .insert({
          website_id: site.id,
          user_id: user.id,
          title: tplPage.title,
          slug: tplPage.slug,
          is_homepage: tplPage.isHome,
          in_nav: true,
          position: pi,
          status: "draft",
        })
        .select()
        .single();

      if (pageErr || !page) continue;

      // Insérer les sections de la page
      if (tplPage.sections?.length) {
        const sectionsToInsert = tplPage.sections.map((s, si) => {
          const meta = getSectionMeta(s.type as SectionType);
          return {
            page_id: page.id,
            website_id: site.id,
            user_id: user.id,
            type: s.type,
            position: si,
            visible: true,
            props: { ...(meta?.defaultProps ?? {}), ...s.props },
            styles: s.styles ?? {},
          };
        });
        await admin.from("website_sections").insert(sectionsToInsert);
      }
    }

    // Mettre à jour page_count
    await admin
      .from("websites")
      .update({ page_count: tpl.pages.length })
      .eq("id", site.id);
  } else {
    // Site blank — créer une page d'accueil vide
    await admin.from("website_pages").insert({
      website_id: site.id,
      user_id: user.id,
      title: "Accueil",
      slug: "accueil",
      is_homepage: true,
      in_nav: true,
      position: 0,
      status: "draft",
    });
    await admin.from("websites").update({ page_count: 1 }).eq("id", site.id);
  }

  // Recharger avec le page_count à jour
  const { data: fresh } = await admin.from("websites").select("*").eq("id", site.id).single();
  return NextResponse.json({ website: fresh }, { status: 201 });
}
