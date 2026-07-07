import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// GET  /api/portail/messages?token=xxx  — list messages
// POST /api/portail/messages             — send message from client { token, text }

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token manquant" }, { status: 400 });

  const { data: portal, error } = await supabaseAdmin
    .from("portail_clients")
    .select("id, user_id, expires_at")
    .eq("token", token)
    .single();

  if (error || !portal) return NextResponse.json({ error: "Token invalide" }, { status: 404 });
  if (portal.expires_at && new Date(portal.expires_at) < new Date())
    return NextResponse.json({ error: "Lien expiré" }, { status: 403 });

  const { data: messages } = await supabaseAdmin
    .from("portail_messages")
    .select("id, from_role, text, created_at")
    .eq("portail_client_id", portal.id)
    .order("created_at", { ascending: true })
    .limit(100);

  return NextResponse.json({ messages: messages ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json() as { token?: string; text?: string };
  const { token, text } = body;

  if (!token || !text?.trim())
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });

  const { data: portal, error } = await supabaseAdmin
    .from("portail_clients")
    .select("id, user_id, expires_at")
    .eq("token", token)
    .single();

  if (error || !portal) return NextResponse.json({ error: "Token invalide" }, { status: 404 });
  if (portal.expires_at && new Date(portal.expires_at) < new Date())
    return NextResponse.json({ error: "Lien expiré" }, { status: 403 });

  const { data: msg, error: insertErr } = await supabaseAdmin
    .from("portail_messages")
    .insert({
      portail_client_id: portal.id,
      user_id: portal.user_id,
      from_role: "client",
      text: text.trim(),
    })
    .select("id, from_role, text, created_at")
    .single();

  if (insertErr) return NextResponse.json({ error: "Erreur envoi" }, { status: 500 });
  return NextResponse.json({ message: msg });
}
