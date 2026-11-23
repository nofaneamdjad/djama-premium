"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/**
 * Hook de protection — Espace Coaching IA DJAMA
 *
 * Vérifie :
 *  1. Utilisateur authentifié (sinon → /login)
 *  2. user_access.coaching_ia=true → accès complet
 *  3. user_access row + source=stripe/paypal + coaching_ia=false → pending
 *  4. Fallback legacy: user_metadata.coaching_ia_active
 *  5. Fallback legacy: table clients
 *  6. Aucun accès → /services/coaching-ia?acces=requis
 */
export function useRequireCoachingIA() {
  const router = useRouter();
  const [ready,   setReady]   = useState(false);
  const [pending, setPending] = useState(false);
  const [user,    setUser]    = useState<{
    id:    string;
    email: string | undefined;
    name:  string | undefined;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (cancelled) return;

      if (!authUser) {
        router.replace("/login?redirect=/coaching-ia/espace");
        return;
      }

      const userObj = {
        id:    authUser.id,
        email: authUser.email,
        name:  authUser.user_metadata?.full_name ?? authUser.email,
      };

      /* user_access (source de vérité principale) */
      const { data: access } = await supabase
        .from("user_access")
        .select("coaching_ia, source")
        .eq("email", (authUser.email ?? "").toLowerCase())
        .maybeSingle();

      if (cancelled) return;

      if (access?.coaching_ia === true) {
        if (!cancelled) { setUser(userObj); setReady(true); }
        return;
      }

      if (
        access &&
        !access.coaching_ia &&
        (access.source === "stripe" || access.source === "paypal" || access.source === "virement")
      ) {
        if (!cancelled) { setUser(userObj); setPending(true); }
        return;
      }

      /* Fallback legacy metadata */
      const meta = authUser.user_metadata ?? {};
      if (meta.coaching_ia_active === true) {
        if (!cancelled) { setUser(userObj); setReady(true); }
        return;
      }

      /* Fallback legacy clients table */
      const { data: client } = await supabase
        .from("clients")
        .select("coaching_ia_active, coaching_ia_pending_transfer")
        .eq("email", authUser.email ?? "")
        .maybeSingle();

      if (cancelled) return;

      if (client?.coaching_ia_active) {
        if (!cancelled) { setUser(userObj); setReady(true); }
        return;
      }

      /* Virement en attente admin */
      if (client?.coaching_ia_pending_transfer) {
        if (!cancelled) { setUser(userObj); setPending(true); }
        return;
      }

      router.replace("/services/coaching-ia?acces=requis");
    }

    check();
    return () => { cancelled = true; };
  }, [router]);

  return { ready, pending, user };
}

/**
 * Hook étendu — retourne un accès quadristate :
 *  - "loading"  : vérification en cours
 *  - "preview"  : utilisateur connecté mais pas d'accès payant
 *  - "pending"  : paiement reçu, accès en attente d'activation admin
 *  - "full"     : accès complet confirmé
 */
export function useCoachingIAAccess() {
  const router = useRouter();
  const [access, setAccess] = useState<"loading" | "preview" | "pending" | "full">("loading");
  const [user, setUser] = useState<{
    id:    string;
    email: string | undefined;
    name:  string | undefined;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (cancelled) return;

      if (!authUser) {
        router.replace("/login?redirect=/coaching-ia/espace");
        return;
      }

      const meta = authUser.user_metadata ?? {};
      const userObj = {
        id:    authUser.id,
        email: authUser.email,
        name:  meta.full_name ?? meta.name ?? authUser.email,
      };

      /* Whitelist dev */
      const devEmails = (process.env.NEXT_PUBLIC_COACHING_DEV_EMAILS ?? "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      if (devEmails.includes((authUser.email ?? "").toLowerCase())) {
        if (!cancelled) { setUser(userObj); setAccess("full"); }
        return;
      }

      /* user_access (source de vérité principale) */
      const { data: access } = await supabase
        .from("user_access")
        .select("coaching_ia, source")
        .eq("email", (authUser.email ?? "").toLowerCase())
        .maybeSingle();

      if (cancelled) return;

      if (access?.coaching_ia === true) {
        if (!cancelled) { setUser(userObj); setAccess("full"); }
        return;
      }

      if (
        access &&
        !access.coaching_ia &&
        (access.source === "stripe" || access.source === "paypal" || access.source === "virement")
      ) {
        if (!cancelled) { setUser(userObj); setAccess("pending"); }
        return;
      }

      /* Fallback legacy */
      if (meta.coaching_ia_active === true) {
        if (!cancelled) { setUser(userObj); setAccess("full"); }
        return;
      }

      const { data: client } = await supabase
        .from("clients")
        .select("coaching_ia_active, coaching_ia_pending_transfer")
        .eq("email", authUser.email ?? "")
        .maybeSingle();

      if (cancelled) return;

      if (client?.coaching_ia_active) {
        setUser(userObj);
        setAccess("full");
        return;
      }

      /* Virement en attente de confirmation admin (via table clients) */
      if (client?.coaching_ia_pending_transfer) {
        setUser(userObj);
        setAccess("pending");
        return;
      }

      setUser(userObj);
      setAccess("preview");
    }

    check();
    return () => { cancelled = true; };
  }, [router]);

  return { access, user };
}
