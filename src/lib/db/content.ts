import { supabase } from "@/lib/supabase";
import type { ContentRow } from "@/types/db";

export async function fetchAllContent(): Promise<ContentRow[]> {
  const { data, error } = await supabase
    .from("site_content")
    .select("*")
    .order("key", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ContentRow[];
}

export async function fetchContentByKey(key: string): Promise<string | null> {
  const { data } = await supabase
    .from("site_content")
    .select("value")
    .eq("key", key)
    .single();
  return data?.value ?? null;
}

export async function upsertContent(key: string, value: string): Promise<void> {
  const { error } = await supabase
    .from("site_content")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw error;
}

export async function upsertManyContent(
  entries: { key: string; value: string }[]
): Promise<void> {
  const rows = entries.map(e => ({
    key: e.key,
    value: e.value,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase
    .from("site_content")
    .upsert(rows, { onConflict: "key" });
  if (error) throw error;
}
