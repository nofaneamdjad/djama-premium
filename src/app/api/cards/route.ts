import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { generateSlug, getTemplate } from "@/lib/cards/templates";
import type { BusinessCard } from "@/lib/cards/types";

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

// GET /api/cards — liste des cartes de l'utilisateur
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("business_cards")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ cards: data ?? [] });
}

// POST /api/cards — créer une nouvelle carte
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json() as Partial<BusinessCard> & {
    firstName?: string; lastName?: string;
  };

  const admin = createSupabaseAdmin();

  // Générer un slug unique
  const firstName = body.first_name ?? body.firstName ?? "";
  const lastName  = body.last_name  ?? body.lastName  ?? "";
  let slug = generateSlug(firstName || "ma", lastName || "carte");
  if (!slug) slug = `carte-${Date.now()}`;

  // Vérifier unicité et ajouter suffixe si nécessaire
  let attempt = 0;
  while (attempt < 10) {
    const candidate = attempt === 0 ? slug : `${slug}-${attempt}`;
    const { data: existing } = await admin
      .from("business_cards")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!existing) { slug = candidate; break; }
    attempt++;
  }
  if (attempt === 10) slug = `${slug}-${Date.now()}`;

  const template = getTemplate(body.template_id ?? "minimaliste");

  // Email par défaut depuis auth
  const { data: authUser } = await admin.auth.admin.getUserById(user.id);
  const defaultEmail = authUser?.user?.email ?? null;

  const { data: card, error } = await admin
    .from("business_cards")
    .insert({
      user_id:     user.id,
      slug,
      name:        `${firstName} ${lastName}`.trim() || "Ma carte",
      first_name:  firstName || null,
      last_name:   lastName  || null,
      email:       defaultEmail,
      template_id: template.id,
      theme:       template.theme,
      status:      "draft",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ card }, { status: 201 });
}
