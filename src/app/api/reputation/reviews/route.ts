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

/* GET /api/reputation/reviews */
export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const orgId = await getUserOrg(user.id);
  if (!orgId) return NextResponse.json({ error: "Organisation introuvable" }, { status: 403 });

  const db = adminDb();
  const p       = req.nextUrl.searchParams;
  const status  = p.get("status") ?? "";      // pending|published|hidden|flagged
  const rating  = p.get("rating") ?? "";      // 1-5, "low" (1-2), "high" (4-5)
  const q       = p.get("q") ?? "";
  const source  = p.get("source") ?? "";
  const noReply = p.get("no_reply") === "1";
  const limit   = Math.min(parseInt(p.get("limit") ?? "50"), 200);
  const offset  = parseInt(p.get("offset") ?? "0");

  let query = db.from("rep_reviews")
    .select("id,author_name,author_email,rating,message,source,provider,provider_url,response_text,response_at,response_published,status,is_featured,sentiment,themes,ai_reply_draft,contact_id,campaign_id,consent_publish,created_at,updated_at", { count: "exact" })
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (status)  query = query.eq("status", status);
  if (source)  query = query.eq("source", source);
  if (noReply) query = query.is("response_text", null);
  if (rating === "low")  query = query.lte("rating", 2);
  else if (rating === "high") query = query.gte("rating", 4);
  else if (rating) query = query.eq("rating", parseInt(rating));
  if (q) query = query.or(`author_name.ilike.%${q}%,message.ilike.%${q}%,author_email.ilike.%${q}%`);

  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reviews: data ?? [], total: count ?? 0 });
}

/* POST /api/reputation/reviews — soumission d'un avis (page publique via service_role) */
export async function POST(req: NextRequest) {
  const db   = adminDb();
  const body = await req.json() as {
    org_id: string; campaign_id?: string; contact_id?: string;
    author_name?: string; author_email?: string;
    rating: number; message?: string;
    consent_publish?: boolean;
    source?: string;
  };

  if (!body.org_id) return NextResponse.json({ error: "org_id requis" }, { status: 400 });
  if (!body.rating || body.rating < 1 || body.rating > 5)
    return NextResponse.json({ error: "Note invalide (1-5)" }, { status: 400 });

  // Vérifier que l'org existe
  const { data: org } = await db.from("organizations").select("id").eq("id", body.org_id).single();
  if (!org) return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 });

  const { data, error } = await db.from("rep_reviews").insert({
    org_id:          body.org_id,
    campaign_id:     body.campaign_id ?? null,
    contact_id:      body.contact_id ?? null,
    author_name:     body.author_name?.trim() ?? null,
    author_email:    body.author_email?.toLowerCase().trim() ?? null,
    rating:          body.rating,
    message:         body.message?.trim() ?? null,
    source:          body.source ?? "djama",
    consent_publish: body.consent_publish ?? false,
    consent_date:    body.consent_publish ? new Date().toISOString() : null,
    status:          "pending",
  }).select("id").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id }, { status: 201 });
}

/* PATCH /api/reputation/reviews — modération, réponse, is_featured */
export async function PATCH(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const orgId = await getUserOrg(user.id);
  if (!orgId) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  const db   = adminDb();
  const body = await req.json() as { id: string } & Record<string, unknown>;
  if (!body.id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  // Vérifier ownership
  const { data: existing } = await db.from("rep_reviews").select("org_id,status,message").eq("id", body.id).single();
  if (!existing || existing.org_id !== orgId) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  // Construire le patch — ne jamais modifier message original
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const allowed = ["status","is_featured","response_text","response_published","moderation_note","sentiment","themes","ai_reply_draft","contact_id"];
  for (const k of allowed) {
    if (body[k] !== undefined) patch[k] = body[k];
  }

  // Horodater la réponse
  if (body.response_text !== undefined && !existing.status?.startsWith("re")) {
    patch.response_at  = new Date().toISOString();
    patch.responded_by = user.id;
  }
  // Horodater la modération
  if (body.status !== undefined) {
    patch.moderated_by = user.id;
    patch.moderated_at = new Date().toISOString();
  }

  const { data, error } = await db.from("rep_reviews").update(patch).eq("id", body.id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit
  await db.from("rep_audit_log").insert({
    org_id: orgId, user_id: user.id, review_id: body.id,
    action: Object.keys(patch).join(","),
    details: { before: { status: existing.status }, after: patch },
  });

  return NextResponse.json(data);
}
