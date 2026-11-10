/**
 * POST /api/admin/stripe-config/rotation-log
 * L'admin déclare avoir effectué une rotation de clé Stripe.
 * Enregistre l'événement dans stripe_config_audit avec re-auth obligatoire.
 *
 * Droits : super_admin uniquement
 * Re-auth : obligatoire (purpose = "stripe_rotation")
 * Rate limit : 1 rotation déclarée / 24h
 *
 * Corps : { reauth_token: string, notes?: string }
 *
 * Ne stocke jamais la clé secrète — uniquement le préfixe masqué lu depuis l'env.
 */

import { NextRequest, NextResponse }              from "next/server";
import { requireAdminUser, logAdminAction }       from "@/lib/admin-auth-v2";
import { verifyReauthToken }                      from "@/app/api/admin/auth/reauth/route";
import { createSupabaseAdmin }                    from "@/lib/supabase-server";
import { checkRateLimitAsync }                    from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function maskStripeKey(key: string | undefined): { prefix: string; environment: "test" | "live" | "not_configured" } {
  if (!key || key === "sk_test_placeholder" || key.length < 10) {
    return { prefix: "non configurée", environment: "not_configured" };
  }
  const env: "test" | "live" = key.startsWith("sk_live_") ? "live" : "test";
  return { prefix: `${key.slice(0, 14)}…****`, environment: env };
}

export async function POST(req: NextRequest) {
  const ip        = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const userAgent = req.headers.get("user-agent") ?? "";

  // super_admin uniquement pour déclarer une rotation
  const { admin, deny } = await requireAdminUser(req, {
    requiredRole:   "super_admin",
    logAction:      "STRIPE_ROTATION_LOG_ATTEMPT",
    logResource:    "stripe_config",
  });
  if (deny) return deny;

  // Rate limit : 1 déclaration / 24h
  const { allowed, resetAt } = await checkRateLimitAsync(`stripe_rotation_${admin!.id}`, 1, 24 * 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Rotation déjà déclarée dans les dernières 24h." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)) } }
    );
  }

  let reauthToken: string;
  let notes: string | undefined;
  try {
    const body = await req.json() as { reauth_token?: string; notes?: string };
    if (!body.reauth_token) {
      return NextResponse.json({ error: "reauth_token requis." }, { status: 400 });
    }
    reauthToken = body.reauth_token;
    notes       = body.notes?.slice(0, 500);
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  // Re-auth obligatoire
  const reauthOk = await verifyReauthToken(admin!.id, reauthToken, "stripe_rotation");
  if (!reauthOk) {
    return NextResponse.json({ error: "Token de ré-authentification invalide ou expiré." }, { status: 403 });
  }

  const { prefix, environment } = maskStripeKey(process.env.STRIPE_SECRET_KEY);
  const sb = createSupabaseAdmin();

  await sb.from("stripe_config_audit").insert({
    admin_user_id: admin!.id,
    action:        "key_rotation_declared",
    key_prefix:    prefix,
    environment,
    ip_address:    ip,
    user_agent:    userAgent,
    notes:         notes ?? null,
  });

  await logAdminAction({
    admin,
    action:   "STRIPE_KEY_ROTATION_DECLARED",
    resource: "stripe_config",
    ip, userAgent,
    details:  { environment, key_prefix: prefix, notes },
    severity: "warning",
  });

  return NextResponse.json({
    ok:          true,
    declared_at: new Date().toISOString(),
    environment,
    key_prefix:  prefix,
    message:     "Rotation déclarée. N'oubliez pas de relancer le serveur après rotation.",
  });
}
