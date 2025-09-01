-- Migration to add topic_notes entries for special topics (IDs 36-41)
-- These PDFs contain special topic materials for advanced calculus concepts

-- Insert metadata for special topics notes (36-41)
-- File URLs will be set after uploading the PDFs to Supabase storage
INSERT INTO topic_notes (topic_id, file_name, file_path) VALUES
(36, '36_special_topic_basic_probability_theory.pdf', 'topics/36_special_topic_basic_probability_theory.pdf'),
(37, '37_special_topic_convergence_test_strategies.pdf', 'topics/37_special_topic_convergence_test_strategies.pdf'),
(38, '38_special_topic_essential_integration_strategies.pdf', 'topics/38_special_topic_essential_integration_strategies.pdf'),
(39, '39_special_topic_essential_strategies_for_evaluating_limits.pdf', 'topics/39_special_topic_essential_strategies_for_evaluating_limits.pdf'),
(40, '40_special_topic_factoring_polynomials.pdf', 'topics/40_special_topic_factoring_polynomials.pdf'),
(41, '41_special_topic_order_of_growth_and_asymptotic_analysis.pdf', 'topics/41_special_topic_order_of_growth_and_asymptotic_analysis.pdf')
ON CONFLICT (topic_id) DO UPDATE SET
  file_name = EXCLUDED.file_name,
  file_path = EXCLUDED.file_path,
  updated_at = NOW();

-- Verify insertion
SELECT 
    tn.topic_id,
    t.subtopics as topic_name,
    tn.file_name,
    CASE 
        WHEN tn.file_url IS NOT NULL THEN 'Uploaded'
        ELSE 'Pending Upload'
    END as status
FROM topic_notes tn
JOIN topics t ON t.id = tn.topic_id
WHERE tn.topic_id BETWEEN 36 AND 41
ORDER BY tn.topic_id;