-- Migration: stored translations of problem content (one row per problem per language).
-- Target: the upennmath.ai Supabase project (the one the web app reads), NOT the personal editor DB.
-- Applied by hand in the Supabase SQL editor of the upennmath.ai project after the PR is approved.
--
-- Design: translate once, store, retranslate only when the English changes (source_hash).
-- Math, code, tickers and numbers are never altered (enforced by translate_row.py before a row is written).
-- Every problem gets a translation. Premium or free is decided by the PROBLEM (problems.is_free), exactly as for
-- the English content, and the app applies that gate the same way for translated text. This table has no premium
-- logic of its own. It mirrors the access of the problems table (readable like `problems`; only the service role writes).

CREATE TABLE IF NOT EXISTS public.problem_translations (
  problem_id    UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  locale        TEXT NOT NULL CHECK (locale ~ '^[a-z]{2,3}(-[A-Z]{2})?$'),   -- 'zh-CN', 'ko', ...

  -- translated fields (same meaning as the English columns / tables)
  problem_name   TEXT,
  problem_text   TEXT,
  correct_answer TEXT,
  comment        TEXT,
  hint           TEXT,
  solution_text  TEXT,
  hints          JSONB NOT NULL DEFAULT '[]'::jsonb,   -- [{"hint_order": 0, "hint_text": "..."}]
  subproblems    JSONB NOT NULL DEFAULT '{}'::jsonb,   -- {"a": {problem_text, correct_answer, comment, hint, solution_text, hints:[...]}}

  -- bookkeeping
  source_hash   TEXT NOT NULL,                         -- sha256 of the English fields this was translated from
  status        TEXT NOT NULL DEFAULT 'machine' CHECK (status IN ('machine', 'reviewed')),
  model         TEXT,
  reviewer      TEXT,
  reviewed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (problem_id, locale)
);

COMMENT ON TABLE public.problem_translations IS
  'Machine/human translations of problem content. source_hash = hash of the English at translation time; a mismatch with the current English means the row is stale.';

CREATE INDEX IF NOT EXISTS idx_problem_translations_locale_status
  ON public.problem_translations (locale, status);

-- updated_at + never silently downgrade a human-reviewed row back to machine
CREATE OR REPLACE FUNCTION public.problem_translations_guard()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'reviewed' AND NEW.status = 'machine' THEN
    RAISE EXCEPTION 'problem_translations: refusing to overwrite a reviewed translation (problem %, locale %)',
      OLD.problem_id, OLD.locale;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_problem_translations_guard ON public.problem_translations;
CREATE TRIGGER trg_problem_translations_guard
  BEFORE UPDATE ON public.problem_translations
  FOR EACH ROW EXECUTE FUNCTION public.problem_translations_guard();

-- Row level security
ALTER TABLE public.problem_translations ENABLE ROW LEVEL SECURITY;

-- Same read access as the English `problems` table (see 20250127_fix_rls_allow_anon_read.sql: anyone may read).
-- Whether a user may SEE a given problem is the app's decision, based on the problem's is_free flag, and applies
-- to the translation of that problem identically.
DROP POLICY IF EXISTS "Anyone can view problem translations" ON public.problem_translations;
CREATE POLICY "Anyone can view problem translations" ON public.problem_translations
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.problems p
    WHERE p.id = problem_translations.problem_id AND p.included = true
  ));

-- No INSERT/UPDATE/DELETE policies: only the service role (which bypasses RLS) can write.
