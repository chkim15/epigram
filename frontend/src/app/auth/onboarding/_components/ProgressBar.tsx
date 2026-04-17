interface ProgressBarProps {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        <span
          className="text-xs font-medium"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Step {current} of {total}
        </span>
        <span
          className="text-xs font-medium"
          style={{ color: 'var(--muted-foreground)' }}
        >
          {pct}%
        </span>
      </div>
      <div
        className="h-1.5 w-full rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--border)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${pct}%`,
            backgroundColor: 'var(--foreground)',
          }}
        />
      </div>
    </div>
  );
}
