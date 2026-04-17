-- Replace the old onboarding fields (school/course/referral) with new
-- quant-interview-focused fields on public.user_profiles. All existing
-- users are reset to re-run onboarding with the new questions.

-- Drop dependent view/function first (they reference the old columns).
DROP FUNCTION IF EXISTS public.get_all_user_profiles_with_email();
DROP VIEW IF EXISTS public.user_profiles_with_email;

-- Drop old onboarding columns.
ALTER TABLE public.user_profiles
  DROP COLUMN IF EXISTS school,
  DROP COLUMN IF EXISTS course,
  DROP COLUMN IF EXISTS referral_source,
  DROP COLUMN IF EXISTS referral_other;

-- Add new onboarding columns.
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS background TEXT,
  ADD COLUMN IF NOT EXISTS target_firms TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS target_firms_other TEXT,
  ADD COLUMN IF NOT EXISTS role_type TEXT,
  ADD COLUMN IF NOT EXISTS timeline TEXT,
  ADD COLUMN IF NOT EXISTS prep_level TEXT;

-- Reset onboarding so every existing user re-answers the new questions.
UPDATE public.user_profiles SET onboarding_completed = FALSE;

-- Recreate the email-joined view with the new shape.
CREATE OR REPLACE VIEW public.user_profiles_with_email AS
SELECT
  up.id,
  up.user_id,
  au.email,
  au.raw_user_meta_data->>'full_name' AS full_name,
  up.background,
  up.target_firms,
  up.target_firms_other,
  up.role_type,
  up.timeline,
  up.prep_level,
  up.onboarding_completed,
  up.created_at,
  up.updated_at,
  au.created_at AS user_created_at,
  au.confirmed_at,
  au.last_sign_in_at
FROM
  public.user_profiles up
  INNER JOIN auth.users au ON up.user_id = au.id;

GRANT SELECT ON public.user_profiles_with_email TO authenticated;
GRANT SELECT ON public.user_profiles_with_email TO service_role;

ALTER VIEW public.user_profiles_with_email SET (security_invoker = on);

-- Recreate the admin helper function with the new return shape.
CREATE OR REPLACE FUNCTION public.get_all_user_profiles_with_email()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email TEXT,
  full_name TEXT,
  background TEXT,
  target_firms TEXT[],
  target_firms_other TEXT,
  role_type TEXT,
  timeline TEXT,
  prep_level TEXT,
  onboarding_completed BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  user_created_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.id,
    up.user_id,
    au.email::TEXT,
    (au.raw_user_meta_data->>'full_name')::TEXT AS full_name,
    up.background,
    up.target_firms,
    up.target_firms_other,
    up.role_type,
    up.timeline,
    up.prep_level,
    up.onboarding_completed,
    up.created_at,
    up.updated_at,
    au.created_at AS user_created_at,
    au.confirmed_at,
    au.last_sign_in_at
  FROM
    public.user_profiles up
    INNER JOIN auth.users au ON up.user_id = au.id
  ORDER BY up.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_user_profiles_with_email() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_user_profiles_with_email() TO service_role;
