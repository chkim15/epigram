-- Add active_learning_mode column to user_preferences table
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS active_learning_mode BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN public.user_preferences.active_learning_mode IS 'When enabled, requires users to submit an answer before viewing solutions';