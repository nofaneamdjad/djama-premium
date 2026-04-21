import { getSupabase } from "@/lib/supabase";
import type { PhotoRetouchRow } from "@/types/db";

export async function fetchPublishedPhotoRetouches(): Promise<PhotoRetouchRow[]> {
  const { data, error } = await getSupabase()
    .from("photo_retouches")
    .select("*")
    .eq("status", "published")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as PhotoRetouchRow[];
}

export async function fetchPhotoRetouches(): Promise<PhotoRetouchRow[]> {
  const { data, error } = await getSupabase()
    .from("photo_retouches")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as PhotoRetouchRow[];
}

export async function createPhotoRetouch(
  payload: Omit<PhotoRetouchRow, "id" | "created_at">
): Promise<PhotoRetouchRow> {
  const { data, error } = await getSupabase()
    .from("photo_retouches")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as PhotoRetouchRow;
}

export async function updatePhotoRetouch(
  id: string,
  payload: Partial<Omit<PhotoRetouchRow, "id" | "created_at">>
): Promise<PhotoRetouchRow> {
  const { data, error } = await getSupabase()
    .from("photo_retouches")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as PhotoRetouchRow;
}

export async function deletePhotoRetouch(id: string): Promise<void> {
  const { error } = await getSupabase().from("photo_retouches").delete().eq("id", id);
  if (error) throw error;
}
