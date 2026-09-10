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
  freeApps:  string[];
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
      const name  = meta.name ?? meta.full_name ?? email.split("@")[0] ?? "Utilisateur";

      /* ── 1. SOURCE SÉCURISÉE : user_subscriptions ─────────────
         Écrite uniquement par le service_role (webhooks).
         Un utilisateur ne peut jamais modifier cette table.
      ────────────────────────────────────────────────────────── */
      const { data: sub } = await supabase
        .from("user_subscriptions")
        .select("is_active, current_period_end")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (sub?.is_active === true) {
        const expired = sub.current_period_end
          ? new Date(sub.current_period_end) < new Date()
          : false;

        if (!expired) {
          setState({ level: "premium", isPremium: true, isFree: false, email, name, userId: user.id, freeApps: [] });
          return;
        }
      }

      /* ── 2. LEGACY : user_access (fermeture INSERT/UPDATE migrée) */
      const { data: access } = await supabase
        .from("user_access")
        .select("espace_premium, outils_saas, expires_at")
        .eq("email", email)
        .maybeSingle();

      if (cancelled) return;

      if (access?.espace_premium === true || access?.outils_saas === true) {
        const expired = access.expires_at ? new Date(access.expires_at) < new Date() : false;
        if (!expired) {
          setState({ level: "premium", isPremium: true, isFree: false, email, name, userId: user.id, freeApps: [] });
          return;
        }
      }

      /* ── 3. Plan gratuit — apps sélectionnées ─────────────────
         user_free_apps : SELECT autorisé, INSERT max 2 apps,
         UPDATE interdit (sélection verrouillée).
      ────────────────────────────────────────────────────────── */
      const { data: freeRow } = await supabase
        .from("user_free_apps")
        .select("selected_apps")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      const freeApps: string[] = Array.isArray(freeRow?.selected_apps) ? freeRow.selected_apps : [];

      setState({ level: "free", isPremium: false, isFree: true, email, name, userId: user.id, freeApps });
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
