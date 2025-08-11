# Database Schema Documentation v2

## Overview
This document describes the simplified database schema for the Mathpix calculus problem platform. The schema is designed to store mathematical problems from exams and assignments with direct field storage for hints, solutions, approaches, and reasoning types (no longer using separate tables).

## Key Changes from v1
- **Removed tables**: `domains`, `approaches`, `reasoning_types`, `problem_hints`, `problem_solutions`, `problem_topics`
- **Added direct fields**: `hint`, `solution_text`, `math_approach`, `reasoning_type` in `problems` and `subproblems`
- **Simplified topics**: Direct foreign key relationship (many-to-one) instead of junction table
- **Single values only**: All fields store single text values, not arrays

## Tables

### 1. `documents`
Stores metadata about exam documents and problem sets.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| document_id | TEXT | UNIQUE, NOT NULL | Human-readable document ID (e.g., "upenn_math103_final_fall_2021") |
| school | TEXT | | Institution name |
| course | TEXT | | Course code |
| problem_type | TEXT | | Type of assessment (final, midterm, quiz, etc.) |
| term | TEXT | | Academic term (fall, spring, summer) |
| year | INTEGER | | Academic year |
| total_problems | INTEGER | | Count of problems in document |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

### 2. `topics`
Reference table for mathematical topics.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | INTEGER | PRIMARY KEY | Topic ID |
| name | TEXT | UNIQUE, NOT NULL | Topic name |
| category | TEXT | | Topic category (e.g., "Limits", "Derivatives", "Integration") |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

### 3. `problems`
Main problems table with direct fields for hint, solution, approach, and reasoning.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| problem_id | TEXT | UNIQUE, NOT NULL | Human-readable problem ID (e.g., "upenn_math103_final_fall_2021_p1") |
| document_id | UUID | FOREIGN KEY → documents(id), ON DELETE CASCADE | Reference to parent document |
| problem_text | TEXT | NULLABLE | Problem statement (nullable for problems with only subproblems) |
| correct_answer | TEXT | | Expected answer |
| hint | TEXT | | Single hint text (nullable) |
| solution_text | TEXT | | Single solution text (nullable) |
| math_approach | TEXT | | Mathematical approach (algebraic, geometric, etc.) |
| reasoning_type | TEXT | | Type of reasoning (proof-based, computational, etc.) |
| topic_id | INTEGER | FOREIGN KEY → topics(id), ON DELETE SET NULL | Direct reference to topic |
| difficulty | TEXT | CHECK IN ('easy', 'medium', 'hard', 'very_hard') | Difficulty level |
| importance | INTEGER | CHECK (1-3) | Importance rating |
| comment | TEXT | | Editorial comments |
| version | TEXT | DEFAULT 'v1' | Version identifier |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

### 4. `subproblems`
Stores subproblems (e.g., problem 1a, 1b, 1c) with direct hint and solution fields.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| problem_id | UUID | FOREIGN KEY → problems(id), ON DELETE CASCADE | Reference to parent problem |
| key | TEXT | NOT NULL | Subproblem identifier (a, b, c, etc.) |
| problem_text | TEXT | | Subproblem statement |
| correct_answer | TEXT | | Expected answer |
| hint | TEXT | | Single hint text (nullable) |
| solution_text | TEXT | | Single solution text (nullable) |
| comment | TEXT | | Editorial comments |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Unique Constraint:** (problem_id, key)

## Indexes

- `idx_problems_document_id` on problems(document_id)
- `idx_problems_topic_id` on problems(topic_id)
- `idx_subproblems_problem_id` on subproblems(problem_id)
- `idx_images_problem_id` on images(problem_id)
- `idx_images_subproblem_id` on images(subproblem_id)
- `idx_problems_difficulty` on problems(difficulty)
- `idx_problems_math_approach` on problems(math_approach)
- `idx_problems_reasoning_type` on problems(reasoning_type)
- `idx_problems_importance` on problems(importance)

## Triggers

### `update_updated_at_column()`
Function that automatically updates the `updated_at` timestamp when a row is modified.

Applied to:
- `documents` table
- `problems` table

## Predefined Topics

The `topics` table is populated with 40 predefined calculus topics organized by category:

### Foundations
1. Variables, Functions and Graphs

### Limits
2. Limits of Functions
3. Continuity and IVT
4. Indeterminate Forms Limits via Algebraic Manipulation
5. Limits at Infinity and Asymptotes

### Derivatives
6. Limiting Definition of Derivatives
7. Chain, Product and Quotient Rules
8. Implicit Differentiation and Inverse Derivatives
9. Logarithmic Differentiation
10. Inverse Trig and Hyperbolic Functions
11. Indeterminate Forms Limits via L'Hospital Rule

### Applications
12. Extreme Values, Monotonicity and Concavity
13. Applied Optimization
14. Approximation via Differentiation

### Integration
15. Antiderivatives
16. Riemann Sum and Definite Integral
17. Fundamental Theorem of Calculus
18. Substitution Rules
19. Area Between Curves
20. Volume by Slicing
21. Volume by Cylindrical Shells
22. Integration by Parts
23. Partial Fractions
24. Improper Integrals
25. Arc Length
26. Surface Area

### Series
27. Sequences
28. Series
29. Integral Tests
30. Comparison Tests
31. Alternating Series
32. Absolute Convergence, Ratio and Root Test
33. Power Series
34. Taylor and MacLaurin Series
35. Applications of Taylor Polynomials

### Differential Equations
36. Separable and Homogeneous ODE
37. First Order Linear ODE
38. Second Order Linear ODE
39. Nonhomogeneous Linear ODE
40. Series Solutions of ODE

## Predefined Values

### Mathematical Approaches
The `math_approach` field accepts these predefined values:
- Algebraic
- Geometric
- Combinatorial
- Approximation
- Intuitive
- Algorithmic
- Logical
- Symmetric
- Statistical
- Nontraditional

### Reasoning Types
The `reasoning_type` field accepts these predefined values:
- Proof-based
- Example Construction
- Counterexample Construction
- Computational
- Conceptual
- Application-based

## Design Decisions

1. **Simplified storage**: Direct fields replace junction tables for single-value data
2. **UUID vs Text IDs**: UUIDs are used for internal references while text IDs provide human-readable identifiers
3. **Nullable problem_text**: Allows for problems that only contain subproblems
4. **Direct topic relationship**: Many-to-one relationship via foreign key instead of junction table
5. **Single values**: All hint, solution, approach, and reasoning fields store single text values
6. **No arrays**: Eliminated array storage in favor of simple text fields

## JSON Structure Alignment

This schema directly maps to the JSON structure:

```json
{
  "problems": [
    {
      "hint": "single hint text",           // → problems.hint
      "solution": {
        "text": "single solution text",      // → problems.solution_text  
        "images": ["img1.png"]             // → images table
      },
      "math_approach": "algebraic",         // → problems.math_approach
      "reasoning_type": "computational",    // → problems.reasoning_type
      "topics": [1]                         // → problems.topic_id (single value)
    }
  ]
}
```

## Row Level Security (RLS)

For production, enable RLS on all tables with appropriate policies:

```sql
-- Example: Allow public read access
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON documents FOR SELECT USING (true);

-- Example: Require authentication for writes
CREATE POLICY "Allow authenticated write" ON documents 
  FOR ALL USING (auth.role() = 'authenticated');
```

## Migration SQL

The complete SQL to create this schema can be found in `/backend/sql/schema_v2.sql`

## Migration from v1 to v2

To migrate existing data from the old normalized structure:

1. **Backup existing data**
2. **Extract single values** from arrays in old tables
3. **Migrate topics** from junction table to direct foreign key
4. **Drop old tables** and create new schema
5. **Insert migrated data** into new structure