CREATE TABLE IF NOT EXISTS public.recognition_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_hash text NOT NULL UNIQUE,
  result jsonb NOT NULL,
  hit_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS recognition_cache_image_hash_idx
  ON public.recognition_cache (image_hash);

ALTER TABLE public.recognition_cache ENABLE ROW LEVEL SECURITY;
-- 不创建任何 policy → 仅 service_role 可读写