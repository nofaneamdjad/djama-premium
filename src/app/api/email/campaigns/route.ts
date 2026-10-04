import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";

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
    .select("organization_id")
    .eq("user_id", userId)
    .is("suspended_at", null)
    .limit(1).single();
  return data?.organization_id ?? null;
}

const STATUSES = ["brouillon","a_valider","planifiee","en_cours","envoyee","annulee","echec"] as const;

/* GET /api/email/campaigns */
export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const orgId = await getUserOrg(user.id);
  if (!orgId) return NextResponse.json({ error: "Organisation introuvable" }, { status: 403 });

  const db = adminDb();
  const p  = req.nextUrl.searchParams;
  const status   = p.get("status") ?? "";
  const q        = p.get("q") ?? "";
  const limit    = Math.min(parseInt(p.get("limit") ?? "50"), 200);
  const offset   = parseInt(p.get("offset") ?? "0");

  let query = db.from("em_campaigns")
    .select("id,name,subject,preheader,status,scheduled_at,completed_at,stats_recipients,stats_sent,stats_delivered,stats_bounced,stats_opened,stats_clicked,stats_unsubscribed,ai_generated,created_at,updated_at", { count: "exact" })
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (q)      query = query.ilike("name", `%${q}%`);
  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaigns: data ?? [], total: count ?? 0 });
}

/* POST /api/email/campaigns */
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed } = checkRateLimit(user.id, 60, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });

  const orgId = await getUserOrg(user.id);
  if (!orgId) return NextResponse.json({ error: "Organisation introuvable" }, { status: 403 });

  const db   = adminDb();
  const body = await req.json() as {
    name: string; subject?: string; preheader?: string;
    blocks?: unknown[]; from_email?: string; from_name?: string;
    list_id?: string; segment_id?: string; scheduled_at?: string;
    ai_generated?: boolean; ai_brief?: string;
  };

  if (!body.name?.trim()) return NextResponse.json({ error: "Nom requis" }, { status: 400 });

  const { data, error } = await db.from("em_campaigns")
    .insert({
      org_id:       orgId,
      created_by:   user.id,
      name:         body.name.trim(),
      subject:      body.subject?.trim() ?? "",
      preheader:    body.preheader?.trim() ?? "",
      blocks:       body.blocks ?? [],
      from_email:   body.from_email ?? null,
      from_name:    body.from_name ?? null,
      list_id:      body.list_id ?? null,
      segment_id:   body.segment_id ?? null,
      scheduled_at: body.scheduled_at ?? null,
      ai_generated: body.ai_generated ?? false,
      ai_brief:     body.ai_brief ?? null,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

/* PATCH /api/email/campaigns */
export async function PATCH(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const orgId = await getUserOrg(user.id);
  if (!orgId) return NextResponse.json({ error: "Organisation introuvable" }, { status: 403 });

  const db   = adminDb();
  const body = await req.json() as { id: string } & Record<string, unknown>;
  if (!body.id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const { data: existing } = await db.from("em_campaigns").select("org_id,status").eq("id", body.id).single();
  if (!existing || existing.org_id !== orgId) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  // Empêcher la modification d'une campagne envoyée ou en cours (sauf annulation)
  if (existing.status === "envoyee" && body.status !== "annulee") {
    return NextResponse.json({ error: "Campagne déjà envoyée" }, { status: 400 });
  }

  if (body.status && !STATUSES.includes(body.status as typeof STATUSES[number])) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  // Si approbation
  const patch: Record<string, unknown> = { ...body };
  delete patch.id;
  patch.updated_at = new Date().toISOString();
  if (body.status === "planifiee" || body.status === "envoyee") {
    patch.approved_by = user.id;
    patch.approved_at = new Date().toISOString();
  }

  const { data, error } = await db.from("em_campaigns").update(patch).eq("id", body.id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/* DELETE /api/email/campaigns?id= */
export async function DELETE(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const orgId = await getUserOrg(user.id);
  if (!orgId) return NextResponse.json({ error: "Organisation introuvable" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const db = adminDb();
  const { data: existing } = await db.from("em_campaigns").select("org_id,status").eq("id", id).single();
  if (!existing || existing.org_id !== orgId) return NextResponse.json({ error: "Interdit" }, { status: 403 });
  if (["en_cours","envoyee"].includes(existing.status)) {
    return NextResponse.json({ error: "Impossible de supprimer une campagne en cours ou envoyée" }, { status: 400 });
  }

  const { error } = await db.from("em_campaigns").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
