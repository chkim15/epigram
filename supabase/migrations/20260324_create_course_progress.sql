-- Course progress tracking tables

CREATE TABLE course_topic_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_num INTEGER NOT NULL,
  topic_num INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'completed')),
  problems_solved INTEGER NOT NULL DEFAULT 0,
  problems_total INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, week_num, topic_num)
);

CREATE TABLE course_problem_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_num INTEGER NOT NULL,
  topic_num INTEGER NOT NULL,
  problem_id TEXT NOT NULL,
  solved BOOLEAN NOT NULL DEFAULT false,
  solved_at TIMESTAMPTZ,
  UNIQUE(user_id, week_num, topic_num, problem_id)
);

-- RLS policies: users can only access their own progress

ALTER TABLE course_topic_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_problem_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own topic progress"
  ON course_topic_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own topic progress"
  ON course_topic_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own topic progress"
  ON course_topic_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own problem progress"
  ON course_problem_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own problem progress"
  ON course_problem_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own problem progress"
  ON course_problem_progress FOR UPDATE
  USING (auth.uid() = user_id);
