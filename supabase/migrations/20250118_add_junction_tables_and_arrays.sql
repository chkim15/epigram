-- Migration to support multiple topics, approaches, and reasoning types
-- This migration:
-- 1. Creates a junction table for problem-topic relationships (many-to-many)
-- 2. Converts math_approach and reasoning_type to arrays
-- 3. Adds the included column for problem exclusion feature

-- Step 1: Create junction table for problem-topics relationship
CREATE TABLE IF NOT EXISTS problem_topics (
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
    topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (problem_id, topic_id)
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_problem_topics_problem_id ON problem_topics(problem_id);
CREATE INDEX IF NOT EXISTS idx_problem_topics_topic_id ON problem_topics(topic_id);

-- Step 2: Migrate existing topic_id data to junction table
-- Only do this if topic_id column still exists
DO $$
BEGIN
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
    END IF;
END $$;

-- Step 3: Convert math_approach to array if it's not already
DO $$
BEGIN
    -- Check if math_approach is not already an array
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'problems' 
        AND column_name = 'math_approach' 
        AND data_type = 'text'
    ) THEN
        ALTER TABLE problems 
        ALTER COLUMN math_approach TYPE TEXT[] 
        USING CASE 
            WHEN math_approach IS NULL THEN NULL 
            ELSE ARRAY[math_approach]::TEXT[] 
        END;
    END IF;
END $$;

-- Step 4: Convert reasoning_type to array if it's not already
DO $$
BEGIN
    -- Check if reasoning_type is not already an array
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'problems' 
        AND column_name = 'reasoning_type' 
        AND data_type = 'text'
    ) THEN
        ALTER TABLE problems 
        ALTER COLUMN reasoning_type TYPE TEXT[] 
        USING CASE 
            WHEN reasoning_type IS NULL THEN NULL 
            ELSE ARRAY[reasoning_type]::TEXT[] 
        END;
    END IF;
END $$;

-- Step 5: Add included column if it doesn't exist
ALTER TABLE problems 
ADD COLUMN IF NOT EXISTS included BOOLEAN DEFAULT true;

-- Step 6: Create or replace function to get problems with their topics
-- This function makes it easier to query problems with all their topics
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

-- Add comment to document the migration
COMMENT ON TABLE problem_topics IS 'Junction table for many-to-many relationship between problems and topics';
COMMENT ON COLUMN problems.math_approach IS 'Array of mathematical approaches used in the problem';
COMMENT ON COLUMN problems.reasoning_type IS 'Array of reasoning types used in the problem';
COMMENT ON COLUMN problems.included IS 'Whether the problem is included (true) or excluded (false) from the document';