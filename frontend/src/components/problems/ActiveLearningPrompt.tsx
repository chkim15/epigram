import { Lock } from 'lucide-react';

interface ActiveLearningPromptProps {
  onScrollToAnswer?: () => void;
  problemKey?: string;
}

export default function ActiveLearningPrompt({ onScrollToAnswer, problemKey = 'main' }: ActiveLearningPromptProps) {

  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <div className="text-center space-y-6">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl rounded-full" />
            <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-full p-6">
              <Lock className="h-12 w-12 text-gray-600 dark:text-gray-400" />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Solution Locked
            </h3>
            
            <div className="text-center text-gray-600 dark:text-gray-400">
              <p className="text-base">
                Take a moment to solve this problem on your own!<br />
                Active learning helps you retain knowledge better.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <span className="font-medium">Active Learning Mode is ON</span>
                <br />
                Submit your answer to unlock the solution.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              💡 Still struggling? Ask your questions to AI Tutor!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}