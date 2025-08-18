# Database Schema Documentation v2

## Overview
This document describes the simplified database schema for the Mathpix calculus problem platform. The schema is designed to store mathematical problems from exams and assignments with direct field storage for hints, solutions, approaches, and reasoning types (no longer using separate tables).

## Key Changes from v1
- **Removed tables**: `domains`, `approaches`, `reasoning_types`, `problem_hints`, `problem_solutions`
- **Added direct fields**: `hint`, `solution_text` in `problems` and `subproblems`
- **Array fields**: `math_approach` and `reasoning_type` now support multiple values as TEXT[]
- **Topics**: Many-to-many relationship via `problem_topics` junction table
- **Soft deletion**: Added `included` column for excluding problems without deletion

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
Reference table for mathematical topics organized by Calculus I/II curriculum.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | INTEGER | PRIMARY KEY | Topic ID |
| subtopics | TEXT | UNIQUE, NOT NULL | Specific subtopic name |
| main_topics | TEXT | | Main topic category (e.g., "Limits", "Derivatives", "Advanced Integration") |
| course | TEXT | | Course level ("Calculus I" or "Calculus II") |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

### 3. `problems`
Main problems table with direct fields for hint, solution, and array fields for approaches and reasoning.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| problem_id | TEXT | UNIQUE, NOT NULL | Human-readable problem ID (e.g., "upenn_math103_final_fall_2021_p1") |
| document_id | UUID | FOREIGN KEY → documents(id), ON DELETE CASCADE | Reference to parent document |
| problem_text | TEXT | NULLABLE | Problem statement (nullable for problems with only subproblems) |
| correct_answer | TEXT | | Expected answer |
| hint | TEXT | | Single hint text (nullable) |
| solution_text | TEXT | | Single solution text (nullable) |
| math_approach | TEXT[] | | Array of mathematical approaches (algebraic, geometric, etc.) |
| reasoning_type | TEXT[] | | Array of reasoning types (proof-based, computational, etc.) |
| difficulty | TEXT | CHECK IN ('easy', 'medium', 'hard', 'very_hard') | Difficulty level |
| importance | INTEGER | CHECK (1-3) | Importance rating |
| comment | TEXT | | Editorial comments |
| version | TEXT | DEFAULT 'v1' | Version identifier |
| included | BOOLEAN | DEFAULT true | Whether problem is included (soft deletion) |
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

### 5. `problem_topics`
Junction table for many-to-many relationship between problems and topics.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| problem_id | UUID | FOREIGN KEY → problems(id), ON DELETE CASCADE | Reference to problem |
| topic_id | INTEGER | FOREIGN KEY → topics(id), ON DELETE CASCADE | Reference to topic |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Primary Key:** (problem_id, topic_id)

## Indexes

- `idx_problems_document_id` on problems(document_id)
- `idx_subproblems_problem_id` on subproblems(problem_id)
- `idx_problem_topics_problem_id` on problem_topics(problem_id)
- `idx_problem_topics_topic_id` on problem_topics(topic_id)
- `idx_problems_difficulty` on problems(difficulty)
- `idx_problems_importance` on problems(importance)
- `idx_problems_included` on problems(included)

## Triggers

### `update_updated_at_column()`
Function that automatically updates the `updated_at` timestamp when a row is modified.

Applied to:
- `documents` table
- `problems` table

## Predefined Topics

The `topics` table is populated with 40 predefined calculus topics organized by Calculus I & II curriculum:

## CALCULUS I

### Basics of Functions
1. Variables, Functions and Graphs

### Limits
2. Limits of Functions
3. Continuity and Intermediate Value Theorem
4. Indeterminate Forms Limits via Algebraic Manipulation
5. Limits at Infinity and Asymptotes

### Derivatives
6. Limiting Definition of Derivatives
7. Chain, Product and Quotient Rules
8. Implicit Differentiation and Inverse Derivatives
9. Logarithmic Differentiation

### Applications of Derivatives
10. Inverse Trig and Hyperbolic Functions
11. Indeterminate Forms Limits via L'Hospital Rule
12. Extreme Values, Monotonicity and Concavity
13. Applied Optimization
14. Approximation via Differentiation

### Integration
15. Antiderivatives
16. Riemann Sum and Definite Integral
17. Fundamental Theorem of Calculus
18. Substitution Rules
19. Area Between Curves

---
**ROUGH CUTOFF BETWEEN CALC I AND II**
---

## CALCULUS II

### Advanced Integration
20. Volume by Slicing
21. Volume by Cylindrical Shells
22. Integration by Parts
23. Partial Fractions
24. Improper Integrals
25. Arc Length
26. Surface Area

### Sequences and Series
27. Sequences
28. Series
29. Integral Tests
30. Comparison Tests
31. Alternating Series
32. Absolute Convergence, Ratio and Root Test
33. Power Series
34. Taylor and MacLaurin Series
35. Applications of Taylor Polynomials

### Ordinary Differential Equations
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

1. **Hybrid storage**: Direct fields for single values, arrays for multiple selections, junction table for referential integrity
2. **UUID vs Text IDs**: UUIDs are used for internal references while text IDs provide human-readable identifiers
3. **Nullable problem_text**: Allows for problems that only contain subproblems
4. **Many-to-many topics**: Junction table maintains referential integrity with topics reference table
5. **Array fields**: `math_approach` and `reasoning_type` support multiple values as TEXT arrays
6. **Soft deletion**: `included` column allows excluding problems without data loss

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
      "math_approach": ["algebraic", "geometric"],  // → problems.math_approach (array)
      "reasoning_type": ["computational"],          // → problems.reasoning_type (array)
      "topics": [1, 2, 3],                          // → problem_topics junction table
      "included": true                              // → problems.included
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

## Migration to Current Schema

To migrate to the current structure:

1. **Backup existing data**
2. **Convert single values to arrays** for `math_approach` and `reasoning_type`
3. **Create junction table** for problem-topic relationships
4. **Migrate topic data** from direct foreign key to junction table
5. **Add `included` column** with default value true
6. **Apply indexes** for performance optimization

Migration scripts available in `/supabase/migrations/`:
- `20250118_add_problem_topics_junction.sql` - Creates junction table and migrates data