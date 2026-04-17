import { Check } from 'lucide-react';

interface OptionCardProps {
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  type?: 'radio' | 'checkbox';
}

export default function OptionCard({
  label,
  description,
  selected,
  onClick,
  type = 'radio',
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer text-left"
      style={{
        borderColor: selected ? 'var(--foreground)' : 'var(--border)',
        backgroundColor: selected ? 'var(--accent)' : 'transparent',
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = 'var(--muted-foreground)';
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = 'var(--border)';
        }
      }}
    >
      <div
        className="flex-shrink-0 flex items-center justify-center"
        style={{
          width: 20,
          height: 20,
          borderRadius: type === 'radio' ? '50%' : 6,
          border: `2px solid ${
            selected ? 'var(--foreground)' : 'var(--muted-foreground)'
          }`,
          backgroundColor: selected ? 'var(--foreground)' : 'transparent',
        }}
      >
        {selected && type === 'radio' && (
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'var(--background)',
            }}
          />
        )}
        {selected && type === 'checkbox' && (
          <Check className="w-3 h-3" style={{ color: 'var(--background)' }} />
        )}
      </div>
      <div className="flex-1">
        <div
          className="text-sm font-medium"
          style={{ color: 'var(--foreground)' }}
        >
          {label}
        </div>
        {description && (
          <div
            className="text-xs mt-0.5"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {description}
          </div>
        )}
      </div>
    </button>
  );
}
