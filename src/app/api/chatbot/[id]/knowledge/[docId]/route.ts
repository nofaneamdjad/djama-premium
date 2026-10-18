import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { processDocument } from "@/lib/chatbot/rag";

export const dynamic = "force-dynamic";
export const runtime  = "nodejs";

type Params = { params: Promise<{ id: string; docId: string }> };

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

async function verifyOwnership(chatbotId: string, docId: string, userId: string) {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("chatbot_documents")
    .select("id")
    .eq("id", docId)
    .eq("chatbot_id", chatbotId)
    .eq("user_id", userId)
    .single();
  return !!data;
}

// DELETE /api/chatbot/[id]/knowledge/[docId]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id, docId } = await params;
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  if (!(await verifyOwnership(id, docId, user.id))) {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  }

  const admin = createSupabaseAdmin();
  const { error } = await admin.from("chatbot_documents").delete().eq("id", docId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Màj compteur
  const { count } = await admin
    .from("chatbot_documents")
    .select("*", { count: "exact", head: true })
    .eq("chatbot_id", id)
    .eq("status", "ready");

  await admin.from("chatbots")
    .update({ document_count: count ?? 0, rag_enabled: (count ?? 0) > 0 })
    .eq("id", id);

  return NextResponse.json({ ok: true });
}

// POST /api/chatbot/[id]/knowledge/[docId] — re-traitement (re-embed)
export async function POST(_req: NextRequest, { params }: Params) {
  const { id, docId } = await params;
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  if (!(await verifyOwnership(id, docId, user.id))) {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY manquante" }, { status: 503 });
  }

  processDocument(docId, id).catch(err => console.error("reembed error:", err));
  return NextResponse.json({ ok: true, message: "Traitement lancé" });
}
