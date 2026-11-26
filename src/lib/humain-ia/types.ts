export interface HumainIAJob {
  id:            string;
  user_id:       string;
  status:        "pending" | "in_queue" | "in_progress" | "completed" | "failed";
  runpod_job_id: string | null;
  portrait_url:  string;
  script:        string;
  voice_id:      string;
  language:      string;
  video_url:     string | null;
  error:         string | null;
  duration_s:    number | null;
  total_s:       number | null;
  frames:        number | null;
  created_at:    string;
  completed_at:  string | null;
}

export interface GenerateRequest {
  portrait_url:     string;
  script:           string;
  voice_id?:        string;
  language?:        string;
  use_liveportrait?: boolean;
}

export interface GenerateResponse {
  jobId:  string;
  status: "pending";
}

export interface StatusResponse {
  jobId:      string;
  status:     HumainIAJob["status"];
  videoUrl?:  string;
  error?:     string;
  duration_s?: number;
  total_s?:   number;
  frames?:    number;
  progress?:  number;
}

export interface Voice {
  id:       string;
  name:     string;
  language: string;
  gender:   "F" | "M";
  preview?:  string;
}
