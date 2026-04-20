import { getSupabase } from "@/lib/supabase";
import type { VideoProjectRow } from "@/types/db";

export async function fetchPublishedVideoProjects(): Promise<VideoProjectRow[]> {
  const { data, error } = await getSupabase()
    .from("video_projects")
    .select("*")
    .eq("status", "published")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as VideoProjectRow[];
}

export async function fetchVideoProjects(): Promise<VideoProjectRow[]> {
  const { data, error } = await getSupabase()
    .from("video_projects")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as VideoProjectRow[];
}

export async function createVideoProject(
  payload: Omit<VideoProjectRow, "id" | "created_at">
): Promise<VideoProjectRow> {
  const { data, error } = await getSupabase()
    .from("video_projects")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as VideoProjectRow;
}

export async function updateVideoProject(
  id: string,
  payload: Partial<Omit<VideoProjectRow, "id" | "created_at">>
): Promise<VideoProjectRow> {
  const { data, error } = await getSupabase()
    .from("video_projects")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as VideoProjectRow;
}

export async function deleteVideoProject(id: string): Promise<void> {
  const { error } = await getSupabase().from("video_projects").delete().eq("id", id);
  if (error) throw error;
}
