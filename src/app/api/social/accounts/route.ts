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

/* GET /api/social/accounts — Liste des comptes connectés */
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const db = adminDb();
  const { data, error } = await db
    .from("social_accounts")
    .select("id, platform, account_name, account_id, avatar_url, status, scopes, token_expires_at, last_checked_at, error_message, created_at")
    .eq("user_id", user.id)
    .order("platform");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

/* POST /api/social/accounts — Connecter un compte (mock OAuth — structure prête) */
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const db   = adminDb();
  const body = await req.json() as {
    platform:      string;
    account_name:  string;
    account_id:    string;
    avatar_url?:   string;
    access_token?: string;
    scopes?:       string[];
  };

  if (!body.platform || !body.account_name || !body.account_id) {
    return NextResponse.json({ error: "platform, account_name, account_id requis" }, { status: 400 });
  }

  const validPlatforms = ["instagram","facebook","linkedin","tiktok"];
  if (!validPlatforms.includes(body.platform)) {
    return NextResponse.json({ error: "Plateforme invalide" }, { status: 400 });
  }

  const { data, error } = await db
    .from("social_accounts")
    .upsert({
      user_id:      user.id,
      platform:     body.platform,
      account_name: body.account_name,
      account_id:   body.account_id,
      avatar_url:   body.avatar_url ?? null,
      scopes:       body.scopes ?? [],
      status:       "active",
      last_checked_at: new Date().toISOString(),
      updated_at:   new Date().toISOString(),
    }, { onConflict: "user_id,platform,account_id" })
    .select("id, platform, account_name, account_id, avatar_url, status, scopes")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

/* DELETE /api/social/accounts?id= — Déconnecter un compte */
export async function DELETE(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  const db = adminDb();
  const { data: existing } = await db.from("social_accounts").select("user_id").eq("id", id).single();
  if (!existing || existing.user_id !== user.id) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  // Révoquer = mettre status revoked (pas DELETE physique, pour audit)
  const { error } = await db.from("social_accounts")
    .update({ status: "revoked", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
