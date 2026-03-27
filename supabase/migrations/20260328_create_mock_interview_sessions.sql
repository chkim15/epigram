-- Mock Interview Sessions table
CREATE TABLE mock_interview_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  problem_ids TEXT[] NOT NULL,
  user_answers TEXT[],
  self_assessed_correct BOOLEAN[],
  score INTEGER,
  time_limit_seconds INTEGER NOT NULL DEFAULT 1800,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  overtime_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_mock_interview_sessions_user_id ON mock_interview_sessions(user_id);
CREATE INDEX idx_mock_interview_sessions_status ON mock_interview_sessions(status);

-- Row Level Security
ALTER TABLE mock_interview_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mock interview sessions"
  ON mock_interview_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mock interview sessions"
  ON mock_interview_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mock interview sessions"
  ON mock_interview_sessions FOR UPDATE
  USING (auth.uid() = user_id);
