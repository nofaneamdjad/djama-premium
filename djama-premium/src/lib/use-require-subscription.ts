"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/**
 * Hook de protection — espace client DJAMA
 *
 * Vérifie dans cet ordre :
 *  1. Utilisateur authentifié (sinon → /login)
 *  2. Abonnement actif dans user_metadata (posé par le webhook Stripe)
 *  3. Fallback sur la table clients (email + abonnement + statut)
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

      // 1. Non authentifié → page de connexion
      if (!user) {
        router.replace("/login?redirect=/client");
        return;
      }

      // 2. Vérifier user_metadata (mis à jour par webhook Stripe)
      const meta = user.user_metadata ?? {};
      const metaActive =
        meta.abonnement === "outils_djama" && meta.statut === "actif";

      if (metaActive) {
        if (!cancelled) setReady(true);
        return;
      }

      // 3. Fallback — table clients (au cas où metadata pas encore rafraîchi)
      const { data: client } = await supabase
        .from("clients")
        .select("abonnement, statut")
        .eq("email", user.email ?? "")
        .maybeSingle();

      if (cancelled) return;

      const dbActive =
        client?.abonnement === "outils_djama" && client?.statut === "actif";

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
