'use client';

import React, { useEffect, useState } from 'react';
import { useProblemStore } from '@/stores/problemStore';
import { supabase } from '@/lib/supabase/client';
import PDFViewerSimple from '@/components/pdf/PDFViewerSimple';
import { FileText, AlertCircle } from 'lucide-react';

interface TopicNotesViewerProps {
  problemId: string | null;
}

export function TopicNotesViewer({ problemId }: TopicNotesViewerProps) {
  const { currentProblemTopics, currentTopicNotes, setCurrentProblemTopics, setCurrentTopicNotes } = useProblemStore();
  const [activeTopicIndex, setActiveTopicIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch topics and notes when problem changes
  useEffect(() => {
    if (!problemId) {
      setCurrentProblemTopics([]);
      setCurrentTopicNotes([]);
      return;
    }

    const fetchTopicsAndNotes = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // First, get all topic IDs for this problem
        const { data: problemTopics, error: topicsError } = await supabase
          .from('problem_topics')
          .select('topic_id')
          .eq('problem_id', problemId);
        
        if (topicsError) throw topicsError;
        
        if (!problemTopics || problemTopics.length === 0) {
          setCurrentProblemTopics([]);
          setCurrentTopicNotes([]);
          return;
        }
        
        const topicIds = problemTopics.map(pt => pt.topic_id);
        
        // Fetch topic details
        const { data: topics, error: topicDetailsError } = await supabase
          .from('topics')
          .select('*')
          .in('id', topicIds)
          .order('id');
        
        if (topicDetailsError) throw topicDetailsError;
        
        // Fetch notes URLs for these topics
        const { data: notes, error: notesError } = await supabase
          .from('topic_notes')
          .select('topic_id, file_url')
          .in('topic_id', topicIds);
        
        if (notesError) throw notesError;
        
        // Combine topic info with notes URLs
        const topicNotes = topics?.map(topic => {
          const noteRecord = notes?.find(n => n.topic_id === topic.id);
          let fileUrl = noteRecord?.file_url;
          
          // If no URL in database, construct it based on expected pattern
          if (!fileUrl && topic.id <= 41) {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            if (supabaseUrl) {
              // Map topic IDs to exact file names as they appear in your folder
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
              
              const fileName = fileNameMap[topic.id];
              if (fileName) {
                fileUrl = `${supabaseUrl}/storage/v1/object/public/pdf-notes/topics/${fileName}`;
              }
            }
          }
          
          return {
            topic_id: topic.id,
            topic_name: topic.subtopics || `Topic ${topic.id}`,
            file_url: fileUrl
          };
        }) || [];
        
        setCurrentProblemTopics(topics || []);
        setCurrentTopicNotes(topicNotes);
        setActiveTopicIndex(0); // Reset to first topic
        
      } catch (err) {
        console.error('Error fetching topics and notes:', err);
        setError('Failed to load topic notes');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopicsAndNotes();
  }, [problemId, setCurrentProblemTopics, setCurrentTopicNotes]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading notes...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-2">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <div className="text-gray-700">{error}</div>
      </div>
    );
  }

  // No problem selected
  if (!problemId) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-3">
        <FileText className="h-12 w-12 text-gray-400" />
        <div className="text-gray-500">Select a problem to view notes</div>
      </div>
    );
  }

  // No topics for this problem
  if (currentTopicNotes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-3">
        <FileText className="h-12 w-12 text-gray-400" />
        <div className="text-gray-500">No topic notes available for this problem</div>
      </div>
    );
  }

  // Single topic - show PDF directly
  if (currentTopicNotes.length === 1) {
    const note = currentTopicNotes[0];
    
    if (!note.file_url) {
      return (
        <div className="flex flex-col items-center justify-center h-full space-y-3">
          <FileText className="h-12 w-12 text-gray-400" />
          <div className="text-gray-500">Notes not yet uploaded for {note.topic_name}</div>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {note.topic_name}
          </h3>
        </div>
        <div className="flex-1 min-h-0">
          <PDFViewerSimple 
            pdfUrl={note.file_url}
            className="h-full"
          />
        </div>
      </div>
    );
  }

  // Multiple topics - show with sub-tabs
  const activeNote = currentTopicNotes[activeTopicIndex];

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tabs for multiple topics */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex overflow-x-auto custom-scrollbar">
          {currentTopicNotes.map((note, index) => (
            <button
              key={note.topic_id}
              onClick={() => setActiveTopicIndex(index)}
              className={`
                px-4 py-2 text-sm font-medium whitespace-nowrap
                border-b-2 transition-colors cursor-pointer
                ${index === activeTopicIndex
                  ? 'border-black dark:border-white text-black dark:text-white'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }
              `}
            >
              {note.topic_name.length > 30 
                ? note.topic_name.substring(0, 30) + '...' 
                : note.topic_name}
            </button>
          ))}
        </div>
      </div>

      {/* PDF Viewer for active topic */}
      <div className="flex-1 min-h-0">
        {activeNote?.file_url ? (
          <PDFViewerSimple 
            pdfUrl={activeNote.file_url}
            className="h-full"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full space-y-3">
            <FileText className="h-12 w-12 text-gray-400" />
            <div className="text-gray-500">
              Notes not yet uploaded for {activeNote?.topic_name}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}