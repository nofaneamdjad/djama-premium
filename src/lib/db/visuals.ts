import { getSupabase } from "@/lib/supabase";
import type { VisualRow } from "@/types/db";

export async function fetchPublishedVisuals(): Promise<VisualRow[]> {
  const { data, error } = await getSupabase()
    .from("visuals")
    .select("*")
    .eq("status", "published")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as VisualRow[];
}

export async function fetchVisuals(): Promise<VisualRow[]> {
  const { data, error } = await getSupabase()
    .from("visuals")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as VisualRow[];
}

export async function createVisual(
  payload: Omit<VisualRow, "id" | "created_at">
): Promise<VisualRow> {
  const { data, error } = await getSupabase()
    .from("visuals")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as VisualRow;
}

export async function updateVisual(
  id: string,
  payload: Partial<Omit<VisualRow, "id" | "created_at">>
): Promise<VisualRow> {
  const { data, error } = await getSupabase()
    .from("visuals")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as VisualRow;
}

export async function deleteVisual(id: string): Promise<void> {
  const { error } = await getSupabase().from("visuals").delete().eq("id", id);
  if (error) throw error;
}
