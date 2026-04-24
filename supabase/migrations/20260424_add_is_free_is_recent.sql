ALTER TABLE problems
  ADD COLUMN IF NOT EXISTS is_free   BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_recent BOOLEAN DEFAULT false;

-- All 30 problems from W1 T1-T3 are free
UPDATE problems SET is_free = true WHERE problem_id IN (
  -- T1: Foundations of Probability Modeling (12)
  'quant_interview_fundamental_qdsi_p40',
  'quant_interview_fundamental_qdsi_p26',
  'citadel_qdsi_p26',
  'quant_interview_fundamental_qdsi_p3',
  'quant_interview_fundamental_qdsi_p70',
  'quant_interview_fundamental_qdsi_p17',
  'quant_interview_fundamental_qdsi_p25',
  'quant_interview_fundamental_qdsi_p24',
  'quant_interview_fundamental_qdsi_p10',
  'quant_interview_fundamental_qdsi_p86',
  'citadel_qdsi_p24',
  'quant_interview_fundamental_qdsi_p69',
  -- T2: Conditional Probability (10)
  'sig_qdsi_p29',
  'quant_interview_fundamental_qdsi_p57',
  'quant_interview_fundamental_qdsi_p2',
  'quant_interview_fundamental_qdsi_p39',
  'quant_interview_fundamental_qdsi_p8',
  'quant_interview_fundamental_qdsi_p5',
  'quant_interview_fundamental_qdsi_p28',
  'quant_interview_fundamental_qdsi_p63',
  'quant_interview_fundamental_qdsi_p59',
  'quant_interview_fundamental_qdsi_p89',
  -- T3: Distributions (8)
  'voleon_group_qdsi_p1',
  'quant_interview_fundamental_qdsi_p62',
  'quant_interview_fundamental_qdsi_p95',
  'quant_interview_fundamental_qdsi_p96',
  'quant_interview_fundamental_qdsi_p98',
  'quant_interview_fundamental_qdsi_p97',
  'quant_interview_fundamental_qdsi_p84',
  'quant_interview_fundamental_qdsi_p85'
);
