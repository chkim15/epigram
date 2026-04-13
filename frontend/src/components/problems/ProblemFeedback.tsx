'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';

interface ProblemFeedbackProps {
  userId: string;
  problemId: string;
}

type Step = 1 | 2 | 3 | 'done';

const QUESTIONS: Record<1 | 2 | 3, { label: string; options: { label: string; value: string }[] }> = {
  1: {
    label: 'How was the difficulty?',
    options: [
      { label: 'Too easy', value: 'too_easy' },
      { label: 'About right', value: 'about_right' },
      { label: 'Too hard', value: 'too_hard' },
    ],
  },
  2: {
    label: 'Seen this in a real interview?',
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' },
    ],
  },
  3: {
    label: 'Was the solution clear?',
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'Somewhat', value: 'somewhat' },
      { label: 'No', value: 'no' },
    ],
  },
};

export default function ProblemFeedback({ userId, problemId }: ProblemFeedbackProps) {
  const [step, setStep] = useState<Step | null>(null);
  const [showFirmInput, setShowFirmInput] = useState(false);
  const [firmText, setFirmText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  const firmInputRef = useRef<HTMLInputElement>(null);
  const thankYouTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setStep(null);
      setShowFirmInput(false);
      setFirmText('');
      if (thankYouTimerRef.current) clearTimeout(thankYouTimerRef.current);

      await supabase
        .from('user_problem_feedback')
        .upsert(
          { user_id: userId, problem_id: problemId },
          { onConflict: 'user_id,problem_id', ignoreDuplicates: true }
        );

      if (!cancelled) setStep(1);
    }

    init();
    return () => {
      cancelled = true;
      if (thankYouTimerRef.current) clearTimeout(thankYouTimerRef.current);
    };
  }, [userId, problemId]);

  useEffect(() => {
    if (showFirmInput && firmInputRef.current) {
      firmInputRef.current.focus();
    }
  }, [showFirmInput]);

  async function save(patch: Record<string, string | null>) {
    setIsSaving(true);
    await supabase
      .from('user_problem_feedback')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('problem_id', problemId);
    setIsSaving(false);
  }

  async function handleQ1(value: string) {
    if (isSaving) return;
    await save({ difficulty: value });
    setStep(2);
  }

  async function handleQ2(value: string) {
    if (isSaving) return;
    if (value === 'yes') {
      await save({ interview_seen: 'yes' });
      setShowFirmInput(true);
    } else {
      await save({ interview_seen: value, interview_firm: null });
      setStep(3);
    }
  }

  async function advanceFromFirm() {
    if (isSaving) return;
    await save({ interview_firm: firmText.trim() || null });
    setShowFirmInput(false);
    setStep(3);
  }

  async function handleQ3(value: string) {
    if (isSaving) return;
    await save({ solution_clear: value });
    setFirmText('');
    setStep('done');
    thankYouTimerRef.current = setTimeout(() => setStep(1), 2000);
  }

  if (step === null) return null;

  return (
    <div
      style={{
        borderTop: '1px solid var(--border)',
        backgroundColor: 'var(--background)',
        padding: '10px 16px 12px',
        flexShrink: 0,
      }}
    >
      {step === 'done' ? (
        <span style={{ color: 'var(--muted-foreground)', fontSize: '13px' }}>
          Thank you for your feedback!
        </span>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ color: 'var(--foreground)', fontSize: '13px', fontWeight: 500 }}>
              {QUESTIONS[step].label}
            </span>
            <span style={{ color: 'var(--muted-foreground)', fontSize: '11px' }}>
              {step} / 3
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
            {QUESTIONS[step].options.map((opt) => {
              const isHovered = hoveredOption === opt.value;
              return (
                <button
                  key={opt.value}
                  disabled={isSaving}
                  onClick={() => {
                    if (step === 1) handleQ1(opt.value);
                    else if (step === 2) handleQ2(opt.value);
                    else handleQ3(opt.value);
                  }}
                  onMouseEnter={() => setHoveredOption(opt.value)}
                  onMouseLeave={() => setHoveredOption(null)}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: '999px',
                    padding: '4px 12px',
                    fontSize: '12px',
                    cursor: isSaving ? 'default' : 'pointer',
                    backgroundColor: isHovered ? 'var(--foreground)' : 'var(--background)',
                    color: isHovered ? 'var(--background)' : 'var(--foreground)',
                    transition: 'background-color 0.1s, color 0.1s',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}

            {step === 2 && showFirmInput && (
              <input
                ref={firmInputRef}
                type="text"
                value={firmText}
                onChange={(e) => setFirmText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') advanceFromFirm();
                }}
                onBlur={advanceFromFirm}
                placeholder="e.g. Jane Street, Citadel..."
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                  outline: 'none',
                  width: '200px',
                }}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
