-- Test queries for Supabase math problems database
-- Run these after setting up schema and inserting data

-- 1. Basic data verification
SELECT 'Data Verification' as test_category;

-- Count records in each table
SELECT 'Topics' as table_name, COUNT(*) as count FROM topics
UNION ALL
SELECT 'Documents' as table_name, COUNT(*) as count FROM documents  
UNION ALL
SELECT 'Problems' as table_name, COUNT(*) as count FROM problems
UNION ALL
SELECT 'Subproblems' as table_name, COUNT(*) as count FROM subproblems;

-- 2. Document and problem relationship
SELECT 'Document-Problem Relationship' as test_category;

SELECT 
  d.id as doc_id,
  d.school,
  d.course,
  d.total_problems as declared_total,
  COUNT(p.id) as actual_problems
FROM documents d
LEFT JOIN problems p ON d.id = p.doc_id
GROUP BY d.id, d.school, d.course, d.total_problems;

-- 3. Problems by difficulty
SELECT 'Problems by Difficulty' as test_category;

SELECT difficulty, COUNT(*) as count
FROM problems 
GROUP BY difficulty
ORDER BY 
  CASE difficulty 
    WHEN 'easy' THEN 1
    WHEN 'medium' THEN 2  
    WHEN 'hard' THEN 3
    WHEN 'very_hard' THEN 4
  END;

-- 4. Topic usage analysis
SELECT 'Topic Usage' as test_category;

SELECT 
  t.id,
  t.name,
  COUNT(p.id) as problem_count
FROM topics t
LEFT JOIN problems p ON t.id = ANY(p.topics)
GROUP BY t.id, t.name
HAVING COUNT(p.id) > 0
ORDER BY COUNT(p.id) DESC, t.id;

-- 5. Problems with specific topics (testing array queries)
SELECT 'Problems with Riemann Sum/Definite Integral (topic 16)' as test_category;

SELECT id, problem_text, difficulty, topics
FROM problems 
WHERE topics @> ARRAY[16];

-- 6. Complex topic filtering (multiple topics)
SELECT 'Problems with Multiple Specific Topics' as test_category;

SELECT id, difficulty, topics
FROM problems
WHERE topics @> ARRAY[1] OR topics @> ARRAY[39] -- Variables/Functions OR Nonhomogeneous ODE
ORDER BY difficulty;

-- 7. Text search testing (if using text search indexes)
SELECT 'Text Search Test' as test_category;

SELECT id, difficulty, LEFT(problem_text, 100) as problem_preview
FROM problems
WHERE problem_text ILIKE '%limit%' OR problem_text ILIKE '%integral%'
ORDER BY difficulty, id;

-- 8. Problems with images
SELECT 'Problems with Images' as test_category;

SELECT 
  id, 
  difficulty,
  array_length(images, 1) as image_count,
  images
FROM problems
WHERE array_length(images, 1) > 0;

-- 9. Full problem details for testing
SELECT 'Sample Problem Details' as test_category;

SELECT 
  p.id,
  p.problem_text,
  p.correct_answer,
  p.difficulty,
  array_to_string(
    ARRAY(
      SELECT t.name 
      FROM topics t 
      WHERE t.id = ANY(p.topics)
    ), 
    ', '
  ) as topic_names,
  p.manually_saved
FROM problems p
WHERE p.id = 'stanford_tournament_competition_april_2024_p1';

-- 10. Problems with subproblems (should be empty for this dataset)
SELECT 'Problems with Subproblems' as test_category;

SELECT 
  p.id as problem_id,
  COUNT(sp.id) as subproblem_count
FROM problems p
LEFT JOIN subproblems sp ON p.id = sp.problem_id
GROUP BY p.id
HAVING COUNT(sp.id) > 0;

-- 11. Database health check
SELECT 'Database Health Check' as test_category;

-- Check for orphaned records
SELECT 'Orphaned Problems (no document)' as check_type, COUNT(*) as count
FROM problems p
LEFT JOIN documents d ON p.doc_id = d.id
WHERE d.id IS NULL

UNION ALL

SELECT 'Orphaned Subproblems (no problem)' as check_type, COUNT(*) as count  
FROM subproblems sp
LEFT JOIN problems p ON sp.problem_id = p.id
WHERE p.id IS NULL

UNION ALL

SELECT 'Problems with invalid topics' as check_type, COUNT(*) as count
FROM problems p
WHERE EXISTS (
  SELECT 1 
  FROM unnest(p.topics) topic_id
  LEFT JOIN topics t ON t.id = topic_id
  WHERE t.id IS NULL
);

-- 12. Performance test query
SELECT 'Performance Test - Complex Query' as test_category;

SELECT 
  d.school,
  d.course,
  p.difficulty,
  COUNT(*) as problem_count,
  AVG(array_length(p.topics, 1)) as avg_topics_per_problem
FROM documents d
JOIN problems p ON d.id = p.doc_id
WHERE p.manually_saved = true
GROUP BY d.school, d.course, p.difficulty
ORDER BY d.school, p.difficulty;