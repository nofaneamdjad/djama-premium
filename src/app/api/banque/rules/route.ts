import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function auth() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET(_req: NextRequest) {
  const { supabase, user } = await auth();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data, error } = await supabase.from("bank_rules")
    .select("*")
    .eq("user_id", user.id)
    .order("priority", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rules: data ?? [] });
}

export async function POST(req: NextRequest) {
  const { supabase, user } = await auth();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json();
  const { name, conditions, actions, priority, active } = body;

  if (!name?.trim()) return NextResponse.json({ error: "Nom requis" }, { status: 422 });
  if (!Array.isArray(conditions)) return NextResponse.json({ error: "conditions doit être un tableau" }, { status: 422 });
  if (!actions || typeof actions !== "object") return NextResponse.json({ error: "actions invalides" }, { status: 422 });

  const { data, error } = await supabase.from("bank_rules").insert({
    user_id:    user.id,
    name:       name.trim(),
    conditions,
    actions,
    priority:   priority ?? 100,
    active:     active ?? true,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rule: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { supabase, user } = await auth();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json();
  const { id, ...update } = body;
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 422 });

  const allowed = ["name", "conditions", "actions", "priority", "active"];
  const payload: Record<string, unknown> = {};
  for (const k of allowed) if (k in update) payload[k] = update[k];

  const { data, error } = await supabase.from("bank_rules")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rule: data });
}

export async function DELETE(req: NextRequest) {
  const { supabase, user } = await auth();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 422 });

  const { error } = await supabase.from("bank_rules")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
