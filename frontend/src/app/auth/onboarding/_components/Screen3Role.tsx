import { ROLE_OPTIONS, type RoleType } from '@/lib/onboarding/options';
import OptionCard from './OptionCard';

interface Screen3Props {
  value: RoleType | '';
  onChange: (value: RoleType) => void;
}

export default function Screen3Role({ value, onChange }: Screen3Props) {
  return (
    <div>
      <h2
        className="text-xl font-semibold mb-1"
        style={{ color: 'var(--foreground)' }}
      >
        What kind of role are you targeting?
      </h2>
      <p
        className="text-sm mb-6"
        style={{ color: 'var(--muted-foreground)' }}
      >
        We tailor problem selection to the role.
      </p>
      <div className="space-y-2">
        {ROLE_OPTIONS.map((opt) => (
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
