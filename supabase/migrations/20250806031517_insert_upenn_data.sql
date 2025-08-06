-- Insert UPenn Math 103 Final Fall 2021 data

-- Insert the document
INSERT INTO documents (
  id, school, course, problem_type, term, year, 
  total_problems, total_images, created_at, updated_at
) VALUES (
  'upenn_math103_final_fall_2021',
  'upenn',
  'math103',
  'final',
  'fall',
  '2021',
  8,
  4,
  '2025-08-04 16:15:13',
  NULL
) ON CONFLICT (id) DO UPDATE SET
  school = EXCLUDED.school,
  course = EXCLUDED.course,
  problem_type = EXCLUDED.problem_type,
  term = EXCLUDED.term,
  year = EXCLUDED.year,
  total_problems = EXCLUDED.total_problems,
  total_images = EXCLUDED.total_images,
  updated_at = EXCLUDED.updated_at;

-- Insert problem 1
INSERT INTO problems (
  id, doc_id, problem_text, correct_answer, solution, images, 
  difficulty, topics, manually_saved, created_at, updated_at
) VALUES (
  'upenn_math103_final_fall_2021_p1',
  'upenn_math103_final_fall_2021',
  'Use the limit definition of the derivative to calculate the derivative of \( f(x)=\frac{3}{4 x-3} \). Find the equation of the tangent line to \( f(x) \) at \( x=1 \).',
  NULL,
  NULL,
  '{}',
  NULL,
  '{}',
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  problem_text = EXCLUDED.problem_text,
  correct_answer = EXCLUDED.correct_answer,
  solution = EXCLUDED.solution,
  images = EXCLUDED.images,
  difficulty = EXCLUDED.difficulty,
  topics = EXCLUDED.topics,
  manually_saved = EXCLUDED.manually_saved,
  updated_at = EXCLUDED.updated_at;

-- Insert problem 2
INSERT INTO problems (
  id, doc_id, problem_text, correct_answer, solution, images, 
  difficulty, topics, manually_saved, created_at, updated_at
) VALUES (
  'upenn_math103_final_fall_2021_p2',
  'upenn_math103_final_fall_2021',
  'The graph of \( f^{\prime}(x) \) (the derivative of \( f(x) \) ) is given below. Answer the following questions about the function \( f(x) \). Include a brief explanation justifying your answer in each part.',
  NULL,
  NULL,
  '{p2_2.png,p2_3.png}',
  NULL,
  '{}',
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  problem_text = EXCLUDED.problem_text,
  correct_answer = EXCLUDED.correct_answer,
  solution = EXCLUDED.solution,
  images = EXCLUDED.images,
  difficulty = EXCLUDED.difficulty,
  topics = EXCLUDED.topics,
  manually_saved = EXCLUDED.manually_saved,
  updated_at = EXCLUDED.updated_at;

-- Insert problem 3
INSERT INTO problems (
  id, doc_id, problem_text, correct_answer, solution, images, 
  difficulty, topics, manually_saved, created_at, updated_at
) VALUES (
  'upenn_math103_final_fall_2021_p3',
  'upenn_math103_final_fall_2021',
  'Let \( f(x)=\sqrt{1+4 \sqrt{x}} \).',
  NULL,
  NULL,
  '{}',
  NULL,
  '{}',
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  problem_text = EXCLUDED.problem_text,
  correct_answer = EXCLUDED.correct_answer,
  solution = EXCLUDED.solution,
  images = EXCLUDED.images,
  difficulty = EXCLUDED.difficulty,
  topics = EXCLUDED.topics,
  manually_saved = EXCLUDED.manually_saved,
  updated_at = EXCLUDED.updated_at;

-- Insert subproblems for problem 3
INSERT INTO subproblems (
  problem_id, subproblem_key, problem_text, correct_answer, solution, images,
  created_at, updated_at
) VALUES 
(
  'upenn_math103_final_fall_2021_p3',
  'a',
  'Find \( f(36) \)',
  NULL,
  NULL,
  '{}',
  NOW(),
  NOW()
),
(
  'upenn_math103_final_fall_2021_p3',
  'b',
  'Find \( f^{-1}(7) \)',
  NULL,
  NULL,
  '{}',
  NOW(),
  NOW()
),
(
  'upenn_math103_final_fall_2021_p3',
  'c',
  'Find \( f^{\prime}(4) \)',
  NULL,
  NULL,
  '{}',
  NOW(),
  NOW()
) ON CONFLICT (problem_id, subproblem_key) DO UPDATE SET
  problem_text = EXCLUDED.problem_text,
  correct_answer = EXCLUDED.correct_answer,
  solution = EXCLUDED.solution,
  images = EXCLUDED.images,
  updated_at = EXCLUDED.updated_at;

-- Insert problem 4
INSERT INTO problems (
  id, doc_id, problem_text, correct_answer, solution, images, 
  difficulty, topics, manually_saved, created_at, updated_at
) VALUES (
  'upenn_math103_final_fall_2021_p4',
  'upenn_math103_final_fall_2021',
  'Evaluate the following limits.',
  NULL,
  NULL,
  '{}',
  NULL,
  '{}',
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  problem_text = EXCLUDED.problem_text,
  correct_answer = EXCLUDED.correct_answer,
  solution = EXCLUDED.solution,
  images = EXCLUDED.images,
  difficulty = EXCLUDED.difficulty,
  topics = EXCLUDED.topics,
  manually_saved = EXCLUDED.manually_saved,
  updated_at = EXCLUDED.updated_at;

-- Insert subproblems for problem 4
INSERT INTO subproblems (
  problem_id, subproblem_key, problem_text, correct_answer, solution, images,
  created_at, updated_at
) VALUES 
(
  'upenn_math103_final_fall_2021_p4',
  'a',
  '\( \lim _{x \rightarrow 0} \frac{x^{2}-x-6}{\sqrt[3]{x+27}} \)',
  NULL,
  NULL,
  '{}',
  NOW(),
  NOW()
),
(
  'upenn_math103_final_fall_2021_p4',
  'b',
  '\( \lim _{x \rightarrow \infty} \frac{6 x+2}{\sqrt{4 x^{2}-x-3}} \)',
  NULL,
  NULL,
  '{}',
  NOW(),
  NOW()
),
(
  'upenn_math103_final_fall_2021_p4',
  'c',
  '\( \lim _{x \rightarrow 1} \frac{\ln (5-4 x)+e^{2 x-2}-1}{\frac{4}{\pi} \arctan (3 x-2)-x} \)',
  NULL,
  NULL,
  '{}',
  NOW(),
  NOW()
) ON CONFLICT (problem_id, subproblem_key) DO UPDATE SET
  problem_text = EXCLUDED.problem_text,
  correct_answer = EXCLUDED.correct_answer,
  solution = EXCLUDED.solution,
  images = EXCLUDED.images,
  updated_at = EXCLUDED.updated_at;

-- Insert problem 5
INSERT INTO problems (
  id, doc_id, problem_text, correct_answer, solution, images, 
  difficulty, topics, manually_saved, created_at, updated_at
) VALUES (
  'upenn_math103_final_fall_2021_p5',
  'upenn_math103_final_fall_2021',
  'A farmer wants to fence in a rectangular grazing area next to a river. The grazing area must be 180,000 square meters. What dimensions would require the least amount of fencing if no fencing were required along the river?',
  NULL,
  NULL,
  '{p5_1.png}',
  NULL,
  '{}',
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  problem_text = EXCLUDED.problem_text,
  correct_answer = EXCLUDED.correct_answer,
  solution = EXCLUDED.solution,
  images = EXCLUDED.images,
  difficulty = EXCLUDED.difficulty,
  topics = EXCLUDED.topics,
  manually_saved = EXCLUDED.manually_saved,
  updated_at = EXCLUDED.updated_at;

-- Insert problem 6 (empty problem_text at parent level)
INSERT INTO problems (
  id, doc_id, problem_text, correct_answer, solution, images, 
  difficulty, topics, manually_saved, created_at, updated_at
) VALUES (
  'upenn_math103_final_fall_2021_p6',
  'upenn_math103_final_fall_2021',
  '',
  NULL,
  NULL,
  '{}',
  NULL,
  '{}',
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  problem_text = EXCLUDED.problem_text,
  correct_answer = EXCLUDED.correct_answer,
  solution = EXCLUDED.solution,
  images = EXCLUDED.images,
  difficulty = EXCLUDED.difficulty,
  topics = EXCLUDED.topics,
  manually_saved = EXCLUDED.manually_saved,
  updated_at = EXCLUDED.updated_at;

-- Insert subproblems for problem 6
INSERT INTO subproblems (
  problem_id, subproblem_key, problem_text, correct_answer, solution, images,
  created_at, updated_at
) VALUES 
(
  'upenn_math103_final_fall_2021_p6',
  'a',
  'Evaluate the integral below \[ \int \frac{\ln \left(x^{2}+1\right)}{x^{2}} d x \]',
  NULL,
  NULL,
  '{}',
  NOW(),
  NOW()
),
(
  'upenn_math103_final_fall_2021_p6',
  'b',
  'Find the area of the shaded region below',
  NULL,
  NULL,
  '{p6_1.png}',
  NOW(),
  NOW()
) ON CONFLICT (problem_id, subproblem_key) DO UPDATE SET
  problem_text = EXCLUDED.problem_text,
  correct_answer = EXCLUDED.correct_answer,
  solution = EXCLUDED.solution,
  images = EXCLUDED.images,
  updated_at = EXCLUDED.updated_at;

-- Insert problem 7
INSERT INTO problems (
  id, doc_id, problem_text, correct_answer, solution, images, 
  difficulty, topics, manually_saved, created_at, updated_at
) VALUES (
  'upenn_math103_final_fall_2021_p7',
  'upenn_math103_final_fall_2021',
  'A continuous random variable \( X \) has the following probability density function \[ f(x)=\left\{\begin{array}{cc} \cos x & \text { if } 0 \leq x \leq \frac{\pi}{2} \\ 0 & \text { otherwise } \end{array}\right. \] Find the median.',
  NULL,
  NULL,
  '{}',
  NULL,
  '{}',
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  problem_text = EXCLUDED.problem_text,
  correct_answer = EXCLUDED.correct_answer,
  solution = EXCLUDED.solution,
  images = EXCLUDED.images,
  difficulty = EXCLUDED.difficulty,
  topics = EXCLUDED.topics,
  manually_saved = EXCLUDED.manually_saved,
  updated_at = EXCLUDED.updated_at;

-- Insert problem 8 (empty problem_text at parent level)
INSERT INTO problems (
  id, doc_id, problem_text, correct_answer, solution, images, 
  difficulty, topics, manually_saved, created_at, updated_at
) VALUES (
  'upenn_math103_final_fall_2021_p8',
  'upenn_math103_final_fall_2021',
  '',
  NULL,
  NULL,
  '{}',
  NULL,
  '{}',
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  problem_text = EXCLUDED.problem_text,
  correct_answer = EXCLUDED.correct_answer,
  solution = EXCLUDED.solution,
  images = EXCLUDED.images,
  difficulty = EXCLUDED.difficulty,
  topics = EXCLUDED.topics,
  manually_saved = EXCLUDED.manually_saved,
  updated_at = EXCLUDED.updated_at;

-- Insert subproblems for problem 8
INSERT INTO subproblems (
  problem_id, subproblem_key, problem_text, correct_answer, solution, images,
  created_at, updated_at
) VALUES 
(
  'upenn_math103_final_fall_2021_p8',
  'a',
  'Use the Taylor series centered at 0 (Maclaurin series) for \( \cos x \) to approximate \( 32 x \cos \sqrt{x} \) with a cubic polynomial.',
  NULL,
  NULL,
  '{}',
  NOW(),
  NOW()
),
(
  'upenn_math103_final_fall_2021_p8',
  'b',
  'Use the cubic polynomial found in part a to approximate \( \int_{0}^{1} 32 x \cos \sqrt{x} d x \)',
  NULL,
  NULL,
  '{}',
  NOW(),
  NOW()
) ON CONFLICT (problem_id, subproblem_key) DO UPDATE SET
  problem_text = EXCLUDED.problem_text,
  correct_answer = EXCLUDED.correct_answer,
  solution = EXCLUDED.solution,
  images = EXCLUDED.images,
  updated_at = EXCLUDED.updated_at;

-- Verify the insertion
SELECT COUNT(*) as problems_count FROM problems WHERE doc_id = 'upenn_math103_final_fall_2021';
SELECT COUNT(*) as subproblems_count FROM subproblems WHERE problem_id LIKE 'upenn_math103_final_fall_2021%';
SELECT COUNT(*) as documents_count FROM documents WHERE id = 'upenn_math103_final_fall_2021';