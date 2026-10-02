import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { checkRateLimitAsync as checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function makeSupabase(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
}

// GET /api/checklists — liste toutes les checklists accessibles par l'user
export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = makeSupabase(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const archived = searchParams.get("archived") === "true";
  const status = archived ? "archived" : "active";

  const { data, error } = await supabase
    .from("checklists")
    .select(`
      id, title, description, color, icon, visibility, status, pinned, sort_order,
      created_at, updated_at, owner_id,
      checklist_items(count)
    `)
    .eq("status", status)
    .order("pinned", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ checklists: data ?? [] });
}

// POST /api/checklists — créer une checklist
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = makeSupabase(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed } = await checkRateLimit(`checklists:create:${user.id}`, 30, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });

  // Résoudre org_id côté serveur — jamais depuis le client
  const { data: orgMember } = await supabase
    .from("org_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const organization_id = orgMember?.organization_id ?? user.id; // fallback: user_id comme org solo

  const body = await req.json() as {
    title: string;
    color?: string;
    icon?: string;
    visibility?: "private" | "team" | "shared";
    description?: string;
    items?: { text: string; priority?: string; due_date?: string }[];
  };

  if (!body.title?.trim()) return NextResponse.json({ error: "Titre requis." }, { status: 400 });

  const { data: checklist, error } = await supabase
    .from("checklists")
    .insert({
      title: body.title.trim(),
      color: body.color ?? "#6366f1",
      icon: body.icon ?? null,
      visibility: body.visibility ?? "private",
      description: body.description ?? null,
      owner_id: user.id,
      organization_id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Insérer les items initiaux si fournis
  if (body.items?.length) {
    const itemRows = body.items.map((it, idx) => ({
      checklist_id: checklist.id,
      organization_id,
      text: it.text,
      priority: it.priority ?? "normal",
      due_date: it.due_date ?? null,
      sort_order: idx,
    }));
    await supabase.from("checklist_items").insert(itemRows);
  }

  return NextResponse.json({ checklist }, { status: 201 });
}
