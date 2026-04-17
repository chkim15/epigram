'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';

interface ProblemFeedbackProps {
  userId: string;
  problemId: string;
}

type Step = 1 | 2 | 3 | 'done';

const COMPANIES = [
  'Jane Street', 'Citadel', 'Citadel Securities', 'Two Sigma', 'DE Shaw', 'Virtu Financial',
  'Five Rings Capital', 'Optiver', 'IMC Trading', 'Flow Traders', 'Akuna Capital',
  'SIG (Susquehanna International Group)', 'DRW', 'Jump Trading', 'Hudson River Trading',
  'Tower Research Capital', 'Belvedere Trading', 'Tibra Capital', 'Maven Securities',
  'Qube Research & Technologies (QRT)', 'XTX Markets',
  'Renaissance Technologies', 'Millennium Management', 'Point72', 'Bridgewater Associates',
  'Man AHL', 'Winton Group', 'WorldQuant', 'PDT Partners', 'TGS Management',
  'Squarepoint Capital', 'Balyasny Asset Management',
  'ExodusPoint Capital', 'Cubist Systematic Strategies',
  'Goldman Sachs', 'Morgan Stanley', 'JP Morgan', 'Barclays', 'Citi',
  'Deutsche Bank', 'BNP Paribas', 'UBS', 'HSBC',
  'Alphatrai', 'Allston Trading', 'Vatic Investments', 'Old Mission Capital',
  'Geneva Trading', 'Peak6', 'Spot Trading', 'GTS (Global Trading Systems)',
  'Quantlab', 'Transmarket Group', 'Headlands Technologies', 'Arrowstreet Capital',
  'Voleon Group', 'Schonfeld Strategic Advisors', 'Coatue Management', 'Tanius Technology',
];

const QUESTIONS: Record<1 | 2 | 3, { label: string; sublabel?: string; options: { label: string; value: string }[] }> = {
  1: {
    label: 'How did you do?',
    sublabel: '— Tap to unlock solution',
    options: [
      { label: 'Got it', value: 'got_it' },
      { label: 'Partial', value: 'partial' },
      { label: 'Stuck', value: 'stuck' },
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
  const [showDropdown, setShowDropdown] = useState(false);
  const [hoveredCompany, setHoveredCompany] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  const firmInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setStep(null);
      setShowFirmInput(false);
      setFirmText('');
      setShowDropdown(false);

      await supabase
        .from('user_problem_feedback')
        .upsert(
          { user_id: userId, problem_id: problemId },
          { onConflict: 'user_id,problem_id', ignoreDuplicates: true }
        );

      if (!cancelled) setStep(1);
    }

    init();
    return () => { cancelled = true; };
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
    await save({ self_assessment: value });
    window.dispatchEvent(new CustomEvent('selfAssessmentAnswered', { detail: { problemId } }));
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

  async function advanceFromFirm(value?: string) {
    if (isSaving) return;
    const firm = (value ?? firmText).trim() || null;
    await save({ interview_firm: firm });
    setShowDropdown(false);
    setShowFirmInput(false);
    setFirmText('');
    setStep(3);
  }

  async function handleQ3(value: string) {
    if (isSaving) return;
    await save({ solution_clear: value });
    setFirmText('');
    setStep('done');
  }

  const filteredCompanies = COMPANIES.filter(c =>
    firmText === '' || c.toLowerCase().includes(firmText.toLowerCase())
  );

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
            {QUESTIONS[step].sublabel && (
              <span style={{ color: 'var(--muted-foreground)', fontSize: '12px' }}>
                {QUESTIONS[step].sublabel}
              </span>
            )}
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
              <div style={{ position: 'relative' }}>
                <input
                  ref={firmInputRef}
                  type="text"
                  value={firmText}
                  placeholder="Search"
                  onChange={(e) => {
                    setFirmText(e.target.value);
                    setShowDropdown(true);
                  }}
                  onClick={() => setShowDropdown(true)}
                  onBlur={() => {
                    setTimeout(() => {
                      setShowDropdown(false);
                      advanceFromFirm();
                    }, 150);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setShowDropdown(false);
                      advanceFromFirm();
                    }
                    if (e.key === 'Escape') {
                      setShowDropdown(false);
                    }
                  }}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    fontSize: '12px',
                    backgroundColor: '#ffffff',
                    color: 'var(--foreground)',
                    outline: 'none',
                    width: '200px',
                  }}
                />
                {showDropdown && filteredCompanies.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      width: '220px',
                      backgroundColor: '#ffffff',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      maxHeight: '160px',
                      overflowY: 'auto',
                      zIndex: 50,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    }}
                  >
                    {filteredCompanies.map((company) => (
                      <div
                        key={company}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setFirmText(company);
                          setShowDropdown(false);
                          advanceFromFirm(company);
                        }}
                        onMouseEnter={() => setHoveredCompany(company)}
                        onMouseLeave={() => setHoveredCompany(null)}
                        style={{
                          padding: '6px 10px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          backgroundColor: hoveredCompany === company ? 'var(--secondary)' : '#ffffff',
                          color: 'var(--foreground)',
                        }}
                      >
                        {company}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
