ALTER TABLE public.user_profiles
ADD COLUMN welcome_email_sent BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill existing users so they don't receive a welcome email on next sign-in
UPDATE public.user_profiles SET welcome_email_sent = TRUE;
