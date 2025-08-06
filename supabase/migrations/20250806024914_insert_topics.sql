-- Insert topics data based on updated 40 topics list
-- This matches the topics from editor/topics.json

INSERT INTO topics (id, name) VALUES 
(1, 'Variables, Functions and Graphs'),
(2, 'Limits of Functions'),
(3, 'Continuity and IVT'),
(4, 'Indeterminate Forms Limits via Algebraic Manipulation'),
(5, 'Limits at Infinity and Asymptotes'),
(6, 'Limiting Definition of Derivatives'),
(7, 'Chain, Product and Quotient Rules'),
(8, 'Implicit Differentiation and Inverse Derivatives'),
(9, 'Logarithmic Differentiation'),
(10, 'Inverse Trig and Hyperbolic Functions'),
(11, 'Indeterminate Forms Limits via L''Hospital Rule'),
(12, 'Extreme Values, Monotonicity and Concavity'),
(13, 'Applied Optimization'),
(14, 'Approximation via Differentiation'),
(15, 'Antiderivatives'),
(16, 'Riemann Sum and Definite Integral'),
(17, 'Fundamental Theorem of Calculus'),
(18, 'Substitution Rules'),
(19, 'Area Between Curves'),
(20, 'Volume by Slicing'),
(21, 'Volume by Cylindrical Shells'),
(22, 'Integration by Parts'),
(23, 'Partial Fractions'),
(24, 'Improper Integrals'),
(25, 'Arc Length'),
(26, 'Surface Area'),
(27, 'Sequences'),
(28, 'Series'),
(29, 'Integral Tests'),
(30, 'Comparison Tests'),
(31, 'Alternating Series'),
(32, 'Absolute Convergence, Ratio and Root Test'),
(33, 'Power Series'),
(34, 'Taylor and MacLaurin Series'),
(35, 'Applications of Taylor Polynomials'),
(36, 'Separable and Homogeneous ODE'),
(37, 'First Order Linear ODE'),
(38, 'Second Order Linear ODE'),
(39, 'Nonhomogeneous Linear ODE'),
(40, 'Series Solutions of ODE')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name;

-- Verify insertion
SELECT COUNT(*) as topics_count FROM topics;
