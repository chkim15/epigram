-- Surgical fix for 10 problems with incorrect topic mappings
-- These problems had their topic IDs unchanged when they should have been remapped

-- ============================================
-- Identify the specific problems that need fixing
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'Fixing 10 incorrectly mapped problems...';
    RAISE NOTICE 'These are problems where the old and new topic IDs were the same number';
    RAISE NOTICE 'but represent different topics, so they should have been remapped';
END $$;

-- ============================================
-- Fix the incorrect mappings
-- ============================================
-- IMPORTANT: Some problems have multiple topic associations.
-- We need to DELETE the wrong association and INSERT the correct one
-- to avoid duplicate key violations.

-- Fix associations where OLD topic 4 should be NEW topic 2
-- OLD 4 was "Indeterminate Forms Limits via Algebraic Manipulation" 
-- But if problem already has topic 2, just delete topic 4
DO $$
BEGIN
    -- Delete the incorrect topic 4 associations
    DELETE FROM problem_topics pt
    USING problem_topics_backup_20250127 old
    WHERE pt.problem_id = old.problem_id
      AND old.topic_id = 4 
      AND pt.topic_id = 4;
    
    -- Insert the correct topic 2 associations (if not already present)
    INSERT INTO problem_topics (problem_id, topic_id, created_at)
    SELECT DISTINCT old.problem_id, 2, old.created_at
    FROM problem_topics_backup_20250127 old
    WHERE old.topic_id = 4
    ON CONFLICT (problem_id, topic_id) DO NOTHING;
    
    RAISE NOTICE 'Fixed OLD topic 4 → NEW topic 2';
END $$;

-- Fix associations where OLD topic 9 should be NEW topic 7
-- OLD 9 was "Logarithmic Differentiation"
DO $$
BEGIN
    -- Delete the incorrect topic 9 associations
    DELETE FROM problem_topics pt
    USING problem_topics_backup_20250127 old
    WHERE pt.problem_id = old.problem_id
      AND old.topic_id = 9 
      AND pt.topic_id = 9;
    
    -- Insert the correct topic 7 associations (if not already present)
    INSERT INTO problem_topics (problem_id, topic_id, created_at)
    SELECT DISTINCT old.problem_id, 7, old.created_at
    FROM problem_topics_backup_20250127 old
    WHERE old.topic_id = 9
    ON CONFLICT (problem_id, topic_id) DO NOTHING;
    
    RAISE NOTICE 'Fixed OLD topic 9 → NEW topic 7';
END $$;

-- Fix associations where OLD topic 12 should be NEW topic 11
-- OLD 12 was "Extreme Values, Monotonicity and Concavity"
DO $$
BEGIN
    -- Delete the incorrect topic 12 associations
    DELETE FROM problem_topics pt
    USING problem_topics_backup_20250127 old
    WHERE pt.problem_id = old.problem_id
      AND old.topic_id = 12 
      AND pt.topic_id = 12;
    
    -- Insert the correct topic 11 associations (if not already present)
    INSERT INTO problem_topics (problem_id, topic_id, created_at)
    SELECT DISTINCT old.problem_id, 11, old.created_at
    FROM problem_topics_backup_20250127 old
    WHERE old.topic_id = 12
    ON CONFLICT (problem_id, topic_id) DO NOTHING;
    
    RAISE NOTICE 'Fixed OLD topic 12 → NEW topic 11';
END $$;

-- Fix associations where OLD topic 16 should be NEW topic 14
-- OLD 16 was "Riemann Sum and Definite Integral"
DO $$
BEGIN
    -- Delete the incorrect topic 16 associations
    DELETE FROM problem_topics pt
    USING problem_topics_backup_20250127 old
    WHERE pt.problem_id = old.problem_id
      AND old.topic_id = 16 
      AND pt.topic_id = 16;
    
    -- Insert the correct topic 14 associations (if not already present)
    INSERT INTO problem_topics (problem_id, topic_id, created_at)
    SELECT DISTINCT old.problem_id, 14, old.created_at
    FROM problem_topics_backup_20250127 old
    WHERE old.topic_id = 16
    ON CONFLICT (problem_id, topic_id) DO NOTHING;
    
    RAISE NOTICE 'Fixed OLD topic 16 → NEW topic 14';
END $$;

-- ============================================
-- Verification
-- ============================================
DO $$
DECLARE
    v_fixed_count INTEGER;
    v_remaining_wrong INTEGER;
BEGIN
    -- Count how many we fixed
    SELECT COUNT(*) INTO v_fixed_count
    FROM (
        SELECT DISTINCT problem_id FROM problem_topics WHERE topic_id = 2
        AND problem_id IN (SELECT problem_id FROM problem_topics_backup_20250127 WHERE topic_id = 4)
        UNION
        SELECT DISTINCT problem_id FROM problem_topics WHERE topic_id = 7
        AND problem_id IN (SELECT problem_id FROM problem_topics_backup_20250127 WHERE topic_id = 9)
        UNION
        SELECT DISTINCT problem_id FROM problem_topics WHERE topic_id = 11
        AND problem_id IN (SELECT problem_id FROM problem_topics_backup_20250127 WHERE topic_id = 12)
        UNION
        SELECT DISTINCT problem_id FROM problem_topics WHERE topic_id = 14
        AND problem_id IN (SELECT problem_id FROM problem_topics_backup_20250127 WHERE topic_id = 16)
    ) fixed;
    
    -- Check if any problems still have wrong mappings
    SELECT COUNT(*) INTO v_remaining_wrong
    FROM problem_topics pt
    JOIN problem_topics_backup_20250127 old ON pt.problem_id = old.problem_id
    WHERE (old.topic_id = 4 AND pt.topic_id = 4)
       OR (old.topic_id = 9 AND pt.topic_id = 9)
       OR (old.topic_id = 12 AND pt.topic_id = 12)
       OR (old.topic_id = 16 AND pt.topic_id = 16);
    
    RAISE NOTICE '=== Fix Verification ===';
    RAISE NOTICE 'Problems fixed: %', v_fixed_count;
    RAISE NOTICE 'Remaining wrong mappings: %', v_remaining_wrong;
    
    IF v_remaining_wrong = 0 THEN
        RAISE NOTICE '✓ All incorrect mappings have been fixed!';
    ELSE
        RAISE WARNING '✗ There are still % incorrect mappings!', v_remaining_wrong;
    END IF;
END $$;

-- Show the final state of these specific problems
SELECT 
    'OLD 4 → NEW 2' as mapping,
    COUNT(*) as problems,
    STRING_AGG(problem_id::TEXT, ', ' ORDER BY problem_id) as problem_ids
FROM problem_topics 
WHERE topic_id = 2
  AND problem_id IN (SELECT problem_id FROM problem_topics_backup_20250127 WHERE topic_id = 4)
UNION ALL
SELECT 
    'OLD 9 → NEW 7',
    COUNT(*),
    STRING_AGG(problem_id::TEXT, ', ' ORDER BY problem_id)
FROM problem_topics 
WHERE topic_id = 7
  AND problem_id IN (SELECT problem_id FROM problem_topics_backup_20250127 WHERE topic_id = 9)
UNION ALL
SELECT 
    'OLD 12 → NEW 11',
    COUNT(*),
    STRING_AGG(problem_id::TEXT, ', ' ORDER BY problem_id)
FROM problem_topics 
WHERE topic_id = 11
  AND problem_id IN (SELECT problem_id FROM problem_topics_backup_20250127 WHERE topic_id = 12)
UNION ALL
SELECT 
    'OLD 16 → NEW 14',
    COUNT(*),
    STRING_AGG(problem_id::TEXT, ', ' ORDER BY problem_id)
FROM problem_topics 
WHERE topic_id = 14
  AND problem_id IN (SELECT problem_id FROM problem_topics_backup_20250127 WHERE topic_id = 16);