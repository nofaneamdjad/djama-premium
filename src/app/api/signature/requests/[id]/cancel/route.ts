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

/* ── POST /api/signature/requests/[id]/cancel ── */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) return err("Non authentifié", 401);

  const { id } = await params;
  const admin = createSupabaseAdmin();

  const { data: request } = await admin
    .from("signature_requests")
    .select("id, status, user_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!request) return err("Demande introuvable", 404);
  if (request.status === "completed") return err("Impossible d'annuler une demande finalisée", 403);
  if (request.status === "cancelled") return err("Cette demande est déjà annulée", 400);

  let reason = "";
  try {
    const body = await req.json();
    reason = body?.reason?.trim() ?? "";
  } catch { /* reason stays empty */ }

  const { error } = await admin
    .from("signature_requests")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return err(error.message, 500);

  await admin.from("signature_events").insert({
    request_id: id,
    event_type: "cancelled",
    metadata:   { reason: reason || "Annulé par le propriétaire", user_id: user.id },
  });

  return NextResponse.json({ ok: true });
}
