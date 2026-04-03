/**
 * Helpers partagés — gestion des abonnements DJAMA
 *
 * Utilisé par les routes PayPal (capture + webhook).
 * Le webhook Stripe possède sa propre implémentation interne.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { sendWelcomeEmail } from "@/lib/email";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/* ── Supabase Admin ───────────────────────────────────────── */
export function getSupabaseAdmin(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/* ── Trouver un utilisateur par email ─────────────────────── */
export async function findUserByEmail(email: string) {
  const supabase = getSupabaseAdmin();
  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  return users.find((u) => u.email === email) ?? null;
}

/* ── Trouver un utilisateur par son userId ────────────────── */
export async function findUserById(userId: string) {
  const supabase = getSupabaseAdmin();
  const { data: { user } } = await supabase.auth.admin.getUserById(userId);
  return user ?? null;
}

/* ── Trouver un utilisateur par paypal_subscription_id ───── */
export async function findUserByPayPalSubId(paypalSubId: string) {
  const supabase = getSupabaseAdmin();
  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  return (
    users.find((u) => u.user_metadata?.paypal_subscription_id === paypalSubId) ?? null
  );
}

/* ── Upsert table clients ─────────────────────────────────── */
export async function upsertClientRecord(opts: {
  userId:               string;
  email:                string;
  fullName:             string | null;
  paypalSubscriptionId: string;
  subscriptionActive:   boolean;
}) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("clients").upsert(
    {
      user_id:               opts.userId,
      email:                 opts.email,
      full_name:             opts.fullName,
      paypal_subscription_id: opts.paypalSubscriptionId,
      subscription_active:   opts.subscriptionActive,
      abonnement:            opts.subscriptionActive ? "outils_djama" : null,
      statut:                opts.subscriptionActive ? "actif" : "inactif",
      updated_at:            new Date().toISOString(),
    },
    { onConflict: "email" }
  );

  if (error) {
    console.error("[SubHelpers] ❌ clients upsert error:", error.message);
  } else {
    console.log(
      "[SubHelpers] ✅ Table clients →",
      opts.subscriptionActive ? "actif" : "inactif",
      "(", opts.email, ")"
    );
  }
}

/* ─────────────────────────────────────────────────────────────
   Activer ou créer un utilisateur (flux PayPal complet)
   Retourne userId + isNewUser + accessLink
───────────────────────────────────────────────────────────── */
export async function activateOrCreateUser(opts: {
  email:                string;
  fullName:             string | null;
  providedUserId:       string | null;   // client_reference_id ou custom_id PayPal
  paypalSubscriptionId: string;
}): Promise<{ userId: string; isNewUser: boolean; accessLink: string }> {
  const { email, fullName, providedUserId, paypalSubscriptionId } = opts;
  const supabase = getSupabaseAdmin();

  /* ── 1. Trouver ou créer le compte Supabase ──────────────── */
  let existingUser = providedUserId
    ? await findUserById(providedUserId)
    : await findUserByEmail(email);

  let isNewUser = false;
  let userId: string;

  if (!existingUser) {
    /* Nouveau client — créer le compte */
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name:             fullName,
        subscription_active:   true,
        abonnement:            "outils_djama",
        statut:                "actif",
        paypal_subscription_id: paypalSubscriptionId,
      },
    });

    if (error || !data.user) {
      throw new Error(`createUser failed: ${error?.message ?? "unknown"}`);
    }

    existingUser = data.user;
    userId       = data.user.id;
    isNewUser    = true;
    console.log("[SubHelpers] 👤 Nouveau compte PayPal créé — userId:", userId);
  } else {
    userId = existingUser.id;
    await supabase.auth.admin.updateUserById(existingUser.id, {
      user_metadata: {
        ...existingUser.user_metadata,
        full_name:             fullName ?? existingUser.user_metadata?.full_name,
        subscription_active:   true,
        abonnement:            "outils_djama",
        statut:                "actif",
        paypal_subscription_id: paypalSubscriptionId,
      },
    });
    console.log("[SubHelpers] 🔄 Compte existant mis à jour — userId:", userId);
  }

  /* ── 2. Upsert table clients ─────────────────────────────── */
  await upsertClientRecord({
    userId,
    email,
    fullName,
    paypalSubscriptionId,
    subscriptionActive: true,
  });

  /* ── 3. Générer le lien d'accès ──────────────────────────── */
  let accessLink = `${SITE_URL}/client`;

  try {
    const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
      type:    isNewUser ? "invite" : "magiclink",
      email,
      options: { redirectTo: `${SITE_URL}/client` },
    });

    if (linkErr) {
      console.warn("[SubHelpers] ⚠️ generateLink error:", linkErr.message);
    } else if (linkData?.properties?.action_link) {
      accessLink = linkData.properties.action_link;
    }
  } catch (e) {
    console.warn("[SubHelpers] ⚠️ generateLink exception:", e);
  }

  /* ── 4. Envoyer l'email de bienvenue ─────────────────────── */
  await sendWelcomeEmail({ email, fullName, accessLink, isNewUser });

  console.log(
    "[SubHelpers] ✅ Activation PayPal complète →",
    email,
    isNewUser ? "(nouveau)" : "(existant)"
  );

  return { userId, isNewUser, accessLink };
}

/* ─────────────────────────────────────────────────────────────
   Désactiver un abonnement PayPal
───────────────────────────────────────────────────────────── */
export async function deactivateUserByPayPalSubId(paypalSubId: string) {
  const user = await findUserByPayPalSubId(paypalSubId);

  if (!user) {
    console.warn("[SubHelpers] ⚠️ deactivate: user not found for PayPal sub:", paypalSubId);
    return;
  }

  const supabase = getSupabaseAdmin();

  await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...user.user_metadata,
      subscription_active: false,
      abonnement:          null,
      statut:              "inactif",
    },
  });

  if (user.email) {
    await supabase
      .from("clients")
      .update({
        subscription_active: false,
        abonnement:          null,
        statut:              "inactif",
        updated_at:          new Date().toISOString(),
      })
      .eq("email", user.email);

    console.log("[SubHelpers] 🔴 Abonnement PayPal désactivé →", user.email);
  }
}

/* ─────────────────────────────────────────────────────────────
   Confirmer l'abonnement actif (renouvellement PayPal)
───────────────────────────────────────────────────────────── */
export async function confirmActiveByPayPalSubId(paypalSubId: string) {
  const user = await findUserByPayPalSubId(paypalSubId);

  if (!user) {
    console.warn("[SubHelpers] ⚠️ confirm: user not found for PayPal sub:", paypalSubId);
    return;
  }

  const supabase = getSupabaseAdmin();

  await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...user.user_metadata,
      subscription_active: true,
      abonnement:          "outils_djama",
      statut:              "actif",
    },
  });

  if (user.email) {
    await supabase
      .from("clients")
      .update({
        subscription_active: true,
        abonnement:          "outils_djama",
        statut:              "actif",
        updated_at:          new Date().toISOString(),
      })
      .eq("email", user.email);

    console.log("[SubHelpers] 🔄 Renouvellement PayPal confirmé →", user.email);
  }
}
