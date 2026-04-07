import { supabase } from "@/lib/supabase";
import type { SiteSettingRow, SiteSettings } from "@/types/db";

// ── Lecture ───────────────────────────────────────────────────────

/** Toutes les entrées (pour la page admin) */
export async function fetchAllSettings(): Promise<SiteSettingRow[]> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .order("section")
    .order("key");
  if (error) throw error;
  return (data ?? []) as SiteSettingRow[];
}

/** Map clé → valeur (pour le frontend) */
export async function fetchSettingsMap(): Promise<SiteSettings> {
  const rows = await fetchAllSettings();
  return Object.fromEntries(rows.map(r => [r.key, r.value]));
}

/** Lecture d'une seule clé, avec fallback */
export async function fetchSetting(key: string, fallback = ""): Promise<string> {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", key)
    .single();
  return data?.value ?? fallback;
}

/** Lecture par section (ex: 'contact', 'cta', 'branding') */
export async function fetchSettingsBySection(section: string): Promise<SiteSettingRow[]> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("section", section)
    .order("key");
  if (error) throw error;
  return (data ?? []) as SiteSettingRow[];
}

// ── Écriture ─────────────────────────────────────────────────────

/** Met à jour une seule valeur */
export async function updateSetting(key: string, value: string): Promise<void> {
  const { error } = await supabase
    .from("site_settings")
    .update({ value, updated_at: new Date().toISOString() })
    .eq("key", key);
  if (error) throw error;
}

/** Met à jour plusieurs valeurs en une seule opération */
export async function updateManySettings(map: Record<string, string>): Promise<void> {
  const updates = Object.entries(map).map(([key, value]) =>
    supabase
      .from("site_settings")
      .update({ value, updated_at: new Date().toISOString() })
      .eq("key", key)
  );
  await Promise.all(updates);
}

/** Upsert (crée ou met à jour) */
export async function upsertSetting(
  key: string,
  value: string,
  label?: string,
  section?: string
): Promise<void> {
  const { error } = await supabase
    .from("site_settings")
    .upsert({
      key,
      value,
      ...(label   ? { label }   : {}),
      ...(section ? { section } : {}),
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });
  if (error) throw error;
}
