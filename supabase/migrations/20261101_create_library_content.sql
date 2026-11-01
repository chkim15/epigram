-- Private storage for the Notebooks and Projects sections.
-- RLS is on with no policies, so only the server (service role) can read these tables.

CREATE TABLE IF NOT EXISTS public.library_content (
  section TEXT NOT NULL CHECK (section IN ('notebooks', 'projects')),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'coming_soon')),
  is_free_sample BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  html TEXT,
  labs JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (section, slug)
);

ALTER TABLE public.library_content ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.library_access_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS library_access_log_user_created_idx
  ON public.library_access_log (user_id, created_at DESC);

ALTER TABLE public.library_access_log ENABLE ROW LEVEL SECURITY;
