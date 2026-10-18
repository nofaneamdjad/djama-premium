import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

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

// GET /api/chatbot/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("chatbots")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!data) return NextResponse.json({ error: "Chatbot introuvable" }, { status: 404 });
  return NextResponse.json({ chatbot: data });
}

// PATCH /api/chatbot/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json() as Record<string, unknown>;

  // Champs immutables
  const { id: _id, user_id: _uid, public_id: _pub, created_at: _c,
    conversation_count: _cc, message_count: _mc, ...patch } = body;
  void _id; void _uid; void _pub; void _c; void _cc; void _mc;

  // Auto-publish_at lors de l'activation
  if (patch.status === "active") {
    (patch as Record<string, unknown>).updated_at = new Date().toISOString();
  }

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("chatbots")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data)  return NextResponse.json({ error: "Chatbot introuvable" }, { status: 404 });
  return NextResponse.json({ chatbot: data });
}

// DELETE /api/chatbot/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("chatbots")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
