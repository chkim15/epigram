-- Mathpix Database Schema v2
-- Simplified schema aligned with single-value JSON structure
-- Removes separate tables for hints, solutions, approaches, reasoning types, and domains
-- Adds these as direct fields in problems and subproblems tables
-- Uses direct foreign key for topics (many-to-one relationship)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (start fresh)
DROP TABLE IF EXISTS reasoning_types CASCADE;
DROP TABLE IF EXISTS approaches CASCADE; 
DROP TABLE IF EXISTS domains CASCADE;
DROP TABLE IF EXISTS problem_solutions CASCADE;
DROP TABLE IF EXISTS problem_hints CASCADE;
DROP TABLE IF EXISTS problem_topics CASCADE;
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

-- 2. Topics reference table - unchanged
CREATE TABLE topics (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Problems table - with new single-value fields and direct topic reference
CREATE TABLE problems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id TEXT UNIQUE NOT NULL,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    problem_text TEXT,
    correct_answer TEXT,
    hint TEXT,                    -- NEW: single hint text (nullable)
    solution_text TEXT,           -- NEW: single solution text (nullable)
    math_approach TEXT,           -- NEW: single approach (nullable)
    reasoning_type TEXT,          -- NEW: single reasoning type (nullable)
    topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL,  -- NEW: direct topic reference
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard', 'very_hard')),
    importance INTEGER CHECK (importance BETWEEN 1 AND 3),
    comment TEXT,
    version TEXT DEFAULT 'v1',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Subproblems table - with new single-value fields
CREATE TABLE subproblems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    problem_text TEXT,
    correct_answer TEXT,
    hint TEXT,                    -- NEW: single hint text (nullable)
    solution_text TEXT,           -- NEW: single solution text (nullable)
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(problem_id, key)
);

-- Create indexes for performance
CREATE INDEX idx_problems_document_id ON problems(document_id);
CREATE INDEX idx_problems_topic_id ON problems(topic_id);
CREATE INDEX idx_subproblems_problem_id ON subproblems(problem_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_problems_updated_at 
    BEFORE UPDATE ON problems 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert predefined topics
INSERT INTO topics (id, name, category) VALUES
-- Limits and Continuity
(1, 'Variables, Functions and Graphs', 'Foundations'),
(2, 'Limits of Functions', 'Limits'),
(3, 'Continuity and IVT', 'Limits'),
(4, 'Indeterminate Forms Limits via Algebraic Manipulation', 'Limits'),
(5, 'Limits at Infinity and Asymptotes', 'Limits'),
-- Derivatives
(6, 'Limiting Definition of Derivatives', 'Derivatives'),
(7, 'Chain, Product and Quotient Rules', 'Derivatives'),
(8, 'Implicit Differentiation and Inverse Derivatives', 'Derivatives'),
(9, 'Logarithmic Differentiation', 'Derivatives'),
(10, 'Inverse Trig and Hyperbolic Functions', 'Derivatives'),
(11, 'Indeterminate Forms Limits via L''Hospital Rule', 'Derivatives'),
-- Applications of Derivatives
(12, 'Extreme Values, Monotonicity and Concavity', 'Applications'),
(13, 'Applied Optimization', 'Applications'),
(14, 'Approximation via Differentiation', 'Applications'),
-- Integration
(15, 'Antiderivatives', 'Integration'),
(16, 'Riemann Sum and Definite Integral', 'Integration'),
(17, 'Fundamental Theorem of Calculus', 'Integration'),
(18, 'Substitution Rules', 'Integration'),
(19, 'Area Between Curves', 'Integration'),
(20, 'Volume by Slicing', 'Integration'),
(21, 'Volume by Cylindrical Shells', 'Integration'),
(22, 'Integration by Parts', 'Integration'),
(23, 'Partial Fractions', 'Integration'),
(24, 'Improper Integrals', 'Integration'),
(25, 'Arc Length', 'Integration'),
(26, 'Surface Area', 'Integration'),
-- Series
(27, 'Sequences', 'Series'),
(28, 'Series', 'Series'),
(29, 'Integral Tests', 'Series'),
(30, 'Comparison Tests', 'Series'),
(31, 'Alternating Series', 'Series'),
(32, 'Absolute Convergence, Ratio and Root Test', 'Series'),
(33, 'Power Series', 'Series'),
(34, 'Taylor and MacLaurin Series', 'Series'),
(35, 'Applications of Taylor Polynomials', 'Series'),
-- Differential Equations
(36, 'Separable and Homogeneous ODE', 'Differential Equations'),
(37, 'First Order Linear ODE', 'Differential Equations'),
(38, 'Second Order Linear ODE', 'Differential Equations'),
(39, 'Nonhomogeneous Linear ODE', 'Differential Equations'),
(40, 'Series Solutions of ODE', 'Differential Equations');

-- Indexes for common queries
CREATE INDEX idx_problems_difficulty ON problems(difficulty);
CREATE INDEX idx_problems_math_approach ON problems(math_approach);
CREATE INDEX idx_problems_reasoning_type ON problems(reasoning_type);
CREATE INDEX idx_problems_importance ON problems(importance);

-- Enable Row Level Security (RLS) for production
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE subproblems ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all tables
CREATE POLICY "Allow public read" ON documents FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON problems FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON subproblems FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON topics FOR SELECT USING (true);

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