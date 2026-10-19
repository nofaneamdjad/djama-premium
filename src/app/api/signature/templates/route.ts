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

/* ── GET /api/signature/templates ── */
export async function GET() {
  const user = await getUser();
  if (!user) return err("Non authentifié", 401);

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("signature_templates")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return err(error.message, 500);
  return NextResponse.json({ templates: data ?? [] });
}

/* ── POST /api/signature/templates ── */
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return err("Non authentifié", 401);

  const { allowed } = await checkRateLimit(user.id, 30, 60 * 60 * 1000);
  if (!allowed) return err("Trop de requêtes.", 429);

  let body: { name: string; title: string; message?: string; sign_order?: string; signers?: unknown[] };
  try { body = await req.json(); }
  catch { return err("Corps JSON invalide"); }

  if (!body.name?.trim()) return err("Le nom du modèle est requis");
  if (!body.title?.trim()) return err("Le titre est requis");

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("signature_templates")
    .insert({
      user_id:    user.id,
      name:       body.name.trim(),
      title:      body.title.trim(),
      message:    body.message?.trim() ?? "",
      sign_order: body.sign_order ?? "parallel",
      signers:    body.signers ?? [],
    })
    .select()
    .single();

  if (error) return err(error.message, 500);
  return NextResponse.json({ template: data }, { status: 201 });
}
