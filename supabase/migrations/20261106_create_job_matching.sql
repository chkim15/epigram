-- Jobs board, step B: stored openings, CV profiles and fit scores for Premium users.
--
-- Access model (same idea as library_content): every table has RLS on. Writes happen only on the
-- server (service role) after the Premium check, CV parsing and validation. Users may read their
-- own profile and matches; job_openings and job_refresh_runs are server-only.
--
-- Account deletion: rows cascade from auth.users. Files in the private `cvs` bucket do NOT cascade,
-- so /api/delete-account must also remove cvs/<user_id>/ (handled in the step B code PR).

-- ---------------------------------------------------------------------------------------------
-- 1. Openings found by the daily refresh
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.job_openings (
  id TEXT PRIMARY KEY,                       -- source-specific id, e.g. 'gh-janestreet-123456'
  firm TEXT NOT NULL,
  firm_type TEXT NOT NULL CHECK (firm_type IN ('Trading firms & funds', 'Banks & asset managers')),
  title TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  regions TEXT[] NOT NULL DEFAULT '{}',
  role TEXT NOT NULL CHECK (role IN (
    'Quant Researcher', 'Quant Trader', 'Quant Developer', 'Quant Analyst & Strats',
    'Risk & Model Validation', 'Data Science & ML', 'Software Engineering'
  )),
  level TEXT NOT NULL CHECK (level IN ('Intern', 'New grad', 'Experienced', 'Unspecified')),
  url TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',      -- plain text, trimmed; used for CV matching
  epigram_label TEXT,                        -- matching problems.company_labels value, if any
  posted_at TIMESTAMPTZ,                     -- the firm's own posting date, when it gives one
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),   -- drives the "New today" badge and alerts
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE    -- false once a refresh no longer finds it
);

CREATE INDEX IF NOT EXISTS job_openings_active_first_seen_idx
  ON public.job_openings (is_active, first_seen_at DESC);
CREATE INDEX IF NOT EXISTS job_openings_firm_idx
  ON public.job_openings (firm);

ALTER TABLE public.job_openings ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------------------------
-- 2. One log row per daily refresh, so a firm whose feed breaks is easy to spot
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.job_refresh_runs (
  id BIGSERIAL PRIMARY KEY,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  firms_ok INTEGER NOT NULL DEFAULT 0,
  firms_failed TEXT[] NOT NULL DEFAULT '{}',
  openings_seen INTEGER NOT NULL DEFAULT 0,
  openings_new INTEGER NOT NULL DEFAULT 0,
  openings_closed INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.job_refresh_runs ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------------------------
-- 3. Each user's CV profile and job preferences (one row per user)
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_cv_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- The uploaded file lives in the private `cvs` bucket at cvs/<user_id>/<file>
  cv_storage_path TEXT,
  cv_file_name TEXT,
  cv_uploaded_at TIMESTAMPTZ,

  -- Extracted by the server from the CV, then shown to the user to confirm or edit.
  -- The JSONB sections are lists with a fixed shape (validated by the server before saving):
  --
  -- education:    [{ "institution": "University of Pennsylvania", "degree": "PhD",
  --                  "field": "Mathematics", "start": "2018-08", "end": "2023-05",
  --                  "gpa": "3.90/4.00", "thesis": "..." }]
  --                degree is one of PhD | Master's | Bachelor's | Other; end null = ongoing
  -- experiences:  [{ "organization": "Mina Analytics", "title": "Head of Quantitative Research",
  --                  "type": "full-time", "start": "2024-02", "end": "2025-10",
  --                  "location": "New York, NY", "highlights": ["Led ...", "Managed ..."],
  --                  "skills": ["Econometrics", "Machine learning"] }]
  --                type is one of full-time | internship | research | teaching | other
  -- skills:       [{ "name": "Python", "category": "programming", "level": "proficient" }]
  --                category: programming | math_stats | machine_learning | finance | tools
  --                level: expert | proficient | familiar   (from wording like "Familiar with: C++")
  -- achievements: [{ "title": "Putnam top 500", "type": "competition", "year": 2016 }]
  --                type: competition | award | publication | certification | other
  -- languages:    [{ "name": "Mandarin Chinese", "level": "native" }]
  --                level: native | fluent | professional | basic
  education JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(education) = 'array'),
  experiences JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(experiences) = 'array'),
  skills JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(skills) = 'array'),
  achievements JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(achievements) = 'array'),
  languages JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(languages) = 'array'),
  summary TEXT,                               -- two or three sentences, shown on the profile

  -- Derived from the lists above on every save, so filters and matching don't recompute them
  highest_degree TEXT CHECK (highest_degree IN ('PhD', 'Master''s', 'Bachelor''s', 'Other')),
  degree_field TEXT,
  graduation_year SMALLINT CHECK (graduation_year BETWEEN 1950 AND 2100),
  career_stage TEXT CHECK (career_stage IN ('Student', 'New grad', 'Experienced')),
  years_experience NUMERIC(4, 1) CHECK (years_experience >= 0),  -- full-time roles only

  extracted_at TIMESTAMPTZ,
  extraction_model TEXT,
  confirmed_at TIMESTAMPTZ,                   -- set when the user confirms the profile

  -- Entered by the user, never read from the CV: many postings state sponsorship terms.
  -- e.g. {"US": "authorized", "UK": "needs_sponsorship"}; empty = not provided
  work_authorization JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(work_authorization) = 'object'),

  -- What the user is looking for
  preferred_roles TEXT[] NOT NULL DEFAULT '{}',
  preferred_levels TEXT[] NOT NULL DEFAULT '{}',
  preferred_regions TEXT[] NOT NULL DEFAULT '{}',
  alerts_enabled BOOLEAN NOT NULL DEFAULT FALSE,  -- daily email of new strong matches (opt-in)

  -- The user agreed to their CV being stored and processed for matching
  consent_at TIMESTAMPTZ NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_cv_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own CV profile" ON public.user_cv_profiles;
CREATE POLICY "Users can view own CV profile"
  ON public.user_cv_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- update_updated_at_column() was created in 20250208_create_user_notes_table.sql
DROP TRIGGER IF EXISTS update_user_cv_profiles_updated_at ON public.user_cv_profiles;
CREATE TRIGGER update_user_cv_profiles_updated_at
  BEFORE UPDATE ON public.user_cv_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------------------------
-- 4. Fit scores between each user's profile and the active openings (recomputed daily)
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.job_matches (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opening_id TEXT NOT NULL REFERENCES public.job_openings(id) ON DELETE CASCADE,
  score SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 100),
  matched_skills TEXT[] NOT NULL DEFAULT '{}',
  missing_skills TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT[] NOT NULL DEFAULT '{}',         -- short reasons, e.g. 'Asks for a PhD (you have one)'
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, opening_id)
);

CREATE INDEX IF NOT EXISTS job_matches_user_score_idx
  ON public.job_matches (user_id, score DESC);

ALTER TABLE public.job_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own job matches" ON public.job_matches;
CREATE POLICY "Users can view own job matches"
  ON public.job_matches FOR SELECT
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------------------------
-- 5. Private bucket for uploaded CVs (PDF or Word, up to 5 MB)
--    No storage policies: uploads and downloads go through the server, which checks the user,
--    the Premium status and the file type before touching the bucket.
-- ---------------------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cvs',
  'cvs',
  FALSE,
  5242880,
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;
