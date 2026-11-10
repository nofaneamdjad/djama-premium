/**
 * GET /api/admin/stripe-config
 * État masqué de la configuration Stripe — aucune clé secrète exposée.
 *
 * Retourne :
 *   - environment : "test" | "live" | "not_configured"
 *   - key_prefix  : premiers caractères visibles (masqué)
 *   - last_verified : dernière vérification OK ou null
 *   - last_rotation : dernière rotation déclarée ou null
 *   - audit_log : 10 dernières entrées
 *
 * Droits : tout admin actif (can_view_payments ou super_admin)
 *
 * Sécurité C-06 :
 *   - Jamais la clé complète dans la réponse
 *   - Jamais la clé dans les logs
 */

import { NextRequest, NextResponse }     from "next/server";
import { requireAdminUser, logAdminAction } from "@/lib/admin-auth-v2";
import { createSupabaseAdmin }           from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function maskStripeKey(key: string | undefined): { prefix: string; environment: "test" | "live" | "not_configured" } {
  if (!key || key === "sk_test_placeholder" || key.length < 10) {
    return { prefix: "non configurée", environment: "not_configured" };
  }
  const env: "test" | "live" = key.startsWith("sk_live_") ? "live" : "test";
  const visible = key.slice(0, 14); // "sk_test_51ABCD"
  return { prefix: `${visible}…****`, environment: env };
}

function maskPublishableKey(key: string | undefined): string {
  if (!key || key === "pk_test_placeholder" || key.length < 10) return "non configurée";
  return `${key.slice(0, 14)}…****`;
}

export async function GET(req: NextRequest) {
  const { admin, deny } = await requireAdminUser(req, {
    logAction:   "STRIPE_CONFIG_VIEW",
    logResource: "stripe_config",
  });
  if (deny) return deny;

  const sb = createSupabaseAdmin();

  // Récupérer l'historique d'audit
  const { data: auditRows } = await sb
    .from("stripe_config_audit")
    .select("id, action, key_prefix, environment, verification_ok, stripe_account, webhook_status, ip_address, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  const lastVerified = auditRows?.find(r => r.action === "key_verified" && r.verification_ok === true);
  const lastRotation = auditRows?.find(r => r.action === "key_rotation_declared");

  // Statut masqué des clés depuis les env vars (serveur uniquement)
  const { prefix, environment } = maskStripeKey(process.env.STRIPE_SECRET_KEY);
  const pubKeyMasked = maskPublishableKey(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

  // Vérification environnement : alerter si clé live en dev
  const isDevEnv = process.env.NODE_ENV !== "production";
  const liveKeyInDev = isDevEnv && environment === "live";

  const webhookConfigured = !!(
    process.env.STRIPE_WEBHOOK_SECRET &&
    process.env.STRIPE_WEBHOOK_SECRET !== "whsec_placeholder"
  );

  const priceConfigured = !!(
    process.env.STRIPE_PRICE_ID &&
    process.env.STRIPE_PRICE_ID !== "price_test_placeholder"
  );

  // Enregistrer la consultation
  await sb.from("stripe_config_audit").insert({
    admin_user_id:  admin!.id,
    action:         "config_viewed",
    environment,
    ip_address:     req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
    user_agent:     req.headers.get("user-agent") ?? "",
  });

  await logAdminAction({
    admin,
    action:   "STRIPE_CONFIG_VIEW",
    resource: "stripe_config",
    ip:       req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
  });

  return NextResponse.json({
    status: {
      environment,
      secret_key_prefix:      prefix,
      publishable_key_prefix: pubKeyMasked,
      webhook_configured:     webhookConfigured,
      price_configured:       priceConfigured,
      live_key_in_dev:        liveKeyInDev,
    },
    last_verified:  lastVerified ? {
      at:              lastVerified.created_at,
      stripe_account:  lastVerified.stripe_account,
      webhook_status:  lastVerified.webhook_status,
    } : null,
    last_rotation:  lastRotation ? { at: lastRotation.created_at } : null,
    audit_log:      auditRows ?? [],
  });
}
