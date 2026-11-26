-- Migration : Module Digital Human DJAMA
-- Table : humain_ia_jobs
-- Bucket Supabase Storage : digital-human-videos
-- RLS : chaque utilisateur ne voit que ses propres jobs
--
-- À appliquer UNIQUEMENT après validation du Jalon D (UI complète)
-- Contrainte : aucun déploiement en production sans autorisation

-- ── Table jobs ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS humain_ia_jobs (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status          text        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','in_queue','in_progress','completed','failed')),
  runpod_job_id   text,
  portrait_url    text        NOT NULL,
  script          text        NOT NULL CHECK (char_length(script) <= 2000),
  voice_id        text        NOT NULL DEFAULT '',
  language        text        NOT NULL DEFAULT 'fr',
  video_url       text,
  error           text,
  duration_s      numeric(8,2),
  total_s         numeric(8,2),
  frames          integer,
  created_at      timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz
);

-- ── Index ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS humain_ia_jobs_user_id_idx
  ON humain_ia_jobs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS humain_ia_jobs_status_idx
  ON humain_ia_jobs (status)
  WHERE status IN ('pending', 'in_queue', 'in_progress');

-- ── RLS ──────────────────────────────────────────────────────────
ALTER TABLE humain_ia_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "humain_ia_jobs_own"
  ON humain_ia_jobs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Bucket Storage : digital-human-videos ───────────────────────
-- (Exécuter en tant que service_role via Supabase Dashboard → Storage)
-- INSERT INTO storage.buckets (id, name, public, file_size_limit)
-- VALUES ('digital-human-videos', 'digital-human-videos', true, 10485760)
-- ON CONFLICT (id) DO NOTHING;
--
-- CREATE POLICY "dh_videos_own_read"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'digital-human-videos' AND auth.uid()::text = (storage.foldername(name))[1]);
--
-- CREATE POLICY "dh_videos_service_insert"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'digital-human-videos');

-- ── Commentaires ─────────────────────────────────────────────────
COMMENT ON TABLE humain_ia_jobs IS
  'Jobs de génération vidéo Digital Human (MuseTalk V1.5 + LivePortrait sur RunPod)';

COMMENT ON COLUMN humain_ia_jobs.runpod_job_id IS
  'ID du job RunPod Serverless — utilisé pour le polling de statut';

COMMENT ON COLUMN humain_ia_jobs.total_s IS
  'Temps total pipeline MuseTalk + LivePortrait en secondes';
