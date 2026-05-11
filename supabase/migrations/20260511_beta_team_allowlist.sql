-- =====================================================
-- Beta Team Allowlist
-- Purpose: Grant indefinite premium (is_team = true) to a list of beta users.
--          Works for both already-signed-up users (backfill) and not-yet-
--          signed-up users (handle_new_user trigger).
-- =====================================================

-- 1. Allowlist table
CREATE TABLE IF NOT EXISTS public.beta_team_emails (
  email      TEXT PRIMARY KEY,
  note       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.beta_team_emails ENABLE ROW LEVEL SECURITY;

-- 2. Seed the 18 beta emails (lowercased for case-insensitive match)
INSERT INTO public.beta_team_emails (email, note) VALUES
  ('monody007@gmail.com',         'beta cohort 1'),
  ('yi.yao.cornell@outlook.com',  'beta cohort 1'),
  ('alichen31@gmail.com',         'beta cohort 1'),
  ('ruyi.chiang@gmail.com',       'beta cohort 1'),
  ('yiyangli2010@gmail.com',      'beta cohort 1'),
  ('hunjhunj@gmail.com',          'beta cohort 1'),
  ('hi@tonghe.xyz',               'beta cohort 1'),
  ('yeliu0724@hotmail.com',       'beta cohort 1'),
  ('larryjack640@gmail.com',      'beta cohort 1'),
  ('morningwind19923@gmail.com',  'beta cohort 1'),
  ('2921821087@qq.com',           'beta cohort 1'),
  ('jesselingod@sjtu.edu.cn',     'beta cohort 1'),
  ('nico.shi_ai@hotmail.com',     'beta cohort 1'),
  ('chessmayimayi@gmail.com',     'beta cohort 1'),
  ('chenxl03@gmail.com',          'beta cohort 1'),
  ('gianting01@gmail.com',        'beta cohort 1'),
  ('lianjiehui321@qq.com',        'beta cohort 1'),
  ('ck3182@columbia.edu',         'beta cohort 1')
ON CONFLICT (email) DO NOTHING;

-- 3. Extend handle_new_user() to auto-flag allowlisted emails as is_team
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_team BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.beta_team_emails
    WHERE email = LOWER(NEW.email)
  ) INTO v_is_team;

  INSERT INTO public.user_profiles (user_id, is_team)
  VALUES (NEW.id, v_is_team);
  RETURN NEW;
END;
$$;

-- 4. Backfill: flip is_team for betas already in auth.users
UPDATE public.user_profiles p
SET is_team = TRUE
FROM auth.users u
WHERE p.user_id = u.id
  AND LOWER(u.email) IN (SELECT email FROM public.beta_team_emails);
