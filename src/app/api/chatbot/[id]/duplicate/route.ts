import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// POST /api/chatbot/[id]/duplicate
export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const admin = createSupabaseAdmin();
  const { data: src } = await admin
    .from("chatbots")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!src) return NextResponse.json({ error: "Chatbot introuvable" }, { status: 404 });

  const { id: _id, public_id: _pub, created_at: _c, updated_at: _u,
    conversation_count: _cc, message_count: _mc, ...fields } = src as Record<string, unknown>;
  void _id; void _pub; void _c; void _u; void _cc; void _mc;

  const { data, error } = await admin
    .from("chatbots")
    .insert({
      ...fields,
      user_id:            user.id,
      name:               `Copie de ${src.name}`,
      status:             "draft",
      conversation_count: 0,
      message_count:      0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ chatbot: data });
}
