"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export type OrgContext = {
  id: string;
  name: string;
  plan: string;
  role: string;
  isOwner: boolean;
  isAdmin: boolean;
};

type State =
  | { status: "loading" }
  | { status: "none" }          // pas d'organisation
  | { status: "ready"; org: OrgContext };

/**
 * Retourne l'organisation principale de l'utilisateur connecté
 * (la première trouvée, ou celle où il est propriétaire).
 *
 * Utilisation dans un INSERT :
 *   const { org } = useOrganization();
 *   supabase.from("contacts").insert({ ...data, user_id, organization_id: org?.id ?? null })
 */
export function useOrganization(): State {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (!cancelled) setState({ status: "none" }); return; }

      const { data } = await supabase
        .from("organization_members")
        .select("role, organizations!inner(id, name, plan, owner_id)")
        .eq("user_id", user.id)
        .order("joined_at", { ascending: true })
        .limit(5);

      if (cancelled) return;

      if (!data || data.length === 0) {
        setState({ status: "none" });
        return;
      }

      // Priorité : la première org où l'utilisateur est owner, sinon la première
      const ownerRow = data.find(m => m.role === "owner");
      const row      = ownerRow ?? data[0];
      const org      = row.organizations as { id: string; name: string; plan: string; owner_id: string };

      setState({
        status: "ready",
        org: {
          id:      org.id,
          name:    org.name,
          plan:    org.plan,
          role:    row.role,
          isOwner: row.role === "owner",
          isAdmin: row.role === "owner" || row.role === "admin",
        },
      });
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return state;
}
