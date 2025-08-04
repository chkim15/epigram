-- Supabase Schema for Math Problems Database
-- Run this in your Supabase SQL Editor

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    school TEXT,
    course TEXT,
    problem_type TEXT,
    term TEXT,
    year TEXT,
    total_problems INTEGER,
    total_images INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    version TEXT
);

-- Create problems table
CREATE TABLE IF NOT EXISTS problems (
    id TEXT PRIMARY KEY,
    doc_id TEXT REFERENCES documents(id) ON DELETE CASCADE,
    problem_text TEXT,
    subproblems JSONB DEFAULT '{}',
    correct_answer TEXT,
    solution JSONB DEFAULT '{}',
    images TEXT[] DEFAULT '{}',
    difficulty TEXT,
    domain TEXT[] DEFAULT '{}',
    topics TEXT[] DEFAULT '{}',
    math_approach TEXT[] DEFAULT '{}',
    reasoning_type TEXT[] DEFAULT '{}'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_problems_doc_id ON problems(doc_id);
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_problems_topics ON problems USING GIN(topics);
CREATE INDEX IF NOT EXISTS idx_problems_domain ON problems USING GIN(domain);

-- Enable Row Level Security (RLS) - optional
-- ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE problems ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (optional)
-- CREATE POLICY "Allow public read access" ON documents FOR SELECT USING (true);
-- CREATE POLICY "Allow public read access" ON problems FOR SELECT USING (true);

-- Insert some sample data for testing (optional)
-- INSERT INTO documents (id, school, course, problem_type, term, year, total_problems, total_images, created_at, version)
-- VALUES ('test_doc', 'Stanford', 'Mathematics', 'exam', 'Spring', '2024', 0, 0, NOW(), 'raw');

-- INSERT INTO problems (id, doc_id, problem_text, difficulty)
-- VALUES ('test_problem', 'test_doc', 'Sample problem text', 'medium'); 