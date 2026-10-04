import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
async function getUser() {
  const cs = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cs.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await sb.auth.getUser();
  return user;
}
async function getUserOrg(userId: string) {
  const db = adminDb();
  const { data } = await db.from("organization_members")
    .select("organization_id").eq("user_id", userId).is("suspended_at", null).limit(1).single();
  return data?.organization_id ?? null;
}

/* GET /api/email/suppressions */
export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const orgId = await getUserOrg(user.id);
  if (!orgId) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  const db = adminDb();
  const limit  = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "100"), 500);
  const { data, error } = await db.from("em_suppressions")
    .select("id,email,reason,created_at").eq("org_id", orgId)
    .order("created_at", { ascending: false }).limit(limit);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

/* POST /api/email/suppressions — ajouter manuellement */
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const orgId = await getUserOrg(user.id);
  if (!orgId) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  const body = await req.json() as { email: string; reason?: string };
  if (!body.email?.trim()) return NextResponse.json({ error: "email requis" }, { status: 400 });

  const db = adminDb();
  const { error } = await db.from("em_suppressions").upsert({
    org_id: orgId, email: body.email.toLowerCase().trim(),
    reason: body.reason ?? "manual",
  }, { onConflict: "org_id,email" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mettre à jour le statut marketing du contact
  await db.from("em_contact_marketing")
    .update({ global_status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
    .eq("org_id", orgId).eq("email", body.email.toLowerCase().trim());

  return NextResponse.json({ ok: true });
}
