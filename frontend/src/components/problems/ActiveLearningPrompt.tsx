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
              Solution Locked
            </h3>

            <div className="text-center" style={{ color: 'var(--muted-foreground)' }}>
              <p className="text-base">
                Take a moment to solve this problem on your own!<br />
                Active learning helps you retain knowledge better.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--card)', borderColor: '#a16207' }}>
              <p className="text-sm" style={{ color: '#a16207' }}>
                <span className="font-medium">Active Learning Mode is ON</span>
                <br />
                Submit your answer to unlock the solution.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              💡 Still struggling? Ask your questions to AI Tutor!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}