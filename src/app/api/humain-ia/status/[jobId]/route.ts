import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { getJobStatus } from "@/lib/humain-ia/runpod";
import type { HumainIAJob, StatusResponse } from "@/lib/humain-ia/types";

type SupabaseAdmin = ReturnType<typeof createSupabaseAdmin>;

export const dynamic = "force-dynamic";
export const runtime  = "nodejs";

type Params = { params: Promise<{ jobId: string }> };

const RUNPOD_TO_STATUS: Record<string, HumainIAJob["status"]> = {
  IN_QUEUE:    "in_queue",
  IN_PROGRESS: "in_progress",
  COMPLETED:   "completed",
  FAILED:      "failed",
  CANCELLED:   "failed",
  TIMED_OUT:   "failed",
};

const PROGRESS: Record<HumainIAJob["status"], number> = {
  pending:     5,
  in_queue:    15,
  in_progress: 50,
  completed:   100,
  failed:      0,
};

export async function GET(_req: NextRequest, { params }: Params) {
  const { jobId } = await params;

  // Auth
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const admin = createSupabaseAdmin();

  // Charger le job (vérification ownership)
  const { data: job } = await admin
    .from("humain_ia_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("user_id", user.id)
    .single();

  if (!job) return NextResponse.json({ error: "Job introuvable" }, { status: 404 });

  // Déjà terminé → retourner directement
  if (job.status === "completed" || job.status === "failed") {
    const resp: StatusResponse = {
      jobId:      job.id,
      status:     job.status,
      videoUrl:   job.video_url ?? undefined,
      error:      job.error ?? undefined,
      duration_s: job.duration_s ?? undefined,
      total_s:    job.total_s ?? undefined,
      frames:     job.frames ?? undefined,
      progress:   PROGRESS[job.status as HumainIAJob["status"]],
    };
    return NextResponse.json(resp);
  }

  // Interroger RunPod
  if (!job.runpod_job_id) {
    const resp: StatusResponse = {
      jobId: job.id, status: "pending", progress: PROGRESS["pending"],
    };
    return NextResponse.json(resp);
  }

  try {
    const rp = await getJobStatus(job.runpod_job_id);
    const newStatus = RUNPOD_TO_STATUS[rp.status] ?? "in_progress";

    if (rp.status === "COMPLETED" && rp.output?.video_base64) {
      // Uploader la vidéo dans Supabase Storage
      const videoUrl = await _uploadVideo(admin, user.id, job.id, rp.output.video_base64);

      await admin.from("humain_ia_jobs").update({
        status:       "completed",
        video_url:    videoUrl,
        duration_s:   rp.output.duration_s ?? null,
        total_s:      rp.output.total_s ?? null,
        frames:       rp.output.frames ?? null,
        completed_at: new Date().toISOString(),
      }).eq("id", job.id);

      const resp: StatusResponse = {
        jobId:      job.id,
        status:     "completed",
        videoUrl,
        duration_s: rp.output.duration_s,
        total_s:    rp.output.total_s,
        frames:     rp.output.frames,
        progress:   100,
      };
      return NextResponse.json(resp);
    }

    if (rp.status === "FAILED" || rp.status === "CANCELLED" || rp.status === "TIMED_OUT") {
      const errMsg = rp.output?.error ?? rp.error ?? "Échec RunPod";
      await admin.from("humain_ia_jobs").update({
        status:   "failed",
        error:    errMsg,
        completed_at: new Date().toISOString(),
      }).eq("id", job.id);

      const resp: StatusResponse = {
        jobId: job.id, status: "failed", error: errMsg, progress: 0,
      };
      return NextResponse.json(resp);
    }

    // En cours
    if (newStatus !== job.status) {
      await admin.from("humain_ia_jobs").update({ status: newStatus }).eq("id", job.id);
    }

    const resp: StatusResponse = {
      jobId: job.id, status: newStatus, progress: PROGRESS[newStatus],
    };
    return NextResponse.json(resp);

  } catch (err) {
    const resp: StatusResponse = {
      jobId: job.id, status: job.status as HumainIAJob["status"], progress: PROGRESS[job.status as HumainIAJob["status"]],
    };
    return NextResponse.json(resp);
  }
}

async function _uploadVideo(
  admin: SupabaseAdmin,
  userId: string,
  jobId:  string,
  base64: string,
): Promise<string> {
  const buf      = Buffer.from(base64, "base64");
  const filename = `${userId}/${jobId}.mp4`;
  const bucket   = "digital-human-videos";

  const { error } = await admin.storage
    .from(bucket)
    .upload(filename, buf, {
      contentType:  "video/mp4",
      cacheControl: "3600",
      upsert:       true,
    });

  if (error) throw new Error(`Storage upload échoué: ${error.message}`);

  const { data } = admin.storage.from(bucket).getPublicUrl(filename);
  return data.publicUrl;
}
