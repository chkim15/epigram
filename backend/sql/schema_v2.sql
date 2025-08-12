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

-- 2. Topics reference table - restructured for Calculus I/II organization
CREATE TABLE topics (
    id INTEGER PRIMARY KEY,
    subtopics TEXT UNIQUE NOT NULL,
    main_topics TEXT,
    course TEXT,
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