/**
 * GET   /api/admin/beta/feedback — liste les feedbacks bêta
 * PATCH /api/admin/beta/feedback — répondre / changer le statut
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function GET(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const url    = new URL(req.url);
  const status = url.searchParams.get("status");
  const type   = url.searchParams.get("type");
  const admin  = getAdmin();

  let query = admin
    .from("beta_feedback")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (status) query = query.eq("status", status);
  if (type)   query = query.eq("type",   type);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ feedbacks: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const body = await req.json() as { id?: string; status?: string; admin_reply?: string };
  if (!body.id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.status      ) updates.status      = body.status;
  if (body.admin_reply !== undefined) {
    updates.admin_reply = body.admin_reply;
    updates.replied_at  = new Date().toISOString();
    if (!body.status) updates.status = "in_progress";
  }

  const admin = getAdmin();
  const { error } = await admin
    .from("beta_feedback")
    .update(updates)
    .eq("id", body.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
