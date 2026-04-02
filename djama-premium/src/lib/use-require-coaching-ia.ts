"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/**
 * Hook de protection — Espace Coaching IA DJAMA
 *
 * Vérifie :
 *  1. Utilisateur authentifié (sinon → /login)
 *  2. coaching_ia_active === true dans user_metadata
 *  3. Fallback table clients
 *
 * Redirige vers /services/coaching-ia?acces=requis si pas d'accès.
 */
export function useRequireCoachingIA() {
  const router = useRouter();
  const [ready, setReady]   = useState(false);
  const [user,  setUser]    = useState<{
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

      /* Vérification principale */
      if (meta.coaching_ia_active === true) {
        if (!cancelled) {
          setUser({
            id:    authUser.id,
            email: authUser.email,
            name:  meta.full_name ?? meta.name ?? authUser.email,
          });
          setReady(true);
        }
        return;
      }

      /* Fallback DB */
      const { data: client } = await supabase
        .from("clients")
        .select("coaching_ia_active")
        .eq("email", authUser.email ?? "")
        .maybeSingle();

      if (cancelled) return;

      if (!client?.coaching_ia_active) {
        router.replace("/services/coaching-ia?acces=requis");
        return;
      }

      if (!cancelled) {
        setUser({
          id:    authUser.id,
          email: authUser.email,
          name:  meta.full_name ?? authUser.email,
        });
        setReady(true);
      }
    }

    check();
    return () => { cancelled = true; };
  }, [router]);

  return { ready, user };
}

/**
 * Hook étendu — retourne un accès tristate :
 *  - "loading"  : vérification en cours
 *  - "preview"  : utilisateur connecté mais pas d'accès payant (afficher PreviewGate)
 *  - "full"     : accès complet confirmé
 *
 * Ne redirige jamais — laisse le composant gérer l'affichage.
 */
export function useCoachingIAAccess() {
  const router = useRouter();
  const [access, setAccess] = useState<"loading" | "preview" | "full">("loading");
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
        /* Non authentifié → rediriger vers login */
        router.replace("/login?redirect=/coaching-ia/espace");
        return;
      }

      const meta = authUser.user_metadata ?? {};
      const userObj = {
        id:    authUser.id,
        email: authUser.email,
        name:  meta.full_name ?? meta.name ?? authUser.email,
      };

      if (meta.coaching_ia_active === true) {
        if (!cancelled) { setUser(userObj); setAccess("full"); }
        return;
      }

      const { data: client } = await supabase
        .from("clients")
        .select("coaching_ia_active")
        .eq("email", authUser.email ?? "")
        .maybeSingle();

      if (cancelled) return;

      if (client?.coaching_ia_active) {
        setUser(userObj);
        setAccess("full");
      } else {
        setUser(userObj);
        setAccess("preview");
      }
    }

    check();
    return () => { cancelled = true; };
  }, [router]);

  return { access, user };
}
