import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ═══════════════════════════════════════════════════
   GET /api/calendar/callback
   — Reçoit le code OAuth2 de Google, échange contre tokens
   — Stocke les tokens dans google_calendar_tokens
═══════════════════════════════════════════════════ */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code  = searchParams.get("code");
  const state = searchParams.get("state");   // user_id
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://djama.space";

  /* Erreur consent Google */
  if (error) {
    return NextResponse.redirect(
      `${baseUrl}/client/planning?gcal=error&reason=${encodeURIComponent(error)}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${baseUrl}/client/planning?gcal=error&reason=missing_params`
    );
  }

  const clientId     = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      `${baseUrl}/client/planning?gcal=error&reason=server_config`
    );
  }

  const redirectUri = `${baseUrl}/api/calendar/callback`;

  /* Échange code → tokens */
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id:     clientId,
      client_secret: clientSecret,
      redirect_uri:  redirectUri,
      grant_type:    "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error("[calendar/callback] token exchange error:", err);
    return NextResponse.redirect(
      `${baseUrl}/client/planning?gcal=error&reason=token_exchange`
    );
  }

  const tokens = (await tokenRes.json()) as {
    access_token:  string;
    refresh_token?: string;
    token_type:    string;
    expires_in:    number;
    scope:         string;
  };

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  /* Sauvegarde dans Supabase (service role) */
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const upsertData: Record<string, unknown> = {
    user_id:      state,
    access_token: tokens.access_token,
    token_type:   tokens.token_type ?? "Bearer",
    expires_at:   expiresAt,
    scope:        tokens.scope,
    updated_at:   new Date().toISOString(),
  };

  /* refresh_token n'est fourni que la première fois (prompt=consent) */
  if (tokens.refresh_token) {
    upsertData.refresh_token = tokens.refresh_token;
  }

  const { error: dbErr } = await supabase
    .from("google_calendar_tokens")
    .upsert(upsertData, { onConflict: "user_id" });

  if (dbErr) {
    console.error("[calendar/callback] db upsert error:", dbErr);
    return NextResponse.redirect(
      `${baseUrl}/client/planning?gcal=error&reason=db_save`
    );
  }

  return NextResponse.redirect(`${baseUrl}/client/planning?gcal=connected`);
}
