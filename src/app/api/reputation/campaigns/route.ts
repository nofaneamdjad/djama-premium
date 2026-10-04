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

function genSlug(name: string, suffix: string) {
  return name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    .slice(0, 40) + "-" + suffix;
}

/* GET /api/reputation/campaigns */
export async function GET(_req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const orgId = await getUserOrg(user.id);
  if (!orgId) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  const db = adminDb();
  const { data, error } = await db.from("rep_campaigns")
    .select("*").eq("org_id", orgId).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

/* POST /api/reputation/campaigns */
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const orgId = await getUserOrg(user.id);
  if (!orgId) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  const body = await req.json() as {
    name: string; type?: string; question?: string;
    collect_name?: boolean; collect_email?: boolean;
    auto_trigger?: string | null; delay_days?: number;
  };
  if (!body.name?.trim()) return NextResponse.json({ error: "Nom requis" }, { status: 400 });

  const db   = adminDb();
  const slug = genSlug(body.name, Math.random().toString(36).slice(2, 8));

  const { data, error } = await db.from("rep_campaigns").insert({
    org_id:        orgId,
    created_by:    user.id,
    name:          body.name.trim(),
    type:          body.type ?? "general",
    slug,
    question:      body.question?.trim() ?? "Comment s\'était passée votre expérience avec nous ?",
    collect_name:  body.collect_name ?? true,
    collect_email: body.collect_email ?? false,
    auto_trigger:  body.auto_trigger ?? null,
    delay_days:    body.delay_days ?? 1,
  }).select("*").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

/* PATCH /api/reputation/campaigns */
export async function PATCH(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const orgId = await getUserOrg(user.id);
  if (!orgId) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  const db   = adminDb();
  const body = await req.json() as { id: string } & Record<string, unknown>;
  if (!body.id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const { data: existing } = await db.from("rep_campaigns").select("org_id").eq("id", body.id).single();
  if (!existing || existing.org_id !== orgId) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const k of ["name","type","question","is_active","collect_name","collect_email","auto_trigger","delay_days"]) {
    if (body[k] !== undefined) patch[k] = body[k];
  }

  const { data, error } = await db.from("rep_campaigns").update(patch).eq("id", body.id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/* DELETE /api/reputation/campaigns?id= */
export async function DELETE(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const orgId = await getUserOrg(user.id);
  if (!orgId) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const db = adminDb();
  const { data: existing } = await db.from("rep_campaigns").select("org_id").eq("id", id).single();
  if (!existing || existing.org_id !== orgId) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  const { error } = await db.from("rep_campaigns").update({ is_active: false }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
