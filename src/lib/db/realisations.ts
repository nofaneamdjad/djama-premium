import { supabase } from "@/lib/supabase";
import type { RealisationRow } from "@/types/db";

export async function fetchRealisations(): Promise<RealisationRow[]> {
  const { data, error } = await supabase
    .from("realisations")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as RealisationRow[];
}

export async function fetchPublishedRealisations(): Promise<RealisationRow[]> {
  const { data, error } = await supabase
    .from("realisations")
    .select("*")
    .eq("status", "publié")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as RealisationRow[];
}

export async function createRealisation(
  payload: Omit<RealisationRow, "id" | "created_at">
): Promise<RealisationRow> {
  const { data, error } = await supabase
    .from("realisations")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as RealisationRow;
}

export async function updateRealisation(
  id: string,
  payload: Partial<Omit<RealisationRow, "id" | "created_at">>
): Promise<RealisationRow> {
  const { data, error } = await supabase
    .from("realisations")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as RealisationRow;
}

export async function deleteRealisation(id: string): Promise<void> {
  const { error } = await supabase.from("realisations").delete().eq("id", id);
  if (error) throw error;
}
