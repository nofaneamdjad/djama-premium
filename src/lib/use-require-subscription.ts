"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/**
 * Hook de protection — espace client DJAMA
 *
 * Vérifie dans cet ordre :
 *  1. Utilisateur authentifié           (sinon → /login)
 *  2. user_access.espace_premium=true   (accès débloqué par l'admin)
 *  3. user_access row existe + source=stripe/paypal + espace_premium=false
 *     → pending (paiement reçu, activation en attente)
 *  4. Fallback legacy: user_metadata.subscription_active
 *  5. Fallback legacy: table clients
 *  6. Aucun accès → /espace-client?acces=requis
 *
 * Retourne { ready, pending } :
 *   ready   = true → accès complet confirmé
 *   pending = true → paiement reçu, accès pas encore activé par l'admin
 */
export function useRequireSubscription() {
  const router = useRouter();
  const [ready,   setReady]   = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;

      /* 1. Non authentifié → page de connexion */
      if (!user) {
        router.replace("/login?redirect=/client");
        return;
      }

      /* 2 & 3. Vérification principale : table user_access */
      const { data: access } = await supabase
        .from("user_access")
        .select("espace_premium, outils_saas, source")
        .eq("email", (user.email ?? "").toLowerCase())
        .maybeSingle();

      if (cancelled) return;

      if (access?.espace_premium === true || access?.outils_saas === true) {
        /* Accès débloqué par l'admin */
        if (!cancelled) setReady(true);
        return;
      }

      if (
        access &&
        !access.espace_premium &&
        !access.outils_saas &&
        (access.source === "stripe" || access.source === "paypal")
      ) {
        /* Paiement reçu mais pas encore activé */
        if (!cancelled) setPending(true);
        return;
      }

      /* 4. Fallback legacy : user_metadata */
      const meta = user.user_metadata ?? {};
      if (meta.subscription_active === true) {
        if (!cancelled) setReady(true);
        return;
      }
      if (meta.abonnement === "outils_djama" && meta.statut === "actif") {
        if (!cancelled) setReady(true);
        return;
      }

      /* 5. Fallback legacy : table clients */
      const { data: client } = await supabase
        .from("clients")
        .select("subscription_active, abonnement, statut")
        .eq("email", user.email ?? "")
        .maybeSingle();

      if (cancelled) return;

      const dbActive =
        client?.subscription_active === true ||
        (client?.abonnement === "outils_djama" && client?.statut === "actif");

      if (dbActive) {
        if (!cancelled) setReady(true);
        return;
      }

      /* 6. Aucun accès */
      router.replace("/espace-client?acces=requis");
    }

    check();
    return () => { cancelled = true; };
  }, [router]);

  return { ready, pending };
}
