// CRUD sections — POST ajouter, PATCH réordonner/modifier visibilité
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
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

type Params = { params: Promise<{ id: string }> };

// POST /api/websites/[id]/sections — ajouter une section à une page
export async function POST(req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const body = await req.json() as {
    page_id: string;
    type: SectionType;
    position?: number;
    props?: Record<string, unknown>;
    styles?: Record<string, unknown>;
  };

  if (!body.page_id || !body.type) {
    return NextResponse.json({ error: "page_id et type requis" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const meta = getSectionMeta(body.type);

  // Position à la fin si non spécifiée
  let position = body.position;
  if (position === undefined) {
    const { count } = await admin
      .from("website_sections")
      .select("id", { count: "exact", head: true })
      .eq("page_id", body.page_id);
    position = count ?? 0;
  }

  const { data, error } = await admin
    .from("website_sections")
    .insert({
      page_id: body.page_id,
      website_id: id,
      user_id: user.id,
      type: body.type,
      position,
      visible: true,
      props: { ...(meta?.defaultProps ?? {}), ...(body.props ?? {}) },
      styles: body.styles ?? {},
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ section: data }, { status: 201 });
}

// PATCH /api/websites/[id]/sections — modifier une section (props, styles, visible, position)
// Body: { section_id, ...fields }
export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const body = await req.json() as { section_id: string } & Record<string, unknown>;

  if (!body.section_id) return NextResponse.json({ error: "section_id requis" }, { status: 400 });

  const allowed = ["props", "styles", "visible", "position"];
  const update: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in body) update[k] = body[k];
  }

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("website_sections")
    .update(update)
    .eq("id", body.section_id)
    .eq("website_id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ section: data });
}

// DELETE /api/websites/[id]/sections?section_id=xxx
export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const sectionId = req.nextUrl.searchParams.get("section_id");
  if (!sectionId) return NextResponse.json({ error: "section_id requis" }, { status: 400 });

  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("website_sections")
    .delete()
    .eq("id", sectionId)
    .eq("website_id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
