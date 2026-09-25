"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export type CrmPerms = {
  loading:    boolean;
  can_view:   boolean;
  can_create: boolean;
  can_edit:   boolean;
  can_delete: boolean;
  can_export: boolean;
};

const FULL_ACCESS: CrmPerms = {
  loading:    false,
  can_view:   true,
  can_create: true,
  can_edit:   true,
  can_delete: true,
  can_export: true,
};

/**
 * Retourne les permissions CRM de l'utilisateur connecté.
 *
 * • Solo (pas d'org) → tout à true
 * • Admin/owner org → tout à true
 * • Membre standard → lit organization_permissions pour app_slug='crm'
 */
export function useCrmPermissions(): CrmPerms {
  const [perms, setPerms] = useState<CrmPerms>({ ...FULL_ACCESS, loading: true });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setPerms({ ...FULL_ACCESS, loading: false });
        return;
      }

      // Vérifier membership org
      const { data: memberships } = await supabase
        .from("organization_members")
        .select("organization_id, role")
        .eq("user_id", user.id)
        .is("suspended_at", null)
        .limit(5);

      if (cancelled) return;

      // Solo (pas d'org) → accès complet
      if (!memberships || memberships.length === 0) {
        setPerms({ ...FULL_ACCESS, loading: false });
        return;
      }

      // Admin ou owner → accès complet
      const isAdmin = memberships.some(m => m.role === "owner" || m.role === "admin");
      if (isAdmin) {
        setPerms({ ...FULL_ACCESS, loading: false });
        return;
      }

      // Membre standard → lire les permissions CRM
      const orgId = memberships[0].organization_id;
      const { data: p } = await supabase
        .from("organization_permissions")
        .select("can_view, can_create, can_edit, can_delete, can_export")
        .eq("organization_id", orgId)
        .eq("user_id", user.id)
        .eq("app_slug", "crm")
        .maybeSingle();

      if (cancelled) return;

      if (!p) {
        // Pas de ligne permission CRM → accès lecture seule par défaut
        setPerms({ loading: false, can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: false });
        return;
      }

      setPerms({
        loading:    false,
        can_view:   p.can_view   ?? false,
        can_create: p.can_create ?? false,
        can_edit:   p.can_edit   ?? false,
        can_delete: p.can_delete ?? false,
        can_export: p.can_export ?? false,
      });
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return perms;
}
