-- CORRECTED Migration to properly restructure topics table with ID remapping
-- This fixes the previous migration that failed to update topic IDs in problem_topics

-- ============================================
-- PHASE 1: Create New Topics Table (1-34)
-- ============================================
CREATE TABLE IF NOT EXISTS topics_new (
    id INTEGER PRIMARY KEY,
    subtopics TEXT,
    main_topics TEXT,
    course TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clear and insert all 34 new topics
TRUNCATE topics_new;
INSERT INTO topics_new (id, subtopics, main_topics, course) VALUES
(1, 'Continuity and IVT', 'Limits', 'Calculus I'),
(2, 'Indeterminate Forms Limits via Algebraic Manipulation', 'Limits', 'Calculus I'),
(3, 'Limits at Infinity and Asymptotes', 'Limits', 'Calculus I'),
(4, 'Definition of Derivatives', 'Derivatives', 'Calculus I'),
(5, 'Chain, Product and Quotient Rules', 'Derivatives', 'Calculus I'),
(6, 'Implicit Differentiation and Inverse Derivatives', 'Derivatives', 'Calculus I'),
(7, 'Logarithmic Differentiation', 'Derivatives', 'Calculus I'),
(8, 'Rolle''s Theorem and MVT', 'Derivatives', 'Calculus I'),
(9, 'Indeterminate Forms Limits via L''Hospital Rule', 'Applications of Derivatives', 'Calculus I'),
(10, 'Approximation via Differentiation', 'Applications of Derivatives', 'Calculus I'),
(11, 'Extreme Values, Monotonicity and Concavity', 'Applications of Derivatives', 'Calculus I'),
(12, 'Optimization', 'Applications of Derivatives', 'Calculus I'),
(13, 'Anti-derivatives', 'Integration', 'Calculus I'),
(14, 'Riemann Sum and Definite Integral', 'Integration', 'Calculus I'),
(15, 'Fundamental Theorem of Calculus', 'Integration', 'Calculus I'),
(16, 'Substitution', 'Integration', 'Calculus I'),
(17, 'Area Between Curves', 'Integration', 'Calculus I'),
(18, 'Volume by Slicing', 'Integration', 'Calculus II'),
(19, 'Volume by Cylindrical Shells', 'Integration', 'Calculus II'),
(20, 'Integration by Parts', 'Integration', 'Calculus II'),
(21, 'Partial Fractions', 'Integration', 'Calculus II'),
(22, 'Improper Integrals', 'Integration', 'Calculus II'),
(23, 'Arc Length', 'Integration', 'Calculus II'),
(24, 'Surface Area', 'Integration', 'Calculus II'),
(25, 'Sequences', 'Integration', 'Calculus II'),
(26, 'Series', 'Sequences and Series', 'Calculus II'),
(27, 'Integral Tests', 'Sequences and Series', 'Calculus II'),
(28, 'Comparison Tests', 'Sequences and Series', 'Calculus II'),
(29, 'Alternating Series', 'Sequences and Series', 'Calculus II'),
(30, 'Absolute Convergence, Ratio and Root Test', 'Sequences and Series', 'Calculus II'),
(31, 'Power Series', 'Sequences and Series', 'Calculus II'),
(32, 'Taylor and MacLaurin Series', 'Sequences and Series', 'Calculus II'),
(33, 'Separable ODE', 'Ordinary Differential Equations', 'Calculus II'),
(34, 'First Order Linear ODE', 'Ordinary Differential Equations', 'Calculus II');

-- ============================================
-- PHASE 2: Create NEW problem_topics with PROPER ID mapping
-- ============================================
CREATE TABLE IF NOT EXISTS problem_topics_new (
    problem_id UUID,
    topic_id INTEGER,
    created_at TIMESTAMPTZ
);

-- Clear and populate with CORRECTLY MAPPED IDs
TRUNCATE problem_topics_new;
INSERT INTO problem_topics_new (problem_id, topic_id, created_at)
SELECT 
    problem_id,
    new_topic_id,
    MIN(created_at) as created_at
FROM (
    SELECT 
        problem_id,
        CASE topic_id
            -- Topics that are removed (1, 10, 38, 39, 40) - these shouldn't have associations based on earlier check
            -- Topic 2 "Limits of Functions" → maps to NEW 2 "Indeterminate Forms Limits via Algebraic Manipulation"
            WHEN 2 THEN 2
            -- Topic 3 "Continuity and Intermediate Value Theorem" → NEW 1
            WHEN 3 THEN 1
            -- Topic 4 "Indeterminate Forms Limits via Algebraic Manipulation" → NEW 2
            WHEN 4 THEN 2
            -- Topic 5 "Limits at Infinity and Asymptotes" → NEW 3
            WHEN 5 THEN 3
            -- Topic 6 "Limiting Definition of Derivatives" → NEW 4
            WHEN 6 THEN 4
            -- Topic 7 "Chain, Product and Quotient Rules" → NEW 5
            WHEN 7 THEN 5
            -- Topic 8 "Implicit Differentiation and Inverse Derivatives" → NEW 6
            WHEN 8 THEN 6
            -- Topic 9 "Logarithmic Differentiation" → NEW 7
            WHEN 9 THEN 7
            -- Topic 11 "Indeterminate Forms Limits via L'Hospital Rule" → NEW 9
            WHEN 11 THEN 9
            -- Topic 12 "Extreme Values, Monotonicity and Concavity" → NEW 11
            WHEN 12 THEN 11
            -- Topic 13 "Applied Optimization" → NEW 12
            WHEN 13 THEN 12
            -- Topic 14 "Approximation via Differentiation" → NEW 10
            WHEN 14 THEN 10
            -- Topic 15 "Antiderivatives" → NEW 13
            WHEN 15 THEN 13
            -- Topic 16 "Riemann Sum and Definite Integral" → NEW 14
            WHEN 16 THEN 14
            -- Topic 17 "Fundamental Theorem of Calculus" → NEW 15
            WHEN 17 THEN 15
            -- Topic 18 "Substitution Rules" → NEW 16
            WHEN 18 THEN 16
            -- Topic 19 "Area Between Curves" → NEW 17
            WHEN 19 THEN 17
            -- Topic 20 "Volume by Slicing" → NEW 18
            WHEN 20 THEN 18
            -- Topic 21 "Volume by Cylindrical Shells" → NEW 19
            WHEN 21 THEN 19
            -- Topic 22 "Integration by Parts" → NEW 20
            WHEN 22 THEN 20
            -- Topic 23 "Partial Fractions" → NEW 21
            WHEN 23 THEN 21
            -- Topic 24 "Improper Integrals" → NEW 22
            WHEN 24 THEN 22
            -- Topic 25 "Arc Length" → NEW 23
            WHEN 25 THEN 23
            -- Topic 26 "Surface Area" → NEW 24
            WHEN 26 THEN 24
            -- Topic 27 "Sequences" → NEW 25
            WHEN 27 THEN 25
            -- Topic 28 "Series" → NEW 26
            WHEN 28 THEN 26
            -- Topic 29 "Integral Tests" → NEW 27
            WHEN 29 THEN 27
            -- Topic 30 "Comparison Tests" → NEW 28
            WHEN 30 THEN 28
            -- Topic 31 "Alternating Series" → NEW 29
            WHEN 31 THEN 29
            -- Topic 32 "Absolute Convergence, Ratio and Root Test" → NEW 30
            WHEN 32 THEN 30
            -- Topic 33 "Power Series" → NEW 31
            WHEN 33 THEN 31
            -- Topic 34 "Taylor and MacLaurin Series" → NEW 32
            WHEN 34 THEN 32
            -- Topic 35 "Applications of Taylor Polynomials" → NEW 32 (merge with Taylor series)
            WHEN 35 THEN 32
            -- Topic 36 "Separable and Homogeneous ODE" → NEW 33
            WHEN 36 THEN 33
            -- Topic 37 "First Order Linear ODE" → NEW 34
            WHEN 37 THEN 34
            -- Any other ID (shouldn't happen based on data)
            ELSE NULL
        END as new_topic_id,
        created_at
    FROM problem_topics
    WHERE topic_id IS NOT NULL
) mapped
WHERE new_topic_id IS NOT NULL
GROUP BY problem_id, new_topic_id;

-- ============================================
-- PHASE 3: Atomic Switch
-- ============================================
BEGIN;

-- Drop constraints
ALTER TABLE problem_topics DROP CONSTRAINT IF EXISTS problem_topics_topic_id_fkey;
ALTER TABLE problem_topics DROP CONSTRAINT IF EXISTS problem_topics_problem_id_fkey;

-- Replace tables
DROP TABLE problem_topics;
DROP TABLE topics;

ALTER TABLE topics_new RENAME TO topics;
ALTER TABLE problem_topics_new RENAME TO problem_topics;

-- Add back constraints
ALTER TABLE problem_topics ADD PRIMARY KEY (problem_id, topic_id);

ALTER TABLE problem_topics 
    ADD CONSTRAINT problem_topics_topic_id_fkey 
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE;

ALTER TABLE problem_topics 
    ADD CONSTRAINT problem_topics_problem_id_fkey 
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_problem_topics_problem_id ON problem_topics(problem_id);
CREATE INDEX IF NOT EXISTS idx_problem_topics_topic_id ON problem_topics(topic_id);

COMMIT;

-- ============================================
-- PHASE 4: Verification
-- ============================================
DO $$
DECLARE
    v_old_count INTEGER;
    v_new_count INTEGER;
    v_topic_count INTEGER;
BEGIN
    -- Get counts
    SELECT COUNT(*) INTO v_old_count FROM problem_topics_backup_20250127;
    SELECT COUNT(*) INTO v_new_count FROM problem_topics;
    SELECT COUNT(*) INTO v_topic_count FROM topics;
    
    RAISE NOTICE '=== Migration Verification ===';
    RAISE NOTICE 'Original associations: %', v_old_count;
    RAISE NOTICE 'New associations: %', v_new_count;
    RAISE NOTICE 'Topics in new table: % (should be 34)', v_topic_count;
    
    -- Check specific examples
    RAISE NOTICE '=== Spot Check Examples ===';
    
    -- Example 1: Check problems that were topic 7 (Chain/Product/Quotient)
    -- Should now be topic 5
    PERFORM 1 FROM problem_topics WHERE topic_id = 5;
    IF FOUND THEN
        RAISE NOTICE '✓ Old topic 7 problems correctly mapped to new topic 5';
    ELSE
        RAISE WARNING '✗ Old topic 7 problems NOT found at new topic 5!';
    END IF;
    
    -- Example 2: Check that topic 8 (new Rolle's Theorem) has no associations yet
    PERFORM 1 FROM problem_topics WHERE topic_id = 8;
    IF NOT FOUND THEN
        RAISE NOTICE '✓ New topic 8 (Rolle''s Theorem) correctly has no associations';
    ELSE
        RAISE WARNING '✗ New topic 8 should not have associations!';
    END IF;
END $$;

-- Show sample of the mapping results
SELECT 
    t.id as topic_id,
    t.subtopics,
    t.main_topics,
    COUNT(pt.problem_id) as problem_count
FROM topics t
LEFT JOIN problem_topics pt ON t.id = pt.topic_id
GROUP BY t.id, t.subtopics, t.main_topics
ORDER BY t.id
LIMIT 15;