import { getSupabase } from "@/lib/supabase";
import type { SocialLinkRow } from "@/types/db";

// ── Lecture ───────────────────────────────────────────────────────

/** Tous les réseaux (pour l'admin) */
export async function fetchSocialLinks(): Promise<SocialLinkRow[]> {
  const { data, error } = await getSupabase()
    .from("social_links")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as SocialLinkRow[];
}

/** Seulement les réseaux actifs avec URL (pour le frontend) */
export async function fetchActiveSocialLinks(): Promise<SocialLinkRow[]> {
  const { data, error } = await getSupabase()
    .from("social_links")
    .select("*")
    .eq("active", true)
    .neq("url", "")
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as SocialLinkRow[];
}

// ── Écriture ─────────────────────────────────────────────────────

/** Met à jour un réseau (url, active, sort_order) */
export async function updateSocialLink(
  id: string,
  payload: Partial<Pick<SocialLinkRow, "url" | "active" | "sort_order">>
): Promise<SocialLinkRow> {
  const { data, error } = await getSupabase()
    .from("social_links")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as SocialLinkRow;
}

/** Mise à jour en batch (pour le réordering) */
export async function updateManySocialLinks(
  updates: { id: string; sort_order: number }[]
): Promise<void> {
  const sb = getSupabase();
  await Promise.all(
    updates.map(({ id, sort_order }) =>
      sb.from("social_links").update({ sort_order }).eq("id", id)
    )
  );
}
