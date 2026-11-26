import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { checkRateLimitAsync } from "@/lib/rate-limit";
import { submitJob } from "@/lib/humain-ia/runpod";
import { getDefaultVoice } from "@/lib/humain-ia/voices";
import type { GenerateRequest } from "@/lib/humain-ia/types";

export const dynamic = "force-dynamic";
export const runtime  = "nodejs";

export async function POST(req: NextRequest) {
  // Auth
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  // Rate limit : 3 générations / heure / utilisateur
  const { allowed } = await checkRateLimitAsync(`humain-ia:${user.id}`, 3, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Limite atteinte : 3 générations par heure." },
      { status: 429 },
    );
  }

  // Validation
  const body = await req.json() as Partial<GenerateRequest>;
  const { portrait_url, script, voice_id, language = "fr", use_liveportrait = false } = body;

  if (!portrait_url?.startsWith("http")) {
    return NextResponse.json({ error: "portrait_url invalide" }, { status: 400 });
  }
  if (!script?.trim() || script.length > 2000) {
    return NextResponse.json(
      { error: "script requis (max 2000 caractères)" },
      { status: 400 },
    );
  }

  const resolvedVoiceId = voice_id ?? getDefaultVoice(language).id;

  const admin = createSupabaseAdmin();

  // Créer le job en BDD
  const { data: job, error: dbErr } = await admin
    .from("humain_ia_jobs")
    .insert({
      user_id:      user.id,
      status:       "pending",
      portrait_url,
      script:       script.trim(),
      voice_id:     resolvedVoiceId,
      language,
    })
    .select("id")
    .single();

  if (dbErr || !job) {
    return NextResponse.json(
      { error: "Erreur création job" },
      { status: 500 },
    );
  }

  // Soumettre à RunPod
  try {
    const runpodJobId = await submitJob({
      portrait_url,
      script:           script.trim(),
      voice_id:         resolvedVoiceId,
      language,
      use_liveportrait,
    });

    await admin
      .from("humain_ia_jobs")
      .update({ status: "in_queue", runpod_job_id: runpodJobId })
      .eq("id", job.id);

    return NextResponse.json({ jobId: job.id, status: "pending" }, { status: 202 });

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur RunPod";
    await admin
      .from("humain_ia_jobs")
      .update({ status: "failed", error: msg })
      .eq("id", job.id);

    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
