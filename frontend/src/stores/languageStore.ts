import { create } from 'zustand';
import { isLocaleCode, type LocaleCode } from '@/lib/translations';

const STORAGE_KEY = 'epigram-problem-locale';

interface LanguageStore {
  locale: LocaleCode;
  setLocale: (locale: LocaleCode) => void;
  /** Read the saved choice once on the client (kept out of the initial state to avoid hydration mismatches). */
  hydrate: () => void;
}

export const useLanguageStore = create<LanguageStore>((set) => ({
  locale: 'en',
  setLocale: (locale) => {
    set({ locale });
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* storage can be blocked; the choice then lasts for this visit only */
    }
  },
  hydrate: () => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (isLocaleCode(saved)) set({ locale: saved });
    } catch {
      /* ignore */
    }
  },
}));
