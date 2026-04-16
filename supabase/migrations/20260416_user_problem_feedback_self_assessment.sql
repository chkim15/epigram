DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_problem_feedback'
      AND column_name = 'difficulty'
  ) THEN
    ALTER TABLE public.user_problem_feedback
      RENAME COLUMN difficulty TO self_assessment;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_problem_feedback'
      AND column_name = 'self_assessment'
  ) THEN
    ALTER TABLE public.user_problem_feedback ADD COLUMN self_assessment TEXT;
  END IF;
END $$;
