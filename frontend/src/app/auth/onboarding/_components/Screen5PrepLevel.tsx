import { PREP_LEVEL_OPTIONS, type PrepLevel } from '@/lib/onboarding/options';
import OptionCard from './OptionCard';

interface Screen5Props {
  value: PrepLevel | '';
  onChange: (value: PrepLevel) => void;
}

export default function Screen5PrepLevel({ value, onChange }: Screen5Props) {
  return (
    <div>
      <h2
        className="text-xl font-semibold mb-6"
        style={{ color: 'var(--foreground)' }}
      >
        How would you rate your current preparation?
      </h2>
      <div className="space-y-2">
        {PREP_LEVEL_OPTIONS.map((opt) => (
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
