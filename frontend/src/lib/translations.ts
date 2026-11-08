import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

export const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'zh-CN', label: '简体中文' },
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'ko', label: '한국어' },
] as const;

export type LocaleCode = (typeof LOCALES)[number]['code'];

export const isLocaleCode = (v: unknown): v is LocaleCode =>
  typeof v === 'string' && LOCALES.some((l) => l.code === v);

interface TranslatedHint {
  hint_order?: number | null;
  hint_text?: string | null;
}

interface TranslatedSubproblem {
  problem_text?: string | null;
  hint?: string | null;
  hints?: TranslatedHint[];
}

/** One row of public.problem_translations (only the fields the problem viewer shows). */
export interface ProblemTranslation {
  problem_id: string;
  locale: string;
  problem_name: string | null;
  problem_text: string | null;
  hint: string | null;
  hints: TranslatedHint[];
  subproblems: Record<string, TranslatedSubproblem>;
}

// The table is newer than the generated Database types, so use an untyped client for it.
const untyped = supabase as unknown as SupabaseClient;

const cache = new Map<string, ProblemTranslation | null>();

/**
 * Fetch the stored translation of one problem. Resolves to null when there is none, or when the
 * table is not available yet, so the viewer falls back to English instead of breaking.
 */
export async function fetchProblemTranslation(
  problemId: string,
  locale: LocaleCode,
): Promise<ProblemTranslation | null> {
  if (locale === 'en') return null;
  const key = `${problemId}:${locale}`;
  if (cache.has(key)) return cache.get(key) ?? null;
  try {
    const { data, error } = await untyped
      .from('problem_translations')
      .select('problem_id, locale, problem_name, problem_text, hint, hints, subproblems')
      .eq('problem_id', problemId)
      .eq('locale', locale)
      .maybeSingle();
    if (error) throw error;
    const row = (data as ProblemTranslation | null) ?? null;
    cache.set(key, row);
    return row;
  } catch (err) {
    console.warn('Translation not available:', err);
    return null;
  }
}

/** Hint text for the i-th hint (hints are ordered by hint_order in both English and translation). */
export function translatedHint(list: TranslatedHint[] | undefined, index: number, fallback: string): string {
  return list?.[index]?.hint_text?.trim() ? (list[index].hint_text as string) : fallback;
}
