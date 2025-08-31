-- Fix RLS policies to allow anonymous read access for the editor
-- This migration updates the policies to allow both authenticated AND anonymous users to read data

-- Drop and recreate policies for problem_topics table
DROP POLICY IF EXISTS "Authenticated users can view problem topics" ON public.problem_topics;
CREATE POLICY "Anyone can view problem topics" ON public.problem_topics
    FOR SELECT 
    USING (true);  -- No role restriction - allows both anon and authenticated

-- Drop and recreate policies for solutions table
DROP POLICY IF EXISTS "Authenticated users can view solutions" ON public.solutions;
CREATE POLICY "Anyone can view solutions" ON public.solutions
    FOR SELECT 
    USING (true);  -- No role restriction - allows both anon and authenticated

-- Drop and recreate policies for documents table
DROP POLICY IF EXISTS "Authenticated users can view documents" ON public.documents;
CREATE POLICY "Anyone can view documents" ON public.documents
    FOR SELECT 
    USING (true);  -- No role restriction - allows both anon and authenticated

-- Drop and recreate policies for problems table
DROP POLICY IF EXISTS "Authenticated users can view problems" ON public.problems;
CREATE POLICY "Anyone can view problems" ON public.problems
    FOR SELECT 
    USING (true);  -- No role restriction - allows both anon and authenticated

-- Drop and recreate policies for subproblems table
DROP POLICY IF EXISTS "Authenticated users can view subproblems" ON public.subproblems;
CREATE POLICY "Anyone can view subproblems" ON public.subproblems
    FOR SELECT 
    USING (true);  -- No role restriction - allows both anon and authenticated

-- Drop and recreate policies for topics table
DROP POLICY IF EXISTS "Authenticated users can view topics" ON public.topics;
CREATE POLICY "Anyone can view topics" ON public.topics
    FOR SELECT 
    USING (true);  -- No role restriction - allows both anon and authenticated

-- Note: INSERT, UPDATE, and DELETE operations are still restricted (no policies for these operations)
-- This means only service role can modify data, which is what we want
-- The editor uses password protection for write operations

-- Add comments for documentation
COMMENT ON POLICY "Anyone can view problem topics" ON public.problem_topics 
    IS 'Allows anyone (including anonymous users) to read problem-topic relationships';

COMMENT ON POLICY "Anyone can view solutions" ON public.solutions 
    IS 'Allows anyone (including anonymous users) to read problem solutions';

COMMENT ON POLICY "Anyone can view documents" ON public.documents 
    IS 'Allows anyone (including anonymous users) to read document metadata';

COMMENT ON POLICY "Anyone can view problems" ON public.problems 
    IS 'Allows anyone (including anonymous users) to read problems';

COMMENT ON POLICY "Anyone can view subproblems" ON public.subproblems 
    IS 'Allows anyone (including anonymous users) to read subproblems';

COMMENT ON POLICY "Anyone can view topics" ON public.topics 
    IS 'Allows anyone (including anonymous users) to read topic definitions';