# Database Schema Documentation

## Overview
This document describes the database schema for the Mathpix calculus problem platform. The schema is designed to store mathematical problems from exams and assignments with support for subproblems, hints, solutions, and metadata.

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

### 2. `problems`
Main problems table storing individual problems.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| problem_id | TEXT | UNIQUE, NOT NULL | Human-readable problem ID (e.g., "upenn_math103_final_fall_2021_p1") |
| document_id | UUID | FOREIGN KEY → documents(id), ON DELETE CASCADE | Reference to parent document |
| problem_text | TEXT | NULLABLE | Problem statement (nullable for problems with only subproblems) |
| correct_answer | TEXT | | Expected answer |
| difficulty | TEXT | CHECK IN ('easy', 'medium', 'hard', 'very_hard') | Difficulty level |
| importance | INTEGER | CHECK (1-3) | Importance rating |
| comment | TEXT | | Editorial comments |
| version | TEXT | DEFAULT 'v1' | Version identifier |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

### 3. `subproblems`
Stores subproblems (e.g., problem 1a, 1b, 1c).

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| problem_id | UUID | FOREIGN KEY → problems(id), ON DELETE CASCADE | Reference to parent problem |
| key | TEXT | NOT NULL | Subproblem identifier (a, b, c, etc.) |
| problem_text | TEXT | | Subproblem statement |
| correct_answer | TEXT | | Expected answer |
| comment | TEXT | | Editorial comments |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Unique Constraint:** (problem_id, key)

### 4. `problem_hints`
Stores hints for problems or subproblems.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| problem_id | UUID | FOREIGN KEY → problems(id), ON DELETE CASCADE, NULLABLE | Reference to problem |
| subproblem_id | UUID | FOREIGN KEY → subproblems(id), ON DELETE CASCADE, NULLABLE | Reference to subproblem |
| hint_text | TEXT | NOT NULL | Hint content |
| position | INTEGER | DEFAULT 0 | Order position |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Check Constraint:** Either problem_id OR subproblem_id must be set (not both)

### 5. `problem_solutions`
Stores solutions for problems or subproblems.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| problem_id | UUID | FOREIGN KEY → problems(id), ON DELETE CASCADE, NULLABLE | Reference to problem |
| subproblem_id | UUID | FOREIGN KEY → subproblems(id), ON DELETE CASCADE, NULLABLE | Reference to subproblem |
| solution_text | TEXT | NOT NULL | Solution content |
| position | INTEGER | DEFAULT 0 | Order position |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Check Constraint:** Either problem_id OR subproblem_id must be set (not both)

### 6. `problem_images`
Stores image references for problems, subproblems, or solutions.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| problem_id | UUID | FOREIGN KEY → problems(id), ON DELETE CASCADE, NULLABLE | Reference to problem |
| subproblem_id | UUID | FOREIGN KEY → subproblems(id), ON DELETE CASCADE, NULLABLE | Reference to subproblem |
| solution_id | UUID | FOREIGN KEY → problem_solutions(id), ON DELETE CASCADE, NULLABLE | Reference to solution |
| image_path | TEXT | NOT NULL | Path/filename of image |
| context | TEXT | CHECK IN ('main', 'solution', 'subproblem') | Image context |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

### 7. `topics`
Reference table for mathematical topics.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | INTEGER | PRIMARY KEY | Topic ID |
| name | TEXT | UNIQUE, NOT NULL | Topic name |
| category | TEXT | | Topic category (e.g., "Limits", "Derivatives", "Integration") |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

### 8. `problem_topics`
Junction table linking problems to topics (many-to-many).

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| problem_id | UUID | FOREIGN KEY → problems(id), ON DELETE CASCADE | Reference to problem |
| topic_id | INTEGER | FOREIGN KEY → topics(id), ON DELETE CASCADE | Reference to topic |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Primary Key:** (problem_id, topic_id)

### 9. `domains`
Stores domains associated with problems.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| problem_id | UUID | FOREIGN KEY → problems(id), ON DELETE CASCADE | Reference to problem |
| domain | TEXT | NOT NULL | Domain name (e.g., "calculus") |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Primary Key:** (problem_id, domain)

### 10. `approaches`
Stores mathematical approaches for problems.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| problem_id | UUID | FOREIGN KEY → problems(id), ON DELETE CASCADE | Reference to problem |
| approach | TEXT | NOT NULL | Approach type (e.g., "algebraic", "geometric") |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Primary Key:** (problem_id, approach)

### 11. `reasoning_types`
Stores reasoning types for problems.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| problem_id | UUID | FOREIGN KEY → problems(id), ON DELETE CASCADE | Reference to problem |
| reasoning_type | TEXT | NOT NULL | Reasoning type (e.g., "proof-based", "computational") |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Primary Key:** (problem_id, reasoning_type)

## Indexes

- `idx_problems_document_id` on problems(document_id)
- `idx_subproblems_problem_id` on subproblems(problem_id)
- `idx_problem_hints_problem_id` on problem_hints(problem_id)
- `idx_problem_hints_subproblem_id` on problem_hints(subproblem_id)
- `idx_problem_solutions_problem_id` on problem_solutions(problem_id)
- `idx_problem_solutions_subproblem_id` on problem_solutions(subproblem_id)
- `idx_problem_images_problem_id` on problem_images(problem_id)
- `idx_problem_images_subproblem_id` on problem_images(subproblem_id)
- `idx_problem_topics_problem_id` on problem_topics(problem_id)
- `idx_problem_topics_topic_id` on problem_topics(topic_id)

## Triggers

### `update_updated_at_column()`
Function that automatically updates the `updated_at` timestamp when a row is modified.

Applied to:
- `documents` table
- `problems` table

## Predefined Topics

The `topics` table is populated with 40 predefined calculus topics:

1. Variables, Functions and Graphs
2. Limits of Functions
3. Continuity and IVT
4. Indeterminate Forms Limits via Algebraic Manipulation
5. Limits at Infinity and Asymptotes
6. Limiting Definition of Derivatives
7. Chain, Product and Quotient Rules
8. Implicit Differentiation and Inverse Derivatives
9. Logarithmic Differentiation
10. Inverse Trig and Hyperbolic Functions
11. Indeterminate Forms Limits via L'Hospital Rule
12. Extreme Values, Monotonicity and Concavity
13. Applied Optimization
14. Approximation via Differentiation
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
27. Sequences
28. Series
29. Integral Tests
30. Comparison Tests
31. Alternating Series
32. Absolute Convergence, Ratio and Root Test
33. Power Series
34. Taylor and MacLaurin Series
35. Applications of Taylor Polynomials
36. Separable and Homogeneous ODE
37. First Order Linear ODE
38. Second Order Linear ODE
39. Nonhomogeneous Linear ODE
40. Series Solutions of ODE

The `approaches` table is populated with 10 predefined mathematical approaches:

1. Algebraic
2. Geometric
3. Combinatorial
4. Approximation
5. Intuitive
6. Algorithmic
7. Logical
8. Symmetric
9. Statistical
10. Nontraditional

The `reasoning_type` table is populated with 6 predefined types of reasoning:

1. Proof-based
2. Example Construction
3. Counterexample Construction
4. Computational
5. Conceptual
6. Application-based

## Design Decisions

1. **UUID vs Text IDs**: UUIDs are used for internal references while text IDs provide human-readable identifiers
2. **Nullable problem_text**: Allows for problems that only contain subproblems
3. **Flexible associations**: Images, hints, and solutions can be associated with either main problems or subproblems
4. **Many-to-many relationships**: Topics, domains, approaches, and reasoning types use junction tables for flexibility
5. **Array storage avoided**: Instead of storing arrays in columns, we use proper normalized tables

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

The complete SQL to create this schema can be found in `/backend/sql/schema.sql`