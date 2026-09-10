/**
 * /api/admin/clients/[id]
 *
 * GET   → fiche complète d'un utilisateur (client + user_access + messages)
 * PATCH → mettre à jour le statut / champs du client
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const PATCHABLE = new Set(["name", "phone", "country", "company", "statut", "source", "notes"]);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const { id } = await params;
  const sb = getAdmin();

  const [clientRes, accessRes, messagesRes] = await Promise.all([
    sb.from("clients").select("*").eq("id", id).single(),
    sb.from("user_access").select("*").eq("id", id).maybeSingle(),
    sb.from("contact_messages").select("id, subject, message, status, created_at")
      .or(`email.eq.${(await sb.from("clients").select("email").eq("id", id).single()).data?.email ?? ""}`)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (clientRes.error && clientRes.error.code === "PGRST116") {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  if (clientRes.error) {
    return NextResponse.json({ error: clientRes.error.message }, { status: 500 });
  }

  /* Récupérer aussi user_access par email si pas trouvé par id */
  let accessData = accessRes.data;
  if (!accessData && clientRes.data?.email) {
    const byEmail = await sb
      .from("user_access")
      .select("*")
      .eq("email", clientRes.data.email)
      .maybeSingle();
    accessData = byEmail.data ?? null;
  }

  return NextResponse.json({
    client:   clientRes.data,
    access:   accessData,
    messages: messagesRes.data ?? [],
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const { id } = await params;
  const body = await req.json() as Record<string, unknown>;

  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (PATCHABLE.has(k)) fields[k] = v;
  }
  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: "Aucun champ valide" }, { status: 400 });
  }

  const sb = getAdmin();
  const { error } = await sb.from("clients").update(fields).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
