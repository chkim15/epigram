-- Migration to create junction table for problem-topic relationships (many-to-many)
-- This migration assumes math_approach, reasoning_type arrays and included column already exist

-- Step 1: Create junction table for problem-topics relationship
CREATE TABLE IF NOT EXISTS problem_topics (
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
    topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (problem_id, topic_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_problem_topics_problem_id ON problem_topics(problem_id);
CREATE INDEX IF NOT EXISTS idx_problem_topics_topic_id ON problem_topics(topic_id);

-- Step 2: Migrate existing topic_id data to junction table (if column exists)
DO $$
BEGIN
    -- Check if the old topic_id column still exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'problems' AND column_name = 'topic_id') THEN
        
        -- Insert existing relationships into junction table
        INSERT INTO problem_topics (problem_id, topic_id)
        SELECT id, topic_id 
        FROM problems 
        WHERE topic_id IS NOT NULL
        ON CONFLICT (problem_id, topic_id) DO NOTHING;
        
        -- Drop the foreign key constraint if it exists
        ALTER TABLE problems 
        DROP CONSTRAINT IF EXISTS problems_topic_id_fkey;
        
        -- Drop the old topic_id column
        ALTER TABLE problems 
        DROP COLUMN IF EXISTS topic_id;
        
        RAISE NOTICE 'Migrated existing topic_id data to junction table and removed old column';
    ELSE
        RAISE NOTICE 'topic_id column does not exist, skipping migration';
    END IF;
END $$;

-- Step 3: Create helper function to get problems with their topics
CREATE OR REPLACE FUNCTION get_problems_with_topics(doc_id UUID DEFAULT NULL)
RETURNS TABLE (
    problem_id UUID,
    problem_id_text TEXT,
    problem_text TEXT,
    correct_answer TEXT,
    hint TEXT,
    solution_text TEXT,
    math_approach TEXT[],
    reasoning_type TEXT[],
    topic_ids INTEGER[],
    difficulty TEXT,
    importance INTEGER,
    comment TEXT,
    version TEXT,
    included BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.problem_id,
        p.problem_text,
        p.correct_answer,
        p.hint,
        p.solution_text,
        p.math_approach,
        p.reasoning_type,
        ARRAY_AGG(pt.topic_id ORDER BY pt.topic_id) FILTER (WHERE pt.topic_id IS NOT NULL) as topic_ids,
        p.difficulty,
        p.importance,
        p.comment,
        p.version,
        p.included,
        p.created_at,
        p.updated_at
    FROM problems p
    LEFT JOIN problem_topics pt ON p.id = pt.problem_id
    WHERE (doc_id IS NULL OR p.document_id = doc_id)
    GROUP BY p.id;
END;
$$ LANGUAGE plpgsql;

-- Add documentation comments
COMMENT ON TABLE problem_topics IS 'Junction table for many-to-many relationship between problems and topics';
COMMENT ON FUNCTION get_problems_with_topics IS 'Returns problems with their associated topics aggregated as an array';

-- Verify the migration
DO $$
DECLARE
    topic_count INTEGER;
    problem_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO topic_count FROM problem_topics;
    SELECT COUNT(*) INTO problem_count FROM problems WHERE id IN (SELECT DISTINCT problem_id FROM problem_topics);
    
    RAISE NOTICE 'Migration complete: % topic associations for % problems', topic_count, problem_count;
END $$;