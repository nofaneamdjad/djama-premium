/**
 * POST /api/admin/stripe-config/verify
 * Vérifie la clé Stripe courante via l'API Stripe sans exposer le secret.
 *
 * Droits : can_manage_payments
 * Re-auth : non requise (lecture seule)
 * Rate limit : 5 vérifications / 10 min par admin
 *
 * Retourne :
 *   - valid: boolean
 *   - environment: "test" | "live"
 *   - account_name: string (business_profile.name masqué)
 *   - webhook_configured: boolean
 *
 * Ne retourne JAMAIS la clé secrète ou son contenu complet.
 */

import { NextRequest, NextResponse }              from "next/server";
import Stripe                                     from "stripe";
import { requireAdminUser, logAdminAction }       from "@/lib/admin-auth-v2";
import { createSupabaseAdmin }                    from "@/lib/supabase-server";
import { checkRateLimitAsync }                    from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function maskStripeKey(key: string): string {
  if (key.length < 10) return "****";
  return `${key.slice(0, 14)}…****`;
}

export async function POST(req: NextRequest) {
  const ip        = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const userAgent = req.headers.get("user-agent") ?? "";

  const { admin, deny } = await requireAdminUser(req, {
    requiredPermission: "can_manage_payments",
    logAction:          "STRIPE_CONFIG_VERIFY_ATTEMPT",
    logResource:        "stripe_config",
  });
  if (deny) return deny;

  // Rate limit : 5 vérifications / 10 min par admin
  const { allowed, resetAt } = await checkRateLimitAsync(admin!.id, 5, 10 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Trop de vérifications. Réessayez dans quelques minutes." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)) } }
    );
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || secretKey === "sk_test_placeholder") {
    return NextResponse.json({ valid: false, error: "STRIPE_SECRET_KEY non configurée." }, { status: 400 });
  }

  const environment: "test" | "live" = secretKey.startsWith("sk_live_") ? "live" : "test";

  // Alerte sécurité : clé live en environnement non-production
  const isDevEnv = process.env.NODE_ENV !== "production";
  if (isDevEnv && environment === "live") {
    await logAdminAction({
      admin, action: "STRIPE_LIVE_KEY_IN_DEV", resource: "stripe_config", ip, userAgent,
      details: { environment: process.env.NODE_ENV }, severity: "warning",
    });
    return NextResponse.json({
      valid:       false,
      environment: "live",
      error:       "⚠️ Clé Stripe LIVE détectée en environnement de développement. Utilisez sk_test_* en dev/staging.",
    }, { status: 400 });
  }

  let valid        = false;
  let accountName  = "";
  let verifyError  = "";

  try {
    const stripe  = new Stripe(secretKey, { apiVersion: "2026-03-25.dahlia" });
    const account = await stripe.accounts.retrieve();
    accountName = account.business_profile?.name ?? account.email ?? "Compte vérifié";
    valid = true;
  } catch (err) {
    verifyError = err instanceof Error ? err.message : "Erreur inconnue";
    // Ne pas exposer le message d'erreur Stripe complet (peut contenir des infos sensibles)
    if (verifyError.includes("No such") || verifyError.includes("Invalid API key")) {
      verifyError = "Clé API invalide ou révoquée.";
    } else if (verifyError.includes("network")) {
      verifyError = "Erreur réseau — vérifiez la connectivité.";
    } else {
      verifyError = "Erreur de vérification Stripe.";
    }
  }

  const sb = createSupabaseAdmin();
  const prefix = maskStripeKey(secretKey);

  // Enregistrer dans l'audit
  await sb.from("stripe_config_audit").insert({
    admin_user_id:   admin!.id,
    action:          "key_verified",
    key_prefix:      prefix,
    environment,
    verification_ok: valid,
    stripe_account:  valid ? accountName : null,
    webhook_status:  "unchecked",
    ip_address:      ip,
    user_agent:      userAgent,
  });

  await logAdminAction({
    admin,
    action:   valid ? "STRIPE_CONFIG_VERIFY_SUCCESS" : "STRIPE_CONFIG_VERIFY_FAILED",
    resource: "stripe_config",
    ip, userAgent,
    details:  { environment, valid },
    severity: valid ? "info" : "warning",
  });

  if (!valid) {
    return NextResponse.json({ valid: false, environment, error: verifyError }, { status: 400 });
  }

  return NextResponse.json({
    valid:       true,
    environment,
    account_name: accountName,
    key_prefix:  prefix,
  });
}
