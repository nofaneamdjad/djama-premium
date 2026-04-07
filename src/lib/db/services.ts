import { getSupabase } from "@/lib/supabase";
import type { ServiceRow } from "@/types/db";

export async function fetchServices(): Promise<ServiceRow[]> {
  const { data, error } = await getSupabase()
    .from("services")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ServiceRow[];
}

export async function fetchActiveServices(): Promise<ServiceRow[]> {
  const { data, error } = await getSupabase()
    .from("services")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ServiceRow[];
}

export async function createService(
  payload: Omit<ServiceRow, "id" | "created_at">
): Promise<ServiceRow> {
  const { data, error } = await getSupabase()
    .from("services")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as ServiceRow;
}

export async function updateService(
  id: string,
  payload: Partial<Omit<ServiceRow, "id" | "created_at">>
): Promise<ServiceRow> {
  const { data, error } = await getSupabase()
    .from("services")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as ServiceRow;
}

export async function deleteService(id: string): Promise<void> {
  const { error } = await getSupabase().from("services").delete().eq("id", id);
  if (error) throw error;
}
