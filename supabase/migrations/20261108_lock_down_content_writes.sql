-- Lock down problem content so the public anon key can no longer modify it.
-- Writes now go through the service-role key only (the database editor asks for it at runtime).
-- Reads are unchanged.

-- 1. Drop "anyone can write" policies on content tables
DROP POLICY IF EXISTS "Allow public write" ON public.problems;
DROP POLICY IF EXISTS "Allow public write" ON public.solutions;
DROP POLICY IF EXISTS "Allow public write" ON public.hints;
DROP POLICY IF EXISTS "Allow public write" ON public.subproblems;
DROP POLICY IF EXISTS "Allow public write" ON public.documents;

DROP POLICY IF EXISTS "Allow public insert problem_four_week_topics" ON public.problem_four_week_topics;
DROP POLICY IF EXISTS "Allow public update problem_four_week_topics" ON public.problem_four_week_topics;
DROP POLICY IF EXISTS "Allow public delete problem_four_week_topics" ON public.problem_four_week_topics;

DROP POLICY IF EXISTS "Anon users can insert problem_topics" ON public.problem_topics;
DROP POLICY IF EXISTS "Anon users can delete problem_topics" ON public.problem_topics;
DROP POLICY IF EXISTS "Authenticated users can insert problem_topics" ON public.problem_topics;
DROP POLICY IF EXISTS "Authenticated users can update problem_topics" ON public.problem_topics;
DROP POLICY IF EXISTS "Authenticated users can delete problem_topics" ON public.problem_topics;

-- Any signed-in user could edit topic notes; only scripts/upload_topic_notes.py (service role) writes them.
DROP POLICY IF EXISTS "Authenticated users can insert topic notes" ON public.topic_notes;
DROP POLICY IF EXISTS "Authenticated users can update topic notes" ON public.topic_notes;

-- 2. Remove anon write grants on content tables as a second layer
REVOKE INSERT, UPDATE, DELETE ON
  public.problems, public.solutions, public.hints, public.subproblems, public.documents,
  public.problem_topics, public.problem_quant_topics, public.problem_four_week_topics,
  public.topics, public.quant_topics, public.four_week_topics, public.topic_notes
FROM anon;

-- 3. Problem images bucket: keep public read, drop public write
DROP POLICY IF EXISTS "Public insert access" ON storage.objects;
DROP POLICY IF EXISTS "Public update access" ON storage.objects;
DROP POLICY IF EXISTS "Public delete access" ON storage.objects;

-- 4. This SECURITY DEFINER function returned every user's email to anyone with the anon key.
-- Nothing in the app calls it; the service role keeps access.
REVOKE EXECUTE ON FUNCTION public.get_all_user_profiles_with_email() FROM PUBLIC, anon, authenticated;
