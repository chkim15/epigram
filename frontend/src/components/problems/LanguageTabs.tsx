"use client";

import { LOCALES, type LocaleCode } from "@/lib/translations";
import { cn } from "@/lib/utils";

interface LanguageTabsProps {
  locale: LocaleCode;
  onChange: (locale: LocaleCode) => void;
  /** Shown under the tabs when the chosen language has no translation for this problem yet. */
  missing?: boolean;
  loading?: boolean;
}

export default function LanguageTabs({ locale, onChange, missing, loading }: LanguageTabsProps) {
  return (
    <div className="flex flex-col gap-1">
      <div role="tablist" aria-label="Problem language" className="inline-flex w-fit items-center gap-1 rounded-xl p-[3px]" style={{ backgroundColor: 'var(--sidebar-accent)' }}>
        {LOCALES.map((l) => {
          const active = l.code === locale;
          return (
            <button
              key={l.code}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => onChange(l.code)}
              lang={l.code}
              className={cn(
                "cursor-pointer rounded-lg px-3 py-1 text-xs font-medium transition-colors",
                active ? "bg-[#141310] text-white" : "hover:bg-black/5",
              )}
              style={active ? undefined : { color: 'var(--foreground)' }}
            >
              {l.label}
            </button>
          );
        })}
      </div>
      {locale !== 'en' && (missing || loading) && (
        <span className="text-xs" style={{ color: '#a16207' }}>
          {loading ? 'Loading translation…' : 'No translation for this problem yet. Showing English.'}
        </span>
      )}
    </div>
  );
}
