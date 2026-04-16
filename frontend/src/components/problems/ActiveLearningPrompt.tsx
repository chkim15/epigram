import { Lock } from 'lucide-react';

interface ActiveLearningPromptProps {
  onScrollToAnswer?: () => void;
  problemKey?: string;
}

export default function ActiveLearningPrompt({}: ActiveLearningPromptProps) {

  return (
    <div className="h-full flex items-center justify-center p-8" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-md w-full">
        <div className="text-center space-y-6">
          <div className="relative inline-block">
            <div className="rounded-full p-6" style={{ backgroundColor: 'var(--secondary)' }}>
              <Lock className="h-12 w-12" style={{ color: 'var(--muted-foreground)' }} />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
              Try it first
            </h3>

            <div className="text-center" style={{ color: 'var(--muted-foreground)' }}>
              <p className="text-base">
                Attempting before reading the answer is one of the most effective ways to retain new material.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Stuck? Ask the AI Tutor for a nudge — then rate yourself to unlock.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}