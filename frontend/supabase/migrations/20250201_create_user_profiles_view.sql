-- Create a view that joins user_profiles with auth.users to include email
CREATE OR REPLACE VIEW public.user_profiles_with_email AS
SELECT 
  up.id,
  up.user_id,
  au.email,
  au.raw_user_meta_data->>'full_name' as full_name,
  up.school,
  up.course,
  up.referral_source,
  up.referral_other,
  up.onboarding_completed,
  up.created_at,
  up.updated_at,
  au.created_at as user_created_at,
  au.confirmed_at,
  au.last_sign_in_at
FROM 
  public.user_profiles up
  INNER JOIN auth.users au ON up.user_id = au.id;

-- Grant select permissions on the view
GRANT SELECT ON public.user_profiles_with_email TO authenticated;
GRANT SELECT ON public.user_profiles_with_email TO service_role;

-- Add RLS policy for the view
ALTER VIEW public.user_profiles_with_email SET (security_invoker = on);

-- Create a function to get all user profiles with email (for admin use)
CREATE OR REPLACE FUNCTION public.get_all_user_profiles_with_email()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email TEXT,
  full_name TEXT,
  school TEXT,
  course TEXT,
  referral_source TEXT,
  referral_other TEXT,
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
    (au.raw_user_meta_data->>'full_name')::TEXT as full_name,
    up.school,
    up.course,
    up.referral_source,
    up.referral_other,
    up.onboarding_completed,
    up.created_at,
    up.updated_at,
    au.created_at as user_created_at,
    au.confirmed_at,
    au.last_sign_in_at
  FROM 
    public.user_profiles up
    INNER JOIN auth.users au ON up.user_id = au.id
  ORDER BY up.created_at DESC;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_all_user_profiles_with_email() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_user_profiles_with_email() TO service_role;