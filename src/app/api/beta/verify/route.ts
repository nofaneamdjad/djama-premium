/**
 * GET /api/beta/verify?token=xxx
 * Vérifie la validité d'un token d'invitation bêta.
 * Accessible publiquement — ne révèle pas les données sensibles.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token || token.length < 20) {
    return NextResponse.json({ valid: false, reason: "Token invalide" }, { status: 400 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data: invite, error } = await admin
    .from("beta_invites")
    .select("id, email, status, expires_at, modules")
    .eq("token", token)
    .single();

  if (error || !invite) return NextResponse.json({ valid: false, reason: "Token inconnu" }, { status: 404 });
  if (invite.status === "revoked") return NextResponse.json({ valid: false, reason: "Invitation révoquée" }, { status: 403 });
  if (invite.status === "expired") return NextResponse.json({ valid: false, reason: "Invitation expirée" }, { status: 403 });
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    await admin.from("beta_invites").update({ status: "expired" }).eq("id", invite.id);
    return NextResponse.json({ valid: false, reason: "Invitation expirée" }, { status: 403 });
  }

  // Masque partiellement l'email
  const emailParts = invite.email.split("@");
  const maskedEmail = emailParts[0].slice(0, 2) + "***@" + emailParts[1];

  return NextResponse.json({
    valid: true,
    email_hint: maskedEmail,
    modules: invite.modules ?? [],
    status: invite.status,
  });
}

// POST /api/beta/verify — marque l'invite comme acceptée après inscription réussie
export async function POST(req: NextRequest) {
  const body = await req.json() as { token?: string };
  const { token } = body;
  if (!token) return NextResponse.json({ error: "Token requis" }, { status: 400 });

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  await admin.from("beta_invites")
    .update({ status: "accepted", accepted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("token", token)
    .in("status", ["pending", "sent"]);

  return NextResponse.json({ ok: true });
}
