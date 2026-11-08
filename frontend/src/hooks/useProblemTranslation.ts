"use client";

import { useEffect, useState } from "react";
import { useLanguageStore } from "@/stores/languageStore";
import { fetchProblemTranslation, type ProblemTranslation } from "@/lib/translations";
import type { LocaleCode } from "@/lib/translations";

/**
 * The stored translation of one problem in the language chosen on the problem's language tabs.
 * `tr` is null while loading, in English, or when no translation exists, so callers fall back to the English text.
 */
export function useProblemTranslation(problemId: string | undefined): {
  tr: ProblemTranslation | null;
  loading: boolean;
  locale: LocaleCode;
} {
  const locale = useLanguageStore((s) => s.locale);
  const [translation, setTranslation] = useState<ProblemTranslation | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!problemId || locale === 'en') {
      setTranslation(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchProblemTranslation(problemId, locale).then((row) => {
      if (cancelled) return;
      setTranslation(row);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [problemId, locale]);

  // Never show a translation of another problem or another language (e.g. while the next one loads).
  const tr =
    locale !== 'en' && translation && translation.problem_id === problemId && translation.locale === locale
      ? translation
      : null;
  return { tr, loading, locale };
}
