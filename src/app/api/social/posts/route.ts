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

const ALLOWED_STATUSES = ["brouillon","planifié","en_file","publication","publié","échec"] as const;
type PostStatus = typeof ALLOWED_STATUSES[number];

/* GET /api/social/posts
   ?status= brouillon|planifié|publié|échec
   ?platform= instagram|facebook|linkedin|tiktok
   ?campaign_id=
   ?q= recherche texte
   ?limit= &offset=
*/
export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const db = adminDb();
  const p  = req.nextUrl.searchParams;
  const status    = p.get("status") ?? "";
  const platform  = p.get("platform") ?? "";
  const campaignId= p.get("campaign_id") ?? "";
  const q         = p.get("q") ?? "";
  const limit     = Math.min(parseInt(p.get("limit") ?? "50"), 200);
  const offset    = parseInt(p.get("offset") ?? "0");

  let query = db
    .from("social_posts")
    .select(`
      id, platform, content, hashtags, status, scheduled_at, published_at,
      media_urls, ai_generated, ai_prompt, variants, campaign_id,
      external_id, external_url, error_message, retry_count,
      approval_status, created_at, updated_at
    `, { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (status)     query = query.eq("status", status);
  if (platform)   query = query.eq("platform", platform);
  if (campaignId) query = query.eq("campaign_id", campaignId);
  if (q)          query = query.ilike("content", `%${q}%`);
  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data ?? [], total: count ?? 0 });
}

/* POST /api/social/posts — Créer un post (brouillon ou planifié) */
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed } = checkRateLimit(user.id, 60, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });

  const db   = adminDb();
  const body = await req.json() as {
    platforms:    string[];
    content:      string;
    hashtags?:    string[];
    variants?:    Record<string, { content: string; hashtags?: string[] }>;
    scheduled_at?:string | null;
    media_urls?:  string[];
    campaign_id?: string | null;
    ai_generated?:boolean;
    ai_prompt?:   string;
    status?:      PostStatus;
  };

  if (!body.content?.trim() && !Object.values(body.variants ?? {}).some(v => v.content?.trim())) {
    return NextResponse.json({ error: "Contenu requis" }, { status: 400 });
  }
  if (!body.platforms?.length) return NextResponse.json({ error: "Plateforme requise" }, { status: 400 });

  const status: PostStatus = body.status ?? (body.scheduled_at ? "planifié" : "brouillon");

  const inserts = body.platforms.map(platform => ({
    user_id:      user.id,
    platform,
    content:      body.content?.trim() ?? "",
    hashtags:     body.hashtags ?? [],
    variants:     body.variants ?? {},
    status,
    scheduled_at: body.scheduled_at ?? null,
    media_urls:   body.media_urls ?? [],
    campaign_id:  body.campaign_id ?? null,
    ai_generated: body.ai_generated ?? false,
    ai_prompt:    body.ai_prompt ?? null,
  }));

  const { data, error } = await db.from("social_posts").insert(inserts).select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data }, { status: 201 });
}

/* PATCH /api/social/posts — Mettre à jour un post */
export async function PATCH(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const db   = adminDb();
  const body = await req.json() as { id: string } & Record<string, unknown>;
  if (!body.id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  // Vérifier ownership
  const { data: existing } = await db.from("social_posts").select("id, user_id").eq("id", body.id).single();
  if (!existing || existing.user_id !== user.id) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  const { id: _id, ...patch } = body;
  patch.updated_at = new Date().toISOString();

  if (patch.status && !ALLOWED_STATUSES.includes(patch.status as PostStatus)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  const { data, error } = await db.from("social_posts").update(patch).eq("id", body.id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/* DELETE /api/social/posts?id= */
export async function DELETE(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  const db = adminDb();
  const { data: existing } = await db.from("social_posts").select("user_id").eq("id", id).single();
  if (!existing || existing.user_id !== user.id) return NextResponse.json({ error: "Interdit" }, { status: 403 });
  const { error } = await db.from("social_posts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
