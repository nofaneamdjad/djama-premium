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

/* GET /api/reputation/widgets */
export async function GET(_req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const orgId = await getUserOrg(user.id);
  if (!orgId) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  const db = adminDb();
  const { data, error } = await db.from("rep_widgets")
    .select("id,name,widget_type,config,is_active,embed_key,view_count,created_at")
    .eq("org_id", orgId).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

/* POST /api/reputation/widgets */
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const orgId = await getUserOrg(user.id);
  if (!orgId) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  const db   = adminDb();
  const body = await req.json() as { name: string; widget_type?: string; config?: Record<string, unknown> };
  if (!body.name?.trim()) return NextResponse.json({ error: "Nom requis" }, { status: 400 });

  const { data, error } = await db.from("rep_widgets").insert({
    org_id:      orgId,
    name:        body.name.trim(),
    widget_type: body.widget_type ?? "badge",
    config:      body.config ?? {},
  }).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

/* PATCH /api/reputation/widgets */
export async function PATCH(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const orgId = await getUserOrg(user.id);
  if (!orgId) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  const db   = adminDb();
  const body = await req.json() as { id: string } & Record<string, unknown>;
  if (!body.id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const { data: existing } = await db.from("rep_widgets").select("org_id").eq("id", body.id).single();
  if (!existing || existing.org_id !== orgId) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const k of ["name","widget_type","config","is_active"]) {
    if (body[k] !== undefined) patch[k] = body[k];
  }

  const { data, error } = await db.from("rep_widgets").update(patch).eq("id", body.id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/* DELETE /api/reputation/widgets?id= */
export async function DELETE(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const orgId = await getUserOrg(user.id);
  if (!orgId) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const db = adminDb();
  const { data: existing } = await db.from("rep_widgets").select("org_id").eq("id", id).single();
  if (!existing || existing.org_id !== orgId) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  const { error } = await db.from("rep_widgets").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/* GET /api/reputation/widgets/embed?key= — données publiques pour embed */
export async function HEAD(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!key) return new NextResponse(null, { status: 400 });
  const db = adminDb();
  await db.from("rep_widgets").update({ view_count: adminDb().rpc("increment", { x: 1 }) as unknown as number })
    .eq("embed_key", key);
  return new NextResponse(null, { status: 200 });
}
