import { FIRM_OPTIONS, type FirmSlug } from '@/lib/onboarding/options';
import { Check } from 'lucide-react';

interface Screen2Props {
  selected: FirmSlug[];
  onToggle: (firm: FirmSlug) => void;
  otherText: string;
  onOtherTextChange: (text: string) => void;
}

export default function Screen2Firms({
  selected,
  onToggle,
  otherText,
  onOtherTextChange,
}: Screen2Props) {
  const otherFundsSelected = selected.includes('other_funds');

  return (
    <div>
      <h2
        className="text-xl font-semibold mb-1"
        style={{ color: 'var(--foreground)' }}
      >
        Which firms are you preparing for?
      </h2>
      <p
        className="text-sm mb-4"
        style={{ color: 'var(--muted-foreground)' }}
      >
        Select all that apply.
      </p>
      <div className="space-y-1.5">
        {FIRM_OPTIONS.map((firm) => {
          const isSelected = selected.includes(firm.value);
          const showOtherInput =
            firm.value === 'other_funds' && otherFundsSelected;
          return (
            <div key={firm.value}>
              <button
                type="button"
                onClick={() => onToggle(firm.value)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg border-2 transition-all cursor-pointer text-left"
                style={{
                  borderColor: isSelected
                    ? 'var(--foreground)'
                    : 'var(--border)',
                  backgroundColor: isSelected ? 'var(--accent)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = 'var(--muted-foreground)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }
                }}
              >
                <div
                  className="flex-shrink-0 flex items-center justify-center"
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 4,
                    border: `2px solid ${
                      isSelected ? 'var(--foreground)' : 'var(--muted-foreground)'
                    }`,
                    backgroundColor: isSelected
                      ? 'var(--foreground)'
                      : 'transparent',
                  }}
                >
                  {isSelected && (
                    <Check
                      className="w-3 h-3"
                      style={{ color: 'var(--background)' }}
                    />
                  )}
                </div>
                <span
                  className="text-sm"
                  style={{ color: 'var(--foreground)' }}
                >
                  {firm.label}
                </span>
              </button>
              {showOtherInput && (
                <input
                  type="text"
                  value={otherText}
                  onChange={(e) => onOtherTextChange(e.target.value)}
                  placeholder="Which ones?"
                  className="mt-1.5 w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border)',
                    color: '#141310',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
