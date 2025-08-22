-- Create solutions table for multiple solutions per problem/subproblem
-- This migration adds support for storing multiple solution approaches

-- Create the solutions table
CREATE TABLE IF NOT EXISTS solutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,  -- UUID to match problems.id
    subproblem_id UUID REFERENCES subproblems(id) ON DELETE CASCADE,  -- UUID to match subproblems.id
    solution_text TEXT NOT NULL,
    solution_order INTEGER DEFAULT 0,  -- For ordering multiple solutions
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Ensure solution belongs to either problem OR subproblem, not both
    CONSTRAINT check_problem_or_subproblem CHECK (
        (problem_id IS NOT NULL AND subproblem_id IS NULL) OR 
        (problem_id IS NULL AND subproblem_id IS NOT NULL)
    )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_solutions_problem_id ON solutions(problem_id);
CREATE INDEX IF NOT EXISTS idx_solutions_subproblem_id ON solutions(subproblem_id);
CREATE INDEX IF NOT EXISTS idx_solutions_order ON solutions(solution_order);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_solutions_updated_at 
    BEFORE UPDATE ON solutions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE solutions IS 'Multiple solutions for problems and subproblems';
COMMENT ON COLUMN solutions.solution_text IS 'The solution content in LaTeX/text format';
COMMENT ON COLUMN solutions.solution_order IS 'Order of the solution (0 = first, 1 = second, etc.)';

-- Migrate existing solution data from problems table
-- Only migrate if solution_text is not null
INSERT INTO solutions (problem_id, solution_text, solution_order)
SELECT id, solution_text, 0
FROM problems
WHERE solution_text IS NOT NULL AND solution_text != '';

-- Migrate existing solution data from subproblems table
-- Only migrate if solution_text is not null
INSERT INTO solutions (subproblem_id, solution_text, solution_order)
SELECT id, solution_text, 0
FROM subproblems
WHERE solution_text IS NOT NULL AND solution_text != '';

-- Note: We're keeping the original solution_text columns in problems and subproblems
-- tables for backward compatibility during the transition period.
-- These can be dropped in a future migration once all systems are updated.

-- Helper function to get solutions for a problem
CREATE OR REPLACE FUNCTION get_problem_solutions(problem_id_param TEXT)
RETURNS TABLE (
    id UUID,
    solution_text TEXT,
    solution_order INTEGER,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.solution_text,
        s.solution_order,
        s.created_at,
        s.updated_at
    FROM solutions s
    WHERE s.problem_id = problem_id_param
    ORDER BY s.solution_order ASC;
END;
$$ LANGUAGE plpgsql;

-- Helper function to get solutions for a subproblem
CREATE OR REPLACE FUNCTION get_subproblem_solutions(subproblem_id_param UUID)
RETURNS TABLE (
    id UUID,
    solution_text TEXT,
    solution_order INTEGER,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.solution_text,
        s.solution_order,
        s.created_at,
        s.updated_at
    FROM solutions s
    WHERE s.subproblem_id = subproblem_id_param
    ORDER BY s.solution_order ASC;
END;
$$ LANGUAGE plpgsql;