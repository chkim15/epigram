-- Mathpix Database Schema v3
-- Schema with array support for approaches/reasoning and junction table for topics
-- Includes soft deletion via 'included' column

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (start fresh)
DROP TABLE IF EXISTS problem_topics CASCADE;
DROP TABLE IF EXISTS reasoning_types CASCADE;
DROP TABLE IF EXISTS approaches CASCADE; 
DROP TABLE IF EXISTS domains CASCADE;
DROP TABLE IF EXISTS problem_solutions CASCADE;
DROP TABLE IF EXISTS problem_hints CASCADE;
DROP TABLE IF EXISTS subproblems CASCADE;
DROP TABLE IF EXISTS problems CASCADE;
DROP TABLE IF EXISTS topics CASCADE;
DROP TABLE IF EXISTS documents CASCADE;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Documents table - unchanged
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id TEXT UNIQUE NOT NULL,
    school TEXT,
    course TEXT,
    problem_type TEXT,
    term TEXT,
    year INTEGER,
    total_problems INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Topics reference table - restructured for Calculus I/II organization
CREATE TABLE topics (
    id INTEGER PRIMARY KEY,
    subtopics TEXT UNIQUE NOT NULL,
    main_topics TEXT,
    course TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Problems table - with arrays for approaches/reasoning and included flag
CREATE TABLE problems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id TEXT UNIQUE NOT NULL,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    problem_text TEXT,
    correct_answer TEXT,
    hint TEXT,                    -- Single hint text (nullable)
    solution_text TEXT,           -- Single solution text (nullable)
    math_approach TEXT[],         -- Array of mathematical approaches
    reasoning_type TEXT[],        -- Array of reasoning types
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard', 'very_hard')),
    importance INTEGER CHECK (importance BETWEEN 1 AND 3),
    comment TEXT,
    version TEXT DEFAULT 'v1',
    included BOOLEAN DEFAULT true, -- Soft deletion flag
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Junction table for problem-topic many-to-many relationship
CREATE TABLE problem_topics (
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
    topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (problem_id, topic_id)
);

-- 5. Subproblems table - with single-value fields
CREATE TABLE subproblems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    problem_text TEXT,
    correct_answer TEXT,
    hint TEXT,                    -- Single hint text (nullable)
    solution_text TEXT,           -- Single solution text (nullable)
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(problem_id, key)
);

-- Create indexes for performance
CREATE INDEX idx_problems_document_id ON problems(document_id);
CREATE INDEX idx_subproblems_problem_id ON subproblems(problem_id);
CREATE INDEX idx_problem_topics_problem_id ON problem_topics(problem_id);
CREATE INDEX idx_problem_topics_topic_id ON problem_topics(topic_id);
CREATE INDEX idx_problems_difficulty ON problems(difficulty);
CREATE INDEX idx_problems_importance ON problems(importance);
CREATE INDEX idx_problems_included ON problems(included);

-- GIN indexes for array columns (for efficient array operations)
CREATE INDEX idx_problems_math_approach ON problems USING GIN(math_approach);
CREATE INDEX idx_problems_reasoning_type ON problems USING GIN(reasoning_type);

-- Create triggers for updated_at columns
CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_problems_updated_at 
    BEFORE UPDATE ON problems 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper function to get problems with their topics aggregated
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

-- Insert predefined topics with Calculus I/II organization
INSERT INTO topics (id, subtopics, main_topics, course) VALUES
-- CALCULUS I
-- Basics of Functions
(1, 'Variables, Functions and Graphs', 'Basics of Functions', 'Calculus I'),
-- Limits
(2, 'Limits of Functions', 'Limits', 'Calculus I'),
(3, 'Continuity and Intermediate Value Theorem', 'Limits', 'Calculus I'),
(4, 'Indeterminate Forms Limits via Algebraic Manipulation', 'Limits', 'Calculus I'),
(5, 'Limits at Infinity and Asymptotes', 'Limits', 'Calculus I'),
-- Derivatives
(6, 'Limiting Definition of Derivatives', 'Derivatives', 'Calculus I'),
(7, 'Chain, Product and Quotient Rules', 'Derivatives', 'Calculus I'),
(8, 'Implicit Differentiation and Inverse Derivatives', 'Derivatives', 'Calculus I'),
(9, 'Logarithmic Differentiation', 'Derivatives', 'Calculus I'),
-- Applications of Derivatives
(10, 'Inverse Trig and Hyperbolic Functions', 'Applications of Derivatives', 'Calculus I'),
(11, 'Indeterminate Forms Limits via L''Hospital Rule', 'Applications of Derivatives', 'Calculus I'),
(12, 'Extreme Values, Monotonicity and Concavity', 'Applications of Derivatives', 'Calculus I'),
(13, 'Applied Optimization', 'Applications of Derivatives', 'Calculus I'),
(14, 'Approximation via Differentiation', 'Applications of Derivatives', 'Calculus I'),
-- Integration (Basic)
(15, 'Antiderivatives', 'Integration', 'Calculus I'),
(16, 'Riemann Sum and Definite Integral', 'Integration', 'Calculus I'),
(17, 'Fundamental Theorem of Calculus', 'Integration', 'Calculus I'),
(18, 'Substitution Rules', 'Integration', 'Calculus I'),
(19, 'Area Between Curves', 'Integration', 'Calculus I'),
-- CALCULUS II
-- Advanced Integration
(20, 'Volume by Slicing', 'Advanced Integration', 'Calculus II'),
(21, 'Volume by Cylindrical Shells', 'Advanced Integration', 'Calculus II'),
(22, 'Integration by Parts', 'Advanced Integration', 'Calculus II'),
(23, 'Partial Fractions', 'Advanced Integration', 'Calculus II'),
(24, 'Improper Integrals', 'Advanced Integration', 'Calculus II'),
(25, 'Arc Length', 'Advanced Integration', 'Calculus II'),
(26, 'Surface Area', 'Advanced Integration', 'Calculus II'),
-- Sequences and Series
(27, 'Sequences', 'Sequences and Series', 'Calculus II'),
(28, 'Series', 'Sequences and Series', 'Calculus II'),
(29, 'Integral Tests', 'Sequences and Series', 'Calculus II'),
(30, 'Comparison Tests', 'Sequences and Series', 'Calculus II'),
(31, 'Alternating Series', 'Sequences and Series', 'Calculus II'),
(32, 'Absolute Convergence, Ratio and Root Test', 'Sequences and Series', 'Calculus II'),
(33, 'Power Series', 'Sequences and Series', 'Calculus II'),
(34, 'Taylor and MacLaurin Series', 'Sequences and Series', 'Calculus II'),
(35, 'Applications of Taylor Polynomials', 'Sequences and Series', 'Calculus II'),
-- Ordinary Differential Equations
(36, 'Separable and Homogeneous ODE', 'Ordinary Differential Equations', 'Calculus II'),
(37, 'First Order Linear ODE', 'Ordinary Differential Equations', 'Calculus II'),
(38, 'Second Order Linear ODE', 'Ordinary Differential Equations', 'Calculus II'),
(39, 'Nonhomogeneous Linear ODE', 'Ordinary Differential Equations', 'Calculus II'),
(40, 'Series Solutions of ODE', 'Ordinary Differential Equations', 'Calculus II');

-- Predefined values for array fields
-- Mathematical Approaches (can be multiple)
COMMENT ON COLUMN problems.math_approach IS 'Array of: Algebraic, Geometric, Combinatorial, Approximation, Intuitive, Algorithmic, Logical, Symmetric, Statistical, Nontraditional';

-- Reasoning Types (can be multiple)  
COMMENT ON COLUMN problems.reasoning_type IS 'Array of: Proof-based, Example Construction, Counterexample Construction, Computational, Conceptual, Application-based';

-- Enable Row Level Security (RLS) for production
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE subproblems ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_topics ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all tables
CREATE POLICY "Allow public read" ON documents FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON problems FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON subproblems FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON topics FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON problem_topics FOR SELECT USING (true);

-- Allow public write access (can be restricted later if needed)
CREATE POLICY "Allow public insert" ON documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON documents FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON documents FOR DELETE USING (true);

CREATE POLICY "Allow public insert" ON problems FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON problems FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON problems FOR DELETE USING (true);

CREATE POLICY "Allow public insert" ON subproblems FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON subproblems FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON subproblems FOR DELETE USING (true);

CREATE POLICY "Allow public insert" ON problem_topics FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON problem_topics FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON problem_topics FOR DELETE USING (true);

-- Add documentation comments
COMMENT ON TABLE problem_topics IS 'Junction table for many-to-many relationship between problems and topics';
COMMENT ON COLUMN problems.included IS 'Whether the problem is included (true) or excluded (false) from the document';
COMMENT ON FUNCTION get_problems_with_topics IS 'Returns problems with their associated topics aggregated as an array';