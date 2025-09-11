-- Migration to create hints table for multiple hints per problem/subproblem
-- This allows progressive hint reveal functionality

-- ============================================
-- PHASE 1: Create hints table
-- ============================================
CREATE TABLE IF NOT EXISTS hints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
    subproblem_id UUID REFERENCES subproblems(id) ON DELETE CASCADE,
    hint_text TEXT NOT NULL,
    hint_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Ensure either problem_id or subproblem_id is set, but not both
    CONSTRAINT hint_parent_check CHECK (
        (problem_id IS NOT NULL AND subproblem_id IS NULL) OR
        (problem_id IS NULL AND subproblem_id IS NOT NULL)
    )
);

-- Add indexes for performance
CREATE INDEX idx_hints_problem_id ON hints(problem_id);
CREATE INDEX idx_hints_subproblem_id ON hints(subproblem_id);
CREATE INDEX idx_hints_order ON hints(hint_order);

-- Add unique constraint to prevent duplicate orders for same problem/subproblem
CREATE UNIQUE INDEX idx_hints_unique_problem_order 
    ON hints(problem_id, hint_order) 
    WHERE problem_id IS NOT NULL;
    
CREATE UNIQUE INDEX idx_hints_unique_subproblem_order 
    ON hints(subproblem_id, hint_order) 
    WHERE subproblem_id IS NOT NULL;

-- Add comment to table
COMMENT ON TABLE hints IS 'Multiple hints for problems and subproblems with progressive reveal';
COMMENT ON COLUMN hints.hint_order IS 'Order of hint reveal (0 = first, 1 = second, etc.)';

-- ============================================
-- PHASE 2: Migrate existing hints
-- ============================================
DO $$
DECLARE
    migrated_problem_hints INTEGER;
    migrated_subproblem_hints INTEGER;
BEGIN
    -- Migrate existing hints from problems table
    INSERT INTO hints (problem_id, hint_text, hint_order)
    SELECT id, hint, 0 
    FROM problems 
    WHERE hint IS NOT NULL AND hint != '';
    
    GET DIAGNOSTICS migrated_problem_hints = ROW_COUNT;
    RAISE NOTICE 'Migrated % problem hints', migrated_problem_hints;
    
    -- Migrate existing hints from subproblems table
    INSERT INTO hints (subproblem_id, hint_text, hint_order)
    SELECT id, hint, 0 
    FROM subproblems 
    WHERE hint IS NOT NULL AND hint != '';
    
    GET DIAGNOSTICS migrated_subproblem_hints = ROW_COUNT;
    RAISE NOTICE 'Migrated % subproblem hints', migrated_subproblem_hints;
    
    RAISE NOTICE 'Total hints migrated: %', migrated_problem_hints + migrated_subproblem_hints;
END $$;

-- ============================================
-- PHASE 3: Add RLS policies for hints table
-- ============================================

-- Enable RLS
ALTER TABLE hints ENABLE ROW LEVEL SECURITY;

-- Policy for reading hints (everyone can read)
CREATE POLICY "Hints are viewable by everyone" ON hints
    FOR SELECT USING (true);

-- Policy for inserting hints (authenticated users only)
CREATE POLICY "Authenticated users can insert hints" ON hints
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy for updating hints (authenticated users only)
CREATE POLICY "Authenticated users can update hints" ON hints
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Policy for deleting hints (authenticated users only)
CREATE POLICY "Authenticated users can delete hints" ON hints
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================
-- PHASE 4: Create helper functions
-- ============================================

-- Function to get hints for a problem in order
CREATE OR REPLACE FUNCTION get_problem_hints(p_problem_id UUID)
RETURNS TABLE (
    id UUID,
    hint_text TEXT,
    hint_order INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT h.id, h.hint_text, h.hint_order
    FROM hints h
    WHERE h.problem_id = p_problem_id
    ORDER BY h.hint_order ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get hints for a subproblem in order
CREATE OR REPLACE FUNCTION get_subproblem_hints(p_subproblem_id UUID)
RETURNS TABLE (
    id UUID,
    hint_text TEXT,
    hint_order INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT h.id, h.hint_text, h.hint_order
    FROM hints h
    WHERE h.subproblem_id = p_subproblem_id
    ORDER BY h.hint_order ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PHASE 5: Optional - Drop old hint columns
-- ============================================
-- NOTE: We're keeping the old columns for now as backup
-- They can be dropped in a future migration after verifying everything works

-- ALTER TABLE problems DROP COLUMN IF EXISTS hint;
-- ALTER TABLE subproblems DROP COLUMN IF EXISTS hint;

-- ============================================
-- VERIFICATION
-- ============================================
DO $$
DECLARE
    hints_count INTEGER;
    problems_with_hints INTEGER;
    subproblems_with_hints INTEGER;
BEGIN
    SELECT COUNT(*) INTO hints_count FROM hints;
    SELECT COUNT(DISTINCT problem_id) INTO problems_with_hints 
        FROM hints WHERE problem_id IS NOT NULL;
    SELECT COUNT(DISTINCT subproblem_id) INTO subproblems_with_hints 
        FROM hints WHERE subproblem_id IS NOT NULL;
    
    RAISE NOTICE '=== Migration Verification ===';
    RAISE NOTICE 'Total hints in new table: %', hints_count;
    RAISE NOTICE 'Problems with hints: %', problems_with_hints;
    RAISE NOTICE 'Subproblems with hints: %', subproblems_with_hints;
END $$;

-- Sample query to verify migration
SELECT 
    'Problems' as type,
    COUNT(*) as total_with_hints
FROM problems 
WHERE hint IS NOT NULL AND hint != ''
UNION ALL
SELECT 
    'Subproblems' as type,
    COUNT(*) as total_with_hints
FROM subproblems 
WHERE hint IS NOT NULL AND hint != '';