-- Supabase Schema for Math Problems Database
-- Simple schema for initial testing

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Documents table (exam/problem set metadata)
CREATE TABLE documents (
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

-- Topics reference table
CREATE TABLE topics (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Problems table (main problems)
CREATE TABLE problems (
  id TEXT PRIMARY KEY,
  doc_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  problem_text TEXT,
  correct_answer TEXT,
  solution TEXT, -- Simple text for now, can be upgraded to JSONB later
  images TEXT[], -- Array of image filenames
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard', 'very_hard')),
  topics INTEGER[], -- Array of topic IDs
  manually_saved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subproblems table (normalized for clean structure)
CREATE TABLE subproblems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id TEXT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  subproblem_key TEXT NOT NULL, -- 'a', 'b', 'c', etc.
  problem_text TEXT,
  correct_answer TEXT,
  solution TEXT,
  images TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique subproblem keys per problem
  UNIQUE(problem_id, subproblem_key)
);

-- Basic indexes for performance
CREATE INDEX idx_problems_doc_id ON problems(doc_id);
CREATE INDEX idx_problems_difficulty ON problems(difficulty);
CREATE INDEX idx_subproblems_problem_id ON subproblems(problem_id);

-- GIN index for array operations on topics
CREATE INDEX idx_problems_topics ON problems USING GIN (topics);

-- Text search indexes (optional, for future use)
CREATE INDEX idx_problems_text_search ON problems USING GIN (to_tsvector('english', problem_text));

-- Comments for documentation
COMMENT ON TABLE documents IS 'Metadata for exam documents and problem sets';
COMMENT ON TABLE topics IS 'Reference table for math topics';
COMMENT ON TABLE problems IS 'Main problems table';
COMMENT ON TABLE subproblems IS 'Normalized subproblems for each main problem';

COMMENT ON COLUMN problems.topics IS 'Array of topic IDs referencing topics table';
COMMENT ON COLUMN problems.images IS 'Array of image filenames';
COMMENT ON COLUMN subproblems.subproblem_key IS 'Letter identifier (a, b, c) for subproblem within parent problem';
