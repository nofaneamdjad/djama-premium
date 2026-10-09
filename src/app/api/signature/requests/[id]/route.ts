import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function err(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

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

/* ── GET /api/signature/requests/[id] ── */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) return err("Non authentifié", 401);

  const { id } = await params;
  const admin = createSupabaseAdmin();

  const { data, error } = await admin
    .from("signature_requests")
    .select(`
      *,
      signers:signature_request_signers(*),
      events:signature_events(*)
    `)
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) return err("Demande introuvable", 404);
  return NextResponse.json({ request: data });
}

/* ── PATCH /api/signature/requests/[id] ── */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) return err("Non authentifié", 401);

  const { id } = await params;
  const admin = createSupabaseAdmin();

  // Verify ownership
  const { data: existing } = await admin
    .from("signature_requests")
    .select("id, status, user_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!existing) return err("Demande introuvable", 404);
  if (existing.status === "completed") return err("Impossible de modifier une demande finalisée", 403);
  if (existing.status === "cancelled") return err("La demande a été annulée", 403);

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return err("Corps JSON invalide"); }

  const allowed = ["title", "message", "sign_order", "expires_at"];
  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) patch[key] = body[key];
  }

  if (Object.keys(patch).length === 0) return err("Aucun champ à modifier");

  const { data, error } = await admin
    .from("signature_requests")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return err(error.message, 500);
  return NextResponse.json({ request: data });
}

/* ── DELETE /api/signature/requests/[id] ── */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) return err("Non authentifié", 401);

  const { id } = await params;
  const admin = createSupabaseAdmin();

  const { data: existing } = await admin
    .from("signature_requests")
    .select("id, status")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!existing) return err("Demande introuvable", 404);
  if (existing.status === "completed") return err("Impossible de supprimer une demande finalisée", 403);

  const { error } = await admin
    .from("signature_requests")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return err(error.message, 500);
  return NextResponse.json({ ok: true });
}
