"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/**
 * Hook de protection — espace client DJAMA
 *
 * Vérifie dans cet ordre :
 *  1. Utilisateur authentifié          (sinon → /login)
 *  2. subscription_active === true     dans user_metadata  (booléen posé par le webhook)
 *  3. Fallback abonnement + statut     dans user_metadata  (rétrocompatibilité)
 *  4. Fallback table clients           (au cas où metadata pas encore rafraîchi)
 *
 * Si aucune condition n'est remplie → /espace-client?acces=requis
 */
export function useRequireSubscription() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) return;

      /* 1. Non authentifié → page de connexion */
      if (!user) {
        router.replace("/login?redirect=/client");
        return;
      }

      const meta = user.user_metadata ?? {};

      /* 2. Vérification principale : subscription_active (booléen Stripe webhook) */
      if (meta.subscription_active === true) {
        if (!cancelled) setReady(true);
        return;
      }

      /* 3. Fallback metadata legacy (abonnement + statut) */
      const metaLegacyActive =
        meta.abonnement === "outils_djama" && meta.statut === "actif";
      if (metaLegacyActive) {
        if (!cancelled) setReady(true);
        return;
      }

      /* 4. Fallback DB — table clients */
      const { data: client } = await supabase
        .from("clients")
        .select("subscription_active, abonnement, statut")
        .eq("email", user.email ?? "")
        .maybeSingle();

      if (cancelled) return;

      const dbActive =
        client?.subscription_active === true ||
        (client?.abonnement === "outils_djama" && client?.statut === "actif");

      if (!dbActive) {
        router.replace("/espace-client?acces=requis");
        return;
      }

      if (!cancelled) setReady(true);
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return { ready };
}
