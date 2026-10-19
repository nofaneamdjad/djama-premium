import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { checkRateLimitAsync as checkRateLimit } from "@/lib/rate-limit";

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

/* ── GET /api/signature/requests ── */
export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return err("Non authentifié", 401);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const admin = createSupabaseAdmin();
  let q = admin
    .from("signature_requests")
    .select(`
      *,
      signers:signature_request_signers(id,name,email,role,order_index,status,signed_at,viewed_at),
      events:signature_events(id,event_type,created_at)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (status && status !== "all") {
    q = q.eq("status", status);
  }

  const { data, error } = await q;
  if (error) return err(error.message, 500);
  return NextResponse.json({ requests: data ?? [] });
}

/* ── POST /api/signature/requests ── */
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return err("Non authentifié", 401);

  const { allowed } = await checkRateLimit(user.id, 50, 60 * 60 * 1000);
  if (!allowed) return err("Trop de requêtes. Réessayez dans une heure.", 429);

  let body: {
    title: string;
    message?: string;
    sign_order?: string;
    expires_at?: string | null;
    signers?: Array<{ name: string; email: string; phone?: string; role?: string; order_index?: number }>;
  };

  try { body = await req.json(); }
  catch { return err("Corps JSON invalide"); }

  const title = body.title?.trim();
  if (!title) return err("Le titre est requis");
  if (title.length > 255) return err("Titre trop long (max 255 caractères)");

  const admin = createSupabaseAdmin();

  const { data: request, error: reqErr } = await admin
    .from("signature_requests")
    .insert({
      user_id:    user.id,
      title,
      message:    body.message?.trim() ?? "",
      sign_order: body.sign_order ?? "parallel",
      expires_at: body.expires_at ?? null,
      status:     "draft",
    })
    .select()
    .single();

  if (reqErr || !request) return err(reqErr?.message ?? "Erreur création", 500);

  // Insert signers if provided
  if (body.signers && body.signers.length > 0) {
    const signers = body.signers.map((s, i) => ({
      request_id:  request.id,
      name:        s.name.trim(),
      email:       s.email.trim().toLowerCase(),
      phone:       s.phone?.trim() ?? null,
      role:        s.role ?? "signataire",
      order_index: s.order_index ?? i,
    }));

    const { error: sigErr } = await admin
      .from("signature_request_signers")
      .insert(signers);

    if (sigErr) {
      await admin.from("signature_requests").delete().eq("id", request.id);
      return err(sigErr.message, 500);
    }
  }

  // Log event
  await admin.from("signature_events").insert({
    request_id: request.id,
    event_type: "created",
    metadata:   { title, user_id: user.id },
  });

  return NextResponse.json({ request }, { status: 201 });
}
