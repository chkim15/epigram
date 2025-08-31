-- Migration to restructure topics table from 40 topics to 34 topics with new IDs
-- This migration preserves all problem-topic associations while renumbering topics

-- ============================================
-- PHASE 1: Create Backup Tables
-- ============================================
DO $$
BEGIN
    -- Drop backup tables if they exist from previous attempts
    DROP TABLE IF EXISTS topics_backup_20250127;
    DROP TABLE IF EXISTS problem_topics_backup_20250127;
    DROP TABLE IF EXISTS topic_id_mapping;
    
    RAISE NOTICE 'Creating backup tables...';
END $$;

CREATE TABLE topics_backup_20250127 AS SELECT * FROM topics;
CREATE TABLE problem_topics_backup_20250127 AS SELECT * FROM problem_topics;

-- ============================================
-- PHASE 2: Create and Populate Mapping Table
-- ============================================
CREATE TABLE topic_id_mapping (
    old_id INTEGER,
    new_id INTEGER,
    old_subtopics TEXT,
    new_subtopics TEXT,
    new_main_topics TEXT,
    new_course TEXT,
    action TEXT -- 'map', 'remove', 'add', 'map_merge'
);

-- Insert complete mapping data
INSERT INTO topic_id_mapping (old_id, new_id, old_subtopics, new_subtopics, new_main_topics, new_course, action) VALUES
-- Removed topics
(1, NULL, 'Variables, Functions and Graphs', NULL, NULL, NULL, 'remove'),
(10, NULL, 'Inverse Trig and Hyperbolic Functions', NULL, NULL, NULL, 'remove'),
(38, NULL, 'Second Order Linear ODE', NULL, NULL, NULL, 'remove'),
(39, NULL, 'Nonhomogeneous Linear ODE', NULL, NULL, NULL, 'remove'),
(40, NULL, 'Series Solutions of ODE', NULL, NULL, NULL, 'remove'),

-- Topics that need special handling (have associations but are being removed)
(2, 2, 'Limits of Functions', 'Indeterminate Forms Limits via Algebraic Manipulation', 'Limits', 'Calculus I', 'map_merge'),
(35, 32, 'Applications of Taylor Polynomials', 'Taylor and MacLaurin Series', 'Sequences and Series', 'Calculus II', 'map_merge'),

-- Direct mappings with renumbering
(3, 1, 'Continuity and Intermediate Value Theorem', 'Continuity and IVT', 'Limits', 'Calculus I', 'map'),
(4, 2, 'Indeterminate Forms Limits via Algebraic Manipulation', 'Indeterminate Forms Limits via Algebraic Manipulation', 'Limits', 'Calculus I', 'map'),
(5, 3, 'Limits at Infinity and Asymptotes', 'Limits at Infinity and Asymptotes', 'Limits', 'Calculus I', 'map'),
(6, 4, 'Limiting Definition of Derivatives', 'Definition of Derivatives', 'Derivatives', 'Calculus I', 'map'),
(7, 5, 'Chain, Product and Quotient Rules', 'Chain, Product and Quotient Rules', 'Derivatives', 'Calculus I', 'map'),
(8, 6, 'Implicit Differentiation and Inverse Derivatives', 'Implicit Differentiation and Inverse Derivatives', 'Derivatives', 'Calculus I', 'map'),
(9, 7, 'Logarithmic Differentiation', 'Logarithmic Differentiation', 'Derivatives', 'Calculus I', 'map'),
(11, 9, 'Indeterminate Forms Limits via L''Hospital Rule', 'Indeterminate Forms Limits via L''Hospital Rule', 'Applications of Derivatives', 'Calculus I', 'map'),
(12, 11, 'Extreme Values, Monotonicity and Concavity', 'Extreme Values, Monotonicity and Concavity', 'Applications of Derivatives', 'Calculus I', 'map'),
(13, 12, 'Applied Optimization', 'Optimization', 'Applications of Derivatives', 'Calculus I', 'map'),
(14, 10, 'Approximation via Differentiation', 'Approximation via Differentiation', 'Applications of Derivatives', 'Calculus I', 'map'),
(15, 13, 'Antiderivatives', 'Anti-derivatives', 'Integration', 'Calculus I', 'map'),
(16, 14, 'Riemann Sum and Definite Integral', 'Riemann Sum and Definite Integral', 'Integration', 'Calculus I', 'map'),
(17, 15, 'Fundamental Theorem of Calculus', 'Fundamental Theorem of Calculus', 'Integration', 'Calculus I', 'map'),
(18, 16, 'Substitution Rules', 'Substitution', 'Integration', 'Calculus I', 'map'),
(19, 17, 'Area Between Curves', 'Area Between Curves', 'Integration', 'Calculus I', 'map'),
(20, 18, 'Volume by Slicing', 'Volume by Slicing', 'Integration', 'Calculus II', 'map'),
(21, 19, 'Volume by Cylindrical Shells', 'Volume by Cylindrical Shells', 'Integration', 'Calculus II', 'map'),
(22, 20, 'Integration by Parts', 'Integration by Parts', 'Integration', 'Calculus II', 'map'),
(23, 21, 'Partial Fractions', 'Partial Fractions', 'Integration', 'Calculus II', 'map'),
(24, 22, 'Improper Integrals', 'Improper Integrals', 'Integration', 'Calculus II', 'map'),
(25, 23, 'Arc Length', 'Arc Length', 'Integration', 'Calculus II', 'map'),
(26, 24, 'Surface Area', 'Surface Area', 'Integration', 'Calculus II', 'map'),
(27, 25, 'Sequences', 'Sequences', 'Integration', 'Calculus II', 'map'),
(28, 26, 'Series', 'Series', 'Sequences and Series', 'Calculus II', 'map'),
(29, 27, 'Integral Tests', 'Integral Tests', 'Sequences and Series', 'Calculus II', 'map'),
(30, 28, 'Comparison Tests', 'Comparison Tests', 'Sequences and Series', 'Calculus II', 'map'),
(31, 29, 'Alternating Series', 'Alternating Series', 'Sequences and Series', 'Calculus II', 'map'),
(32, 30, 'Absolute Convergence, Ratio and Root Test', 'Absolute Convergence, Ratio and Root Test', 'Sequences and Series', 'Calculus II', 'map'),
(33, 31, 'Power Series', 'Power Series', 'Sequences and Series', 'Calculus II', 'map'),
(34, 32, 'Taylor and MacLaurin Series', 'Taylor and MacLaurin Series', 'Sequences and Series', 'Calculus II', 'map'),
(36, 33, 'Separable and Homogeneous ODE', 'Separable ODE', 'Ordinary Differential Equations', 'Calculus II', 'map'),
(37, 34, 'First Order Linear ODE', 'First Order Linear ODE', 'Ordinary Differential Equations', 'Calculus II', 'map'),

-- New topic being added
(NULL, 8, NULL, 'Rolle''s Theorem and MVT', 'Derivatives', 'Calculus I', 'add');

-- ============================================
-- PHASE 3: Create New Topics Table Structure
-- ============================================
CREATE TABLE topics_new (
    id INTEGER PRIMARY KEY,
    subtopics TEXT,
    main_topics TEXT,
    course TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert all 34 new topics in the correct order
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
-- PHASE 4: Migrate Problem-Topic Associations
-- ============================================
CREATE TABLE problem_topics_new AS
SELECT DISTINCT
    pt.problem_id,
    CASE
        -- Handle special mappings for removed topics with associations
        WHEN pt.topic_id = 2 THEN 2  -- Old "Limits of Functions" maps to new "Indeterminate Forms Limits"
        WHEN pt.topic_id = 35 THEN 32 -- Old "Applications of Taylor Polynomials" maps to new "Taylor and MacLaurin Series"
        -- Regular mappings
        ELSE m.new_id
    END as topic_id,
    pt.created_at
FROM problem_topics pt
LEFT JOIN topic_id_mapping m ON pt.topic_id = m.old_id
WHERE 
    -- Include all topics that have a mapping
    (m.new_id IS NOT NULL AND m.action IN ('map', 'map_merge'))
    -- Or are the special cases
    OR pt.topic_id IN (2, 35);

-- ============================================
-- PHASE 5: Atomic Table Switch
-- ============================================
BEGIN;

-- Drop existing foreign key constraints
ALTER TABLE problem_topics DROP CONSTRAINT IF EXISTS problem_topics_topic_id_fkey;

-- Drop old tables
DROP TABLE problem_topics;
DROP TABLE topics;

-- Rename new tables to production names
ALTER TABLE topics_new RENAME TO topics;
ALTER TABLE problem_topics_new RENAME TO problem_topics;

-- Recreate primary key constraint on problem_topics
ALTER TABLE problem_topics ADD PRIMARY KEY (problem_id, topic_id);

-- Recreate foreign key constraints
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
-- PHASE 6: Verification
-- ============================================
DO $$
DECLARE
    old_association_count INTEGER;
    new_association_count INTEGER;
    old_unique_problems INTEGER;
    new_unique_problems INTEGER;
    orphaned_count INTEGER;
BEGIN
    -- Get counts from backup
    SELECT COUNT(*) INTO old_association_count FROM problem_topics_backup_20250127;
    SELECT COUNT(DISTINCT problem_id) INTO old_unique_problems FROM problem_topics_backup_20250127;
    
    -- Get counts from new table
    SELECT COUNT(*) INTO new_association_count FROM problem_topics;
    SELECT COUNT(DISTINCT problem_id) INTO new_unique_problems FROM problem_topics;
    
    -- Check for orphaned associations
    SELECT COUNT(*) INTO orphaned_count 
    FROM problem_topics 
    WHERE topic_id NOT IN (SELECT id FROM topics);
    
    -- Report results
    RAISE NOTICE '=== Migration Verification ===';
    RAISE NOTICE 'Old associations: %, New associations: %', old_association_count, new_association_count;
    RAISE NOTICE 'Old unique problems: %, New unique problems: %', old_unique_problems, new_unique_problems;
    RAISE NOTICE 'Orphaned associations: %', orphaned_count;
    
    IF orphaned_count > 0 THEN
        RAISE WARNING 'Found % orphaned associations!', orphaned_count;
    END IF;
    
    IF new_association_count < old_association_count THEN
        RAISE WARNING 'Lost % associations during migration!', old_association_count - new_association_count;
    END IF;
    
    RAISE NOTICE '=== Topics Count ===';
    RAISE NOTICE 'New topics table has % topics (should be 34)', (SELECT COUNT(*) FROM topics);
    
    -- Show mapping summary
    RAISE NOTICE '=== Mapping Summary ===';
    RAISE NOTICE 'Topics removed: %', (SELECT COUNT(*) FROM topic_id_mapping WHERE action = 'remove');
    RAISE NOTICE 'Topics mapped: %', (SELECT COUNT(*) FROM topic_id_mapping WHERE action = 'map');
    RAISE NOTICE 'Topics merged: %', (SELECT COUNT(*) FROM topic_id_mapping WHERE action = 'map_merge');
    RAISE NOTICE 'Topics added: %', (SELECT COUNT(*) FROM topic_id_mapping WHERE action = 'add');
END $$;

-- Show sample of migrated data
SELECT 
    t.id,
    t.subtopics,
    t.main_topics,
    t.course,
    COUNT(pt.problem_id) as problem_count
FROM topics t
LEFT JOIN problem_topics pt ON t.id = pt.topic_id
GROUP BY t.id, t.subtopics, t.main_topics, t.course
ORDER BY t.id
LIMIT 10;

-- ============================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================
-- To rollback this migration, run:
-- DROP TABLE IF EXISTS topics CASCADE;
-- DROP TABLE IF EXISTS problem_topics CASCADE;
-- ALTER TABLE topics_backup_20250127 RENAME TO topics;
-- ALTER TABLE problem_topics_backup_20250127 RENAME TO problem_topics;
-- DROP TABLE topic_id_mapping;