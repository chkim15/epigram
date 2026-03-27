-- Reference table for 4-Week Intensive Quant Interview Prep topics
CREATE TABLE IF NOT EXISTS four_week_topics (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Junction table
CREATE TABLE IF NOT EXISTS problem_four_week_topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  four_week_topic_id INTEGER NOT NULL REFERENCES four_week_topics(id) ON DELETE CASCADE,
  UNIQUE(problem_id, four_week_topic_id)
);

-- Insert 29 topics
INSERT INTO four_week_topics (name) VALUES
  ('Foundations of Probability Modeling'),
  ('Conditional Probability'),
  ('Distributions'),
  ('Gaussian Distribution'),
  ('Expectation & Variance'),
  ('Covariance & Correlation'),
  ('Miscellaneous Topics'),
  ('Markov Chains'),
  ('Martingales & Random Walks'),
  ('Dynamic Programming'),
  ('Coding: Dynamic Programming I'),
  ('Coding: Dynamic Programming II'),
  ('Coding: Backtracking'),
  ('Coding: Data Structures'),
  ('CLT & Law of Large Numbers'),
  ('Hypothesis Testing'),
  ('Linear Regression I'),
  ('Linear Regression II'),
  ('Time Series Basics'),
  ('Monte Carlo Methods'),
  ('Coding: Stack and Queue'),
  ('Coding: BFS and DFS'),
  ('Nash Equilibrium'),
  ('Bayesian Games'),
  ('Number Theory and Mental Math'),
  ('Brain Teasers'),
  ('Options Pricing and Black-Scholes'),
  ('Coding: Sorting Algorithms'),
  ('Coding: Searching Algorithms')
ON CONFLICT (name) DO NOTHING;

-- RLS policies
ALTER TABLE four_week_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_four_week_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON four_week_topics FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON problem_four_week_topics FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON problem_four_week_topics FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON problem_four_week_topics FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON problem_four_week_topics FOR DELETE USING (true);
