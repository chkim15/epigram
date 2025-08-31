-- Create table to track topic notes PDFs
CREATE TABLE IF NOT EXISTS public.topic_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT, -- Public URL for direct access
    file_size_bytes INTEGER,
    page_count INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(topic_id) -- One note file per topic
);

-- Create index for quick lookups
CREATE INDEX idx_topic_notes_topic_id ON topic_notes(topic_id);

-- Enable RLS
ALTER TABLE topic_notes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read topic notes
CREATE POLICY "Anyone can view topic notes" ON public.topic_notes
    FOR SELECT 
    USING (true);

-- Only authenticated users can modify
CREATE POLICY "Authenticated users can insert topic notes" ON public.topic_notes
    FOR INSERT 
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can update topic notes" ON public.topic_notes
    FOR UPDATE 
    TO authenticated
    USING (true);

-- Insert metadata for all 35 topic notes
-- File URLs will be updated after upload to storage
INSERT INTO topic_notes (topic_id, file_name, file_path) VALUES
(1, '1_limits_continuity_and_ivt.pdf', 'topics/1_limits_continuity_and_ivt.pdf'),
(2, '2_limits_indeterminate_forms_limits_via_algebraic_manipulation.pdf', 'topics/2_limits_indeterminate_forms_limits_via_algebraic_manipulation.pdf'),
(3, '3_limits_limits_at_infinity_and_asymptotes.pdf', 'topics/3_limits_limits_at_infinity_and_asymptotes.pdf'),
(4, '4_derivatives_definition_of_derivatives.pdf', 'topics/4_derivatives_definition_of_derivatives.pdf'),
(5, '5_derivatives_chain_product_and_quotient_rules.pdf', 'topics/5_derivatives_chain_product_and_quotient_rules.pdf'),
(6, '6_derivatives_implicit_differentiation_and_inverse_derivatives.pdf', 'topics/6_derivatives_implicit_differentiation_and_inverse_derivatives.pdf'),
(7, '7_derivatives_logarithmic_differentiation.pdf', 'topics/7_derivatives_logarithmic_differentiation.pdf'),
(8, '8_derivatives_rolles_theorem_and_mvt.pdf', 'topics/8_derivatives_rolles_theorem_and_mvt.pdf'),
(9, '9_applications_of_derivatives_indeterminate_forms_limits_via_lhopitals_rule.pdf', 'topics/9_applications_of_derivatives_indeterminate_forms_limits_via_lhopitals_rule.pdf'),
(10, '10_applications_of_derivatives_approximation_via_differentiation.pdf', 'topics/10_applications_of_derivatives_approximation_via_differentiation.pdf'),
(11, '11_applications_of_derivatives_extreme_values_monotonicity_and_concavity.pdf', 'topics/11_applications_of_derivatives_extreme_values_monotonicity_and_concavity.pdf'),
(12, '12_applications_of_derivatives_optimization.pdf', 'topics/12_applications_of_derivatives_optimization.pdf'),
(13, '13_integration_anti-derivatives.pdf', 'topics/13_integration_anti-derivatives.pdf'),
(14, '14_integration_riemann_sum_and_definite_integral.pdf', 'topics/14_integration_riemann_sum_and_definite_integral.pdf'),
(15, '15_integration_fundamental_theorem_of_calculus.pdf', 'topics/15_integration_fundamental_theorem_of_calculus.pdf'),
(16, '16_integration_substitution.pdf', 'topics/16_integration_substitution.pdf'),
(17, '17_integration_area_between_curves.pdf', 'topics/17_integration_area_between_curves.pdf'),
(18, '18_integration_volume_by_slicing.pdf', 'topics/18_integration_volume_by_slicing.pdf'),
(19, '19_integration_volume_by_cylindrical_shells.pdf', 'topics/19_integration_volume_by_cylindrical_shells.pdf'),
(20, '20_integration_integration_by_parts.pdf', 'topics/20_integration_integration_by_parts.pdf'),
(21, '21_integration_partial_fractions.pdf', 'topics/21_integration_partial_fractions.pdf'),
(22, '22_integration_improper_integrals.pdf', 'topics/22_integration_improper_integrals.pdf'),
(23, '23_integration_arc_length.pdf', 'topics/23_integration_arc_length.pdf'),
(24, '24_integration_surface_area.pdf', 'topics/24_integration_surface_area.pdf'),
(25, '25_sequences_and_series_sequences.pdf', 'topics/25_sequences_and_series_sequences.pdf'),
(26, '26_sequences_and_series_series.pdf', 'topics/26_sequences_and_series_series.pdf'),
(27, '27_sequences_and_series_integral_tests.pdf', 'topics/27_sequences_and_series_integral_tests.pdf'),
(28, '28_sequences_and_series_comparison_tests.pdf', 'topics/28_sequences_and_series_comparison_tests.pdf'),
(29, '29_sequences_and_series_applications_of_taylor_polynomials.pdf', 'topics/29_sequences_and_series_applications_of_taylor_polynomials.pdf'),
(30, '30_sequences_and_series_alternating_series.pdf', 'topics/30_sequences_and_series_alternating_series.pdf'),
(31, '31_sequences_and_series_absolute_convergence_ratio_and_root_test.pdf', 'topics/31_sequences_and_series_absolute_convergence_ratio_and_root_test.pdf'),
(32, '32_sequences_and_series_power_series.pdf', 'topics/32_sequences_and_series_power_series.pdf'),
(33, '33_sequences_and_series_taylor_and_maclaurin_series.pdf', 'topics/33_sequences_and_series_taylor_and_maclaurin_series.pdf'),
(34, '34_ordinary_differential_equations_separable_ode.pdf', 'topics/34_ordinary_differential_equations_separable_ode.pdf'),
(35, '35_ordinary_differential_equations_first_order_linear_ode.pdf', 'topics/35_ordinary_differential_equations_first_order_linear_ode.pdf');

-- Note: Topics 36-41 are special topics without notes yet
-- They can be added later when notes are available