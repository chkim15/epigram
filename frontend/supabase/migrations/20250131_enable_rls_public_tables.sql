-- Migration: Enable RLS with public read access for topics and problem_topics tables
-- Date: 2025-01-31
-- Purpose: Fix security issues while maintaining read access for all users

-- ============================================
-- 1. Test current access (run these queries first in SQL Editor)
-- ============================================
-- Run these tests BEFORE applying the migration:
-- SELECT COUNT(*) FROM public.topics; -- Should return topic count
-- SELECT COUNT(*) FROM public.problem_topics; -- Should return junction records count

-- ============================================
-- 2. Enable RLS for topics table with public read policy
-- ============================================

-- Enable RLS on topics table
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

-- Create policy to allow everyone to read topics
CREATE POLICY "Anyone can read topics"
ON public.topics
FOR SELECT
USING (true);

-- Note: No INSERT, UPDATE, or DELETE policies means only service role can modify

-- ============================================
-- 3. Enable RLS for problem_topics junction table with public read policy
-- ============================================

-- Enable RLS on problem_topics table
ALTER TABLE public.problem_topics ENABLE ROW LEVEL SECURITY;

-- Create policy to allow everyone to read problem_topics
CREATE POLICY "Anyone can read problem_topics"
ON public.problem_topics
FOR SELECT
USING (true);

-- Note: No INSERT, UPDATE, or DELETE policies means only service role can modify

-- ============================================
-- 4. Verify policies are working
-- ============================================
-- Run these tests AFTER applying the migration:
-- SELECT COUNT(*) FROM public.topics; -- Should still return topic count
-- SELECT COUNT(*) FROM public.problem_topics; -- Should still return junction records count

-- ============================================
-- ROLLBACK SCRIPT (if anything breaks)
-- ============================================
-- If the app stops working, run these commands to rollback:
/*
-- Disable RLS on both tables
ALTER TABLE public.topics DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_topics DISABLE ROW LEVEL SECURITY;

-- Drop the policies
DROP POLICY IF EXISTS "Anyone can read topics" ON public.topics;
DROP POLICY IF EXISTS "Anyone can read problem_topics" ON public.problem_topics;
*/