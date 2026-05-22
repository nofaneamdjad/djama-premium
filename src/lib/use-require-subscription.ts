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
      /* getSession() lit localStorage — pas de requête réseau, pas de blocage */
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;

      /* 1. Non authentifié → page de connexion */
      if (!session?.user) {
        router.replace("/login?redirect=/client");
        return;
      }

      /* Tout utilisateur connecté a accès — trial automatique */
      if (!cancelled) setReady(true);
    }

    check();
    return () => { cancelled = true; };
  }, [router]);

  return { ready, pending };
}
