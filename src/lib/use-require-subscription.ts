"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export type AccessLevel = "loading" | "free" | "premium" | "unauthenticated";

export interface SubscriptionState {
  level:     AccessLevel;
  isPremium: boolean;
  isFree:    boolean;
  email:     string;
  name:      string;
  userId:    string;
  freeApps:  string[];  // slugs des apps choisies (vide = pas encore sélectionné)
}

const DEFAULT_STATE: SubscriptionState =
  process.env.NODE_ENV === "development"
    ? { level: "premium", isPremium: true, isFree: false, email: "dev@local", name: "Dev Preview", userId: "dev", freeApps: [] }
    : { level: "loading", isPremium: false, isFree: false, email: "", name: "", userId: "", freeApps: [] };

export function useSubscription(): SubscriptionState {
  const [state, setState] = useState<SubscriptionState>(DEFAULT_STATE);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;

      if (!session?.user) {
        if (process.env.NODE_ENV === "development") {
          setState({ level: "premium", isPremium: true, isFree: false, email: "dev@local", name: "Dev Preview", userId: "dev", freeApps: [] });
          return;
        }
        router.replace("/login?redirect=/client");
        return;
      }

      const user  = session.user;
      const meta  = user.user_metadata ?? {};
      const email = (user.email ?? "").toLowerCase();
      const name  = meta.name ?? email.split("@")[0] ?? "Utilisateur";
      const now   = new Date();

      /* 2. subscription_active dans metadata (activé via webhook Stripe) */
      if (meta.subscription_active === true) {
        if (!cancelled) setState({
          level: "premium", isPremium: true, isFree: false,
          email, name, userId: user.id, freeApps: [],
        });
        return;
      }

      /* 3. Table user_access (accès admin / Stripe / PayPal) */
      const { data: access } = await supabase
        .from("user_access")
        .select("espace_premium, outils_saas, expires_at")
        .eq("email", email)
        .maybeSingle();

      if (cancelled) return;

      if (access?.espace_premium === true || access?.outils_saas === true) {
        const expired = access.expires_at ? new Date(access.expires_at) < now : false;
        if (!expired) {
          if (!cancelled) setState({
            level: "premium", isPremium: true, isFree: false,
            email, name, userId: user.id, freeApps: [],
          });
          return;
        }
      }

      /* 4. Table clients (legacy Stripe) */
      const { data: client } = await supabase
        .from("clients")
        .select("subscription_active, free_apps")
        .eq("email", email)
        .maybeSingle();

      if (cancelled) return;

      if (client?.subscription_active === true) {
        if (!cancelled) setState({
          level: "premium", isPremium: true, isFree: false,
          email, name, userId: user.id, freeApps: [],
        });
        return;
      }

      /* 5. Plan gratuit — lire les apps sélectionnées */
      const freeApps: string[] = Array.isArray(client?.free_apps) ? client.free_apps : [];

      if (!cancelled) setState({
        level: "free", isPremium: false, isFree: true,
        email, name, userId: user.id, freeApps,
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
