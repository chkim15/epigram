-- Add problem_name and problem_labels to problems table
ALTER TABLE problems ADD COLUMN IF NOT EXISTS problem_name TEXT;
ALTER TABLE problems ADD COLUMN IF NOT EXISTS problem_labels TEXT[];

-- Quant topics reference table
CREATE TABLE IF NOT EXISTS quant_topics (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Junction table for problem <-> quant_topic
CREATE TABLE IF NOT EXISTS problem_quant_topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  quant_topic_id INTEGER NOT NULL REFERENCES quant_topics(id) ON DELETE CASCADE,
  UNIQUE(problem_id, quant_topic_id)
);

-- Company labels stored directly on problems as TEXT[] array
ALTER TABLE problems ADD COLUMN IF NOT EXISTS company_labels TEXT[];

-- Insert quant topics
INSERT INTO quant_topics (name) VALUES
('Induction'),
('Logical Reasoning'),
('Symmetry'),
('Series'),
('Sequences'),
('Combinatorics'),
('Probability'),
('Expected Value'),
('Conditional Probability'),
('Bayes Theorem'),
('Markov Chains'),
('Random Walk'),
('Martingales'),
('Stochastic Processes'),
('Generating Functions'),
('Recurrence Relations'),
('Linear Algebra'),
('Eigenvalues & Eigenvectors'),
('Matrix Operations'),
('Calculus'),
('Optimization'),
('Integration'),
('Differential Equations'),
('Game Theory'),
('Strategy & Equilibrium'),
('Auction Theory'),
('Number Theory'),
('Modular Arithmetic'),
('Prime Numbers'),
('Divisibility'),
('Geometry'),
('Trigonometry'),
('Coordinate Geometry'),
('Graph Theory'),
('Trees & Networks'),
('Algorithms'),
('Dynamic Programming'),
('Greedy Algorithms'),
('Sorting & Searching'),
('Data Structures'),
('Bit Manipulation'),
('Statistics'),
('Distributions'),
('Hypothesis Testing'),
('Regression'),
('Estimation'),
('Variance & Covariance'),
('Central Limit Theorem'),
('Law of Large Numbers'),
('Monte Carlo Methods'),
('Puzzles & Brain Teasers'),
('Fermi Estimation'),
('Mental Math'),
('Clock & Calendar'),
('Coin & Dice'),
('Card Problems'),
('Urn Problems'),
('Coding & Implementation')
ON CONFLICT (name) DO NOTHING;

