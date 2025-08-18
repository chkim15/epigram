-- Consolidated migration for current schema state
-- This migration creates the complete schema from scratch
-- Use this for new installations or complete rebuilds

-- Note: If you have existing data, use the incremental migrations instead:
-- 1. 20250806024840_create_schema.sql (initial schema)
-- 2. 20250806024914_insert_topics.sql (topics data)
-- 3. 20250118_add_problem_topics_junction.sql (junction table and arrays)

-- This consolidated migration includes:
-- - Arrays for math_approach and reasoning_type
-- - Junction table for problem-topics (many-to-many)
-- - Soft deletion via included column
-- - Helper functions for easier querying

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Documents table
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    school TEXT NOT NULL,
    course TEXT NOT NULL,
    problem_type TEXT NOT NULL,
    term TEXT NOT NULL,
    year TEXT NOT NULL,
    total_problems INTEGER DEFAULT 0,
    total_images INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Topics reference table
CREATE TABLE IF NOT EXISTS topics (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Problems table with arrays and soft deletion
CREATE TABLE IF NOT EXISTS problems (
    id TEXT PRIMARY KEY,
    doc_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    problem_text TEXT,
    correct_answer TEXT,
    solution TEXT,
    images TEXT[],
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard', 'very_hard')),
    math_approach TEXT[],          -- Array for multiple approaches
    reasoning_type TEXT[],         -- Array for multiple reasoning types
    included BOOLEAN DEFAULT true, -- Soft deletion flag
    manually_saved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Junction table for problem-topics (many-to-many)
CREATE TABLE IF NOT EXISTS problem_topics (
    problem_id TEXT REFERENCES problems(id) ON DELETE CASCADE,
    topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (problem_id, topic_id)
);

-- 5. Subproblems table
CREATE TABLE IF NOT EXISTS subproblems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id TEXT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    subproblem_key TEXT NOT NULL,
    problem_text TEXT,
    correct_answer TEXT,
    solution TEXT,
    images TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(problem_id, subproblem_key)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_problems_doc_id ON problems(doc_id);
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_problems_included ON problems(included);
CREATE INDEX IF NOT EXISTS idx_subproblems_problem_id ON subproblems(problem_id);
CREATE INDEX IF NOT EXISTS idx_problem_topics_problem_id ON problem_topics(problem_id);
CREATE INDEX IF NOT EXISTS idx_problem_topics_topic_id ON problem_topics(topic_id);

-- GIN indexes for array operations
CREATE INDEX IF NOT EXISTS idx_problems_math_approach ON problems USING GIN (math_approach);
CREATE INDEX IF NOT EXISTS idx_problems_reasoning_type ON problems USING GIN (reasoning_type);
CREATE INDEX IF NOT EXISTS idx_problems_images ON problems USING GIN (images);

-- Text search index (optional, for future use)
CREATE INDEX IF NOT EXISTS idx_problems_text_search ON problems USING GIN (to_tsvector('english', problem_text));

-- Helper function to get problems with their topics
CREATE OR REPLACE FUNCTION get_problems_with_topics(doc_id_param TEXT DEFAULT NULL)
RETURNS TABLE (
    problem_id TEXT,
    doc_id TEXT,
    problem_text TEXT,
    correct_answer TEXT,
    solution TEXT,
    images TEXT[],
    difficulty TEXT,
    math_approach TEXT[],
    reasoning_type TEXT[],
    topic_ids INTEGER[],
    included BOOLEAN,
    manually_saved BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.doc_id,
        p.problem_text,
        p.correct_answer,
        p.solution,
        p.images,
        p.difficulty,
        p.math_approach,
        p.reasoning_type,
        ARRAY_AGG(pt.topic_id ORDER BY pt.topic_id) FILTER (WHERE pt.topic_id IS NOT NULL) as topic_ids,
        p.included,
        p.manually_saved,
        p.created_at,
        p.updated_at
    FROM problems p
    LEFT JOIN problem_topics pt ON p.id = pt.problem_id
    WHERE (doc_id_param IS NULL OR p.doc_id = doc_id_param)
    GROUP BY p.id;
END;
$$ LANGUAGE plpgsql;

-- Insert predefined topics (40 calculus topics)
INSERT INTO topics (id, name) VALUES
(1, 'Variables, Functions and Graphs'),
(2, 'Limits of Functions'),
(3, 'Continuity and IVT'),
(4, 'Indeterminate Forms Limits via Algebraic Manipulation'),
(5, 'Limits at Infinity and Asymptotes'),
(6, 'Limiting Definition of Derivatives'),
(7, 'Chain, Product and Quotient Rules'),
(8, 'Implicit Differentiation and Inverse Derivatives'),
(9, 'Logarithmic Differentiation'),
(10, 'Inverse Trig and Hyperbolic Functions'),
(11, 'Indeterminate Forms Limits via L''Hospital Rule'),
(12, 'Extreme Values, Monotonicity and Concavity'),
(13, 'Applied Optimization'),
(14, 'Approximation via Differentiation'),
(15, 'Antiderivatives'),
(16, 'Riemann Sum and Definite Integral'),
(17, 'Fundamental Theorem of Calculus'),
(18, 'Substitution Rules'),
(19, 'Area Between Curves'),
(20, 'Volume by Slicing'),
(21, 'Volume by Cylindrical Shells'),
(22, 'Integration by Parts'),
(23, 'Partial Fractions'),
(24, 'Improper Integrals'),
(25, 'Arc Length'),
(26, 'Surface Area'),
(27, 'Sequences'),
(28, 'Series'),
(29, 'Integral Tests'),
(30, 'Comparison Tests'),
(31, 'Alternating Series'),
(32, 'Absolute Convergence, Ratio and Root Test'),
(33, 'Power Series'),
(34, 'Taylor and MacLaurin Series'),
(35, 'Applications of Taylor Polynomials'),
(36, 'Separable and Homogeneous ODE'),
(37, 'First Order Linear ODE'),
(38, 'Second Order Linear ODE'),
(39, 'Nonhomogeneous Linear ODE'),
(40, 'Series Solutions of ODE')
ON CONFLICT (id) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE documents IS 'Metadata for exam documents and problem sets';
COMMENT ON TABLE topics IS 'Reference table for math topics';
COMMENT ON TABLE problems IS 'Main problems table with array support for approaches and reasoning';
COMMENT ON TABLE problem_topics IS 'Junction table for many-to-many relationship between problems and topics';
COMMENT ON TABLE subproblems IS 'Normalized subproblems for each main problem';

COMMENT ON COLUMN problems.math_approach IS 'Array of: Algebraic, Geometric, Combinatorial, Approximation, Intuitive, Algorithmic, Logical, Symmetric, Statistical, Nontraditional';
COMMENT ON COLUMN problems.reasoning_type IS 'Array of: Proof-based, Example Construction, Counterexample Construction, Computational, Conceptual, Application-based';
COMMENT ON COLUMN problems.included IS 'Whether problem is included (true) or excluded (false) - soft deletion';
COMMENT ON COLUMN problems.images IS 'Array of image filenames';
COMMENT ON COLUMN subproblems.subproblem_key IS 'Letter identifier (a, b, c) for subproblem within parent problem';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_problems_updated_at 
    BEFORE UPDATE ON problems 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subproblems_updated_at 
    BEFORE UPDATE ON subproblems 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();