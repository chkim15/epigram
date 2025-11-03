-- Add Miscellaneous Topics to Quant DS Interview Course
-- Migration: 20250203_add_miscellaneous_topics
-- Description: Adds 8 new topics (IDs 75-82) under "Miscellaneous Topics" main category

-- Insert new topics for Quant DS Interview course
INSERT INTO topics (id, subtopics, main_topics, course, created_at)
VALUES
  (75, 'Mental Math', 'Miscellaneous Topics', 'Quant DS Interview', NOW()),
  (76, 'Dice Problems', 'Miscellaneous Topics', 'Quant DS Interview', NOW()),
  (77, 'Brain Teasers', 'Miscellaneous Topics', 'Quant DS Interview', NOW()),
  (78, 'Rejection Sampling', 'Miscellaneous Topics', 'Quant DS Interview', NOW()),
  (79, 'Coin-Toss Problems', 'Miscellaneous Topics', 'Quant DS Interview', NOW()),
  (80, 'Frequently-Tested Problems', 'Miscellaneous Topics', 'Quant DS Interview', NOW()),
  (81, 'Must-Do Problems', 'Miscellaneous Topics', 'Quant DS Interview', NOW()),
  (82, 'Randomized Algorithms', 'Miscellaneous Topics', 'Quant DS Interview', NOW())
ON CONFLICT (id) DO NOTHING;

-- Verify insertion
SELECT id, subtopics, main_topics, course
FROM topics
WHERE id BETWEEN 75 AND 82
ORDER BY id;

-- Show summary of all Quant DS Interview topics by main category
SELECT main_topics, COUNT(*) as topic_count
FROM topics
WHERE course = 'Quant DS Interview'
GROUP BY main_topics
ORDER BY MIN(id);
