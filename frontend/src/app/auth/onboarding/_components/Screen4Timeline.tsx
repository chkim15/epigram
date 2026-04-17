import { TIMELINE_OPTIONS, type Timeline } from '@/lib/onboarding/options';
import OptionCard from './OptionCard';

interface Screen4Props {
  value: Timeline | '';
  onChange: (value: Timeline) => void;
}

export default function Screen4Timeline({ value, onChange }: Screen4Props) {
  return (
    <div>
      <h2
        className="text-xl font-semibold mb-1"
        style={{ color: 'var(--foreground)' }}
      >
        How long do you have to prepare?
      </h2>
      <p
        className="text-sm mb-6"
        style={{ color: 'var(--muted-foreground)' }}
      >
        We build a plan that fits your timeline.
      </p>
      <div className="space-y-2">
        {TIMELINE_OPTIONS.map((opt) => (
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
