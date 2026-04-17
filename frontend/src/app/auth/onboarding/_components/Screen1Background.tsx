import { BACKGROUND_OPTIONS, type Background } from '@/lib/onboarding/options';
import OptionCard from './OptionCard';

interface Screen1Props {
  value: Background | '';
  onChange: (value: Background) => void;
}

export default function Screen1Background({ value, onChange }: Screen1Props) {
  return (
    <div>
      <h2
        className="text-xl font-semibold mb-1"
        style={{ color: 'var(--foreground)' }}
      >
        What&apos;s your background?
      </h2>
      <p
        className="text-sm mb-6"
        style={{ color: 'var(--muted-foreground)' }}
      >
        Helps us calibrate problem difficulty and pacing.
      </p>
      <div className="space-y-2">
        {BACKGROUND_OPTIONS.map((opt) => (
          <OptionCard
            key={opt.value}
            label={opt.label}
            selected={value === opt.value}
            onClick={() => onChange(opt.value)}
          />
        ))}
      </div>
    </div>
  );
}
