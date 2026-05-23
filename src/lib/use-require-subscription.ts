"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { TRIAL_DAYS } from "@/lib/plans";

export type AccessLevel = "loading" | "free" | "trial" | "premium" | "unauthenticated";

export interface SubscriptionState {
  level:      AccessLevel;
  isPremium:  boolean;   // trial OU payant actif
  isFree:     boolean;   // connecté mais pas de premium
  trialDaysLeft: number; // -1 si pas en trial
  trialEnd:   string | null;
  email:      string;
  name:       string;
  userId:     string;
}

const DEFAULT_STATE: SubscriptionState = {
  level: "loading", isPremium: false, isFree: false,
  trialDaysLeft: -1, trialEnd: null, email: "", name: "", userId: "",
};

export function useSubscription(): SubscriptionState {
  const [state, setState] = useState<SubscriptionState>(DEFAULT_STATE);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function check() {
      /* 1. Lecture session locale (pas de requête réseau) */
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;

      if (!session?.user) {
        router.replace("/login?redirect=/client");
        return;
      }

      const user  = session.user;
      const meta  = user.user_metadata ?? {};
      const email = (user.email ?? "").toLowerCase();
      const name  = meta.name ?? email.split("@")[0] ?? "Utilisateur";
      const now   = new Date();

      /* 2. Trial 30 jours (stocké dans user_metadata) */
      if (meta.trial === true && meta.trial_end) {
        const end  = new Date(meta.trial_end);
        const left = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (left > 0) {
          if (!cancelled) setState({
            level: "trial", isPremium: true, isFree: false,
            trialDaysLeft: left, trialEnd: meta.trial_end,
            email, name, userId: user.id,
          });
          return;
        }
      }

      /* 3. subscription_active dans metadata (accès activé manuellement) */
      if (meta.subscription_active === true) {
        if (!cancelled) setState({
          level: "premium", isPremium: true, isFree: false,
          trialDaysLeft: -1, trialEnd: null, email, name, userId: user.id,
        });
        return;
      }

      /* 4. Table user_access (accès admin / Stripe / PayPal) */
      const { data: access } = await supabase
        .from("user_access")
        .select("espace_premium, outils_saas, source, expires_at")
        .eq("email", email)
        .maybeSingle();

      if (cancelled) return;

      if (access?.espace_premium === true || access?.outils_saas === true) {
        const expired = access.expires_at ? new Date(access.expires_at) < now : false;
        if (!expired) {
          if (!cancelled) setState({
            level: "premium", isPremium: true, isFree: false,
            trialDaysLeft: -1, trialEnd: null, email, name, userId: user.id,
          });
          return;
        }
      }

      /* 5. Table clients (legacy Stripe) */
      const { data: client } = await supabase
        .from("clients")
        .select("subscription_active, abonnement, statut, trial_end")
        .eq("email", email)
        .maybeSingle();

      if (cancelled) return;

      if (client?.subscription_active === true) {
        if (!cancelled) setState({
          level: "premium", isPremium: true, isFree: false,
          trialDaysLeft: -1, trialEnd: null, email, name, userId: user.id,
        });
        return;
      }

      /* 6. Trial dans la table clients */
      if (client?.trial_end) {
        const end  = new Date(client.trial_end);
        const left = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (left > 0) {
          if (!cancelled) setState({
            level: "trial", isPremium: true, isFree: false,
            trialDaysLeft: left, trialEnd: client.trial_end,
            email, name, userId: user.id,
          });
          return;
        }
      }

      /* 7. Nouveaux inscrits sans trial → donner trial automatique de 30j */
      const createdAt = new Date(user.created_at ?? now);
      const daysSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCreation <= TRIAL_DAYS) {
        const trialEnd = new Date(createdAt.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();
        const left = Math.ceil((new Date(trialEnd).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (!cancelled) setState({
          level: "trial", isPremium: true, isFree: false,
          trialDaysLeft: left, trialEnd,
          email, name, userId: user.id,
        });
        return;
      }

      /* 8. Plan gratuit */
      if (!cancelled) setState({
        level: "free", isPremium: false, isFree: true,
        trialDaysLeft: -1, trialEnd: null, email, name, userId: user.id,
      });
    }

    check();
    return () => { cancelled = true; };
  }, [router]);

  return state;
}

/** Rétrocompat — ancienne signature { ready, pending } */
export function useRequireSubscription() {
  const state = useSubscription();
  return {
    ready:   state.level !== "loading" && state.level !== "unauthenticated",
    pending: false,
  };
}
