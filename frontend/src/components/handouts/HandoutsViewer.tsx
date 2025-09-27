'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import PDFViewerSimple from '@/components/pdf/PDFViewerSimple';
import { FileText, AlertCircle } from 'lucide-react';

interface HandoutsViewerProps {
  selectedTopicId: number | null;
}

interface TopicHandout {
  topic_id: number;
  topic_name: string;
  file_url: string | null;
}

export default function HandoutsViewer({ selectedTopicId }: HandoutsViewerProps) {
  const [handout, setHandout] = useState<TopicHandout | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedTopicId) {
      setHandout(null);
      return;
    }

    const fetchHandout = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch topic details
        const { data: topic, error: topicError } = await supabase
          .from('topics')
          .select('id, subtopics')
          .eq('id', selectedTopicId)
          .single();
        
        if (topicError) throw topicError;
        
        // Fetch handout URL for this topic
        const { data: topicNote } = await supabase
          .from('topic_notes')
          .select('file_url')
          .eq('topic_id', selectedTopicId)
          .single();
        
        let fileUrl = topicNote?.file_url;
        
        // If no URL in database, construct it based on expected pattern
        if (!fileUrl && selectedTopicId <= 41) {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          if (supabaseUrl) {
            // Map topic IDs to exact file names
            const fileNameMap: { [key: number]: string } = {
              1: '1_limits_continuity_and_ivt.pdf',
              2: '2_limits_indeterminate_forms_limits_via_algebraic_manipulation.pdf',
              3: '3_limits_limits_at_infinity_and_asymptotes.pdf',
              4: '4_derivatives_definition_of_derivatives.pdf',
              5: '5_derivatives_chain_product_and_quotient_rules.pdf',
              6: '6_derivatives_implicit_differentiation_and_inverse_derivatives.pdf',
              7: '7_derivatives_logarithmic_differentiation.pdf',
              8: '8_derivatives_rolles_theorem_and_mvt.pdf',
              9: '9_applications_of_derivatives_indeterminate_forms_limits_via_lhopitals_rule.pdf',
              10: '10_applications_of_derivatives_approximation_via_differentiation.pdf',
              11: '11_applications_of_derivatives_extreme_values_monotonicity_and_concavity.pdf',
              12: '12_applications_of_derivatives_optimization.pdf',
              13: '13_integration_anti-derivatives.pdf',
              14: '14_integration_riemann_sum_and_definite_integral.pdf',
              15: '15_integration_fundamental_theorem_of_calculus.pdf',
              16: '16_integration_substitution.pdf',
              17: '17_integration_area_between_curves.pdf',
              18: '18_integration_volume_by_slicing.pdf',
              19: '19_integration_volume_by_cylindrical_shells.pdf',
              20: '20_integration_integration_by_parts.pdf',
              21: '21_integration_partial_fractions.pdf',
              22: '22_integration_improper_integrals.pdf',
              23: '23_integration_arc_length.pdf',
              24: '24_integration_surface_area.pdf',
              25: '25_sequences_and_series_sequences.pdf',
              26: '26_sequences_and_series_series.pdf',
              27: '27_sequences_and_series_integral_tests.pdf',
              28: '28_sequences_and_series_comparison_tests.pdf',
              29: '29_sequences_and_series_applications_of_taylor_polynomials.pdf',
              30: '30_sequences_and_series_alternating_series.pdf',
              31: '31_sequences_and_series_absolute_convergence_ratio_and_root_test.pdf',
              32: '32_sequences_and_series_power_series.pdf',
              33: '33_sequences_and_series_taylor_and_maclaurin_series.pdf',
              34: '34_ordinary_differential_equations_separable_ode.pdf',
              35: '35_ordinary_differential_equations_first_order_linear_ode.pdf',
              36: '36_special_topic_basic_probability_theory.pdf',
              37: '37_special_topic_convergence_test_strategies.pdf',
              38: '38_special_topic_essential_integration_strategies.pdf',
              39: '39_special_topic_essential_strategies_for_evaluating_limits.pdf',
              40: '40_special_topic_factoring_polynomials.pdf',
              41: '41_special_topic_order_of_growth_and_asymptotic_analysis.pdf'
            };
            
            const fileName = fileNameMap[selectedTopicId];
            if (fileName) {
              fileUrl = `${supabaseUrl}/storage/v1/object/public/pdf-notes/topics/${fileName}`;
            }
          }
        }
        
        setHandout({
          topic_id: topic?.id || selectedTopicId,
          topic_name: topic?.subtopics || `Topic ${selectedTopicId}`,
          file_url: fileUrl || null
        });
        
      } catch (err) {
        console.error('Error fetching handout:', err);
        setError('Failed to load handout');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHandout();
  }, [selectedTopicId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full flex-col min-h-0 px-2 py-2" style={{ backgroundColor: 'var(--background)' }}>
        <div className="rounded-xl border overflow-hidden flex h-full flex-col" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-center h-full" style={{ backgroundColor: 'var(--background)' }}>
            <div style={{ color: 'var(--muted-foreground)' }}>Loading handout...</div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-full flex-col min-h-0 px-2 py-2" style={{ backgroundColor: 'var(--background)' }}>
        <div className="rounded-xl border overflow-hidden flex h-full flex-col" style={{ borderColor: 'var(--border)' }}>
          <div className="flex flex-col items-center justify-center h-full space-y-2" style={{ backgroundColor: 'var(--background)' }}>
            <AlertCircle className="h-8 w-8 text-red-500" />
            <div style={{ color: 'var(--foreground)' }}>{error}</div>
          </div>
        </div>
      </div>
    );
  }

  // No topic selected
  if (!selectedTopicId || !handout) {
    return (
      <div className="flex h-full flex-col min-h-0 px-2 py-2" style={{ backgroundColor: 'var(--background)' }}>
        <div className="rounded-xl border overflow-hidden flex h-full flex-col" style={{ borderColor: 'var(--border)' }}>
          <div className="flex flex-col items-center justify-center h-full space-y-3" style={{ backgroundColor: 'var(--background)' }}>
            <FileText className="h-12 w-12" style={{ color: 'var(--muted-foreground)' }} />
            <div style={{ color: 'var(--muted-foreground)' }}>Select a topic to view handouts</div>
          </div>
        </div>
      </div>
    );
  }

  // No handout available for this topic
  if (!handout.file_url) {
    return (
      <div className="flex h-full flex-col min-h-0 px-2 py-2" style={{ backgroundColor: 'var(--background)' }}>
        <div className="rounded-xl border overflow-hidden flex h-full flex-col" style={{ borderColor: 'var(--border)' }}>
          <div className="flex flex-col items-center justify-center h-full space-y-3" style={{ backgroundColor: 'var(--background)' }}>
            <FileText className="h-12 w-12" style={{ color: 'var(--muted-foreground)' }} />
            <div style={{ color: 'var(--muted-foreground)' }}>
              Handout not yet available for {handout.topic_name}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Display PDF
  return (
    <div className="flex h-full flex-col min-h-0 px-2 py-2" style={{ backgroundColor: 'var(--background)' }}>
      <div className="rounded-xl border overflow-hidden flex h-full flex-col" style={{ borderColor: 'var(--border)' }}>
        <div className="flex-1 min-h-0">
          <PDFViewerSimple 
            pdfUrl={handout.file_url}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}