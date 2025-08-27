-- Enable Row Level Security (RLS) for problem_topics and solutions tables
-- This migration addresses security advisories from Supabase about RLS being disabled in public schema

-- Enable RLS on problem_topics table (junction table for many-to-many relationship)
ALTER TABLE public.problem_topics ENABLE ROW LEVEL SECURITY;

-- Enable RLS on solutions table
ALTER TABLE public.solutions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for problem_topics table
-- Allow all authenticated users to read problem-topic relationships
CREATE POLICY "Authenticated users can view problem topics" ON public.problem_topics
    FOR SELECT 
    TO authenticated
    USING (true);

-- Create RLS policies for solutions table
-- Allow all authenticated users to read solutions
CREATE POLICY "Authenticated users can view solutions" ON public.solutions
    FOR SELECT 
    TO authenticated
    USING (true);

-- Also check and enable RLS for other core tables if not already enabled
-- These tables contain academic content that should be readable by authenticated users

-- Enable RLS on documents table if not already enabled
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and create new one
DROP POLICY IF EXISTS "Authenticated users can view documents" ON public.documents;
CREATE POLICY "Authenticated users can view documents" ON public.documents
    FOR SELECT 
    TO authenticated
    USING (true);

-- Enable RLS on problems table if not already enabled
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and create new one
DROP POLICY IF EXISTS "Authenticated users can view problems" ON public.problems;
CREATE POLICY "Authenticated users can view problems" ON public.problems
    FOR SELECT 
    TO authenticated
    USING (true);

-- Enable RLS on subproblems table if not already enabled
ALTER TABLE public.subproblems ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and create new one
DROP POLICY IF EXISTS "Authenticated users can view subproblems" ON public.subproblems;
CREATE POLICY "Authenticated users can view subproblems" ON public.subproblems
    FOR SELECT 
    TO authenticated
    USING (true);

-- Enable RLS on topics table if not already enabled
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and create new one
DROP POLICY IF EXISTS "Authenticated users can view topics" ON public.topics;
CREATE POLICY "Authenticated users can view topics" ON public.topics
    FOR SELECT 
    TO authenticated
    USING (true);

-- Note: INSERT, UPDATE, and DELETE operations on these tables are restricted to service role only
-- This ensures that regular users cannot modify the academic content
-- Admin operations should be performed using the service role key

-- Add comments for documentation
COMMENT ON POLICY "Authenticated users can view problem topics" ON public.problem_topics 
    IS 'Allows authenticated users to read problem-topic relationships';

COMMENT ON POLICY "Authenticated users can view solutions" ON public.solutions 
    IS 'Allows authenticated users to read problem solutions';

COMMENT ON POLICY "Authenticated users can view documents" ON public.documents 
    IS 'Allows authenticated users to read document metadata';

COMMENT ON POLICY "Authenticated users can view problems" ON public.problems 
    IS 'Allows authenticated users to read problems';

COMMENT ON POLICY "Authenticated users can view subproblems" ON public.subproblems 
    IS 'Allows authenticated users to read subproblems';

COMMENT ON POLICY "Authenticated users can view topics" ON public.topics 
    IS 'Allows authenticated users to read topic definitions';