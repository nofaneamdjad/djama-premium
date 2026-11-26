/**
 * Client RunPod Serverless API
 * Doc : https://docs.runpod.io/serverless/endpoints/invoke
 */

const RUNPOD_API_KEY       = process.env.RUNPOD_API_KEY ?? "";
const RUNPOD_ENDPOINT_ID   = process.env.RUNPOD_ENDPOINT_ID ?? "";
const RUNPOD_API_BASE       = "https://api.runpod.ai/v2";

interface RunPodInput {
  portrait_url:     string;
  script:           string;
  voice_id?:        string;
  language?:        string;
  use_liveportrait?: boolean;
}

interface RunPodOutput {
  video_base64?: string;
  duration_s?:   number;
  musetalk_s?:   number;
  lp_s?:         number;
  total_s?:      number;
  frames?:       number;
  error?:        string;
}

type RunPodStatus = "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "CANCELLED" | "TIMED_OUT";

interface RunPodJobResponse {
  id:         string;
  status:     RunPodStatus;
  output?:    RunPodOutput;
  error?:     string;
  delayTime?: number;
  executionTime?: number;
}

function headers() {
  return {
    "Authorization": `Bearer ${RUNPOD_API_KEY}`,
    "Content-Type":  "application/json",
  };
}

/** Soumet un job asynchrone à RunPod. Retourne l'ID du job. */
export async function submitJob(input: RunPodInput): Promise<string> {
  if (!RUNPOD_API_KEY || !RUNPOD_ENDPOINT_ID) {
    throw new Error("RUNPOD_API_KEY et RUNPOD_ENDPOINT_ID sont requis");
  }

  const resp = await fetch(
    `${RUNPOD_API_BASE}/${RUNPOD_ENDPOINT_ID}/run`,
    {
      method:  "POST",
      headers: headers(),
      body:    JSON.stringify({ input }),
    },
  );

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`RunPod submit échoué (${resp.status}): ${text.slice(0, 200)}`);
  }

  const data = await resp.json() as { id: string };
  return data.id;
}

/** Interroge le statut d'un job RunPod. */
export async function getJobStatus(runpodJobId: string): Promise<RunPodJobResponse> {
  const resp = await fetch(
    `${RUNPOD_API_BASE}/${RUNPOD_ENDPOINT_ID}/status/${runpodJobId}`,
    { headers: headers() },
  );

  if (!resp.ok) {
    throw new Error(`RunPod status échoué (${resp.status})`);
  }

  return resp.json() as Promise<RunPodJobResponse>;
}

/** Annule un job RunPod en attente. */
export async function cancelJob(runpodJobId: string): Promise<void> {
  await fetch(
    `${RUNPOD_API_BASE}/${RUNPOD_ENDPOINT_ID}/cancel/${runpodJobId}`,
    { method: "POST", headers: headers() },
  );
}

export type { RunPodOutput, RunPodStatus };
