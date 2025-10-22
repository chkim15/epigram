-- Add keyword column to problems table
ALTER TABLE problems
ADD COLUMN IF NOT EXISTS keyword TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN problems.keyword IS 'Optional keyword field for categorizing or tagging problems';