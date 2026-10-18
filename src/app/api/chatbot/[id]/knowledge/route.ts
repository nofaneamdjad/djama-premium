import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { processDocument } from "@/lib/chatbot/rag";

export const dynamic = "force-dynamic";
export const runtime  = "nodejs";

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

// GET /api/chatbot/[id]/knowledge — liste les documents
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const user   = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const admin = createSupabaseAdmin();

  // Vérifier ownership
  const { data: bot } = await admin.from("chatbots").select("id").eq("id", id).eq("user_id", user.id).single();
  if (!bot) return NextResponse.json({ error: "Chatbot introuvable" }, { status: 404 });

  const { data, error } = await admin
    .from("chatbot_documents")
    .select("id, type, title, status, chunk_count, error_message, created_at, url")
    .eq("chatbot_id", id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ documents: data ?? [] });
}

// POST /api/chatbot/[id]/knowledge — ajouter un document
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const user   = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json() as {
    type:    "text" | "faq" | "url";
    title:   string;
    content?: string;
    url?:    string;
    faq?:    { q: string; a: string }[];
  };

  if (!body.type || !body.title) {
    return NextResponse.json({ error: "type et title requis" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const { data: bot } = await admin.from("chatbots").select("id").eq("id", id).eq("user_id", user.id).single();
  if (!bot) return NextResponse.json({ error: "Chatbot introuvable" }, { status: 404 });

  let content: string | null = null;
  let url: string | null = null;

  if (body.type === "text")  content = body.content ?? null;
  if (body.type === "faq")   content = JSON.stringify(body.faq ?? []);
  if (body.type === "url") {
    url = body.url ?? null;
    if (!url) return NextResponse.json({ error: "url requis" }, { status: 400 });
  }

  const { data: doc, error } = await admin
    .from("chatbot_documents")
    .insert({
      chatbot_id: id,
      user_id:    user.id,
      type:       body.type,
      title:      body.title,
      content,
      url,
      status:     "pending",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Lancer le traitement en arrière-plan (fire-and-forget)
  if (process.env.OPENAI_API_KEY) {
    processDocument(doc.id, id).catch(err => {
      console.error("processDocument error:", err);
    });
  }

  return NextResponse.json({ document: doc }, { status: 201 });
}
