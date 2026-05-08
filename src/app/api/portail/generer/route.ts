/**
 * POST /api/portail/generer
 * Génère un lien de portail client sécurisé.
 * Body : { client_nom, client_email, expires_days? }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient }              from "@supabase/supabase-js";
import { createLogger }              from "@/lib/logger";
import crypto                        from "crypto";

export const runtime = "nodejs";

const log = createLogger("portail/generer");

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  const { client_nom, client_email, expires_days = 30 } = await req.json() as {
    client_nom: string;
    client_email: string;
    expires_days?: number;
  };

  if (!client_nom) {
    return NextResponse.json({ error: "client_nom requis" }, { status: 400 });
  }

  /* ── Auth check ── */
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const jwt = authHeader.slice(7);
  const { data: { user }, error: authErr } = await createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  ).auth.getUser(jwt);
  if (authErr || !user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  /* ── Génère un token sécurisé ── */
  const token      = crypto.randomBytes(32).toString("hex");
  const expires_at = new Date(Date.now() + expires_days * 86400 * 1000).toISOString();

  const { error: dbErr } = await supabaseAdmin
    .from("portail_clients")
    .upsert({
      user_id:     user.id,
      client_nom,
      client_email: client_email || null,
      token,
      expires_at,
    }, { onConflict: "user_id,client_nom" });

  if (dbErr) {
    log.error("DB error", dbErr);
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  const url = `${process.env.NEXT_PUBLIC_SITE_URL || "https://djama.space"}/portail/${token}`;
  return NextResponse.json({ url, token, expires_at });
}
