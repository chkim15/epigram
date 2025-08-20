"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    // Get email from query params if available
    const email = searchParams.get('email');
    if (email) {
      setUserEmail(email);
    }
  }, [searchParams]);

  const handleResendEmail = async () => {
    if (!userEmail) {
      setResendMessage('Please provide an email address');
      return;
    }

    setIsResending(true);
    setResendMessage(null);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
      });

      if (error) {
        setResendMessage(`Error: ${error.message}`);
      } else {
        setResendMessage('Verification email sent! Please check your inbox.');
      }
    } catch {
      setResendMessage('Failed to resend email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
          {/* Title */}
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Verify your account
          </h1>
          
          {/* Subtitle */}
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Do not close this tab.
          </p>

          {/* Divider */}
          <div className="w-full border-t border-gray-200 dark:border-gray-700 mb-8"></div>

          {/* Main message */}
          <p className="text-gray-700 dark:text-gray-300 mb-2">
            We&apos;ve sent a verification email to your inbox.
          </p>

          {/* Check inbox message */}
          <p className="text-red-500 font-medium mb-4">
            Check your inbox or junk folder
          </p>

          {/* Additional instruction */}
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            and click the link to continue.
          </p>

          {/* Display user email if available */}
          {userEmail && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Email sent to: <span className="font-medium">{userEmail}</span>
            </p>
          )}

          {/* Resend button */}
          <button
            onClick={handleResendEmail}
            disabled={isResending}
            className="w-full py-3 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResending ? 'Sending...' : 'Resend email'}
          </button>

          {/* Resend message */}
          {resendMessage && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              resendMessage.includes('Error') 
                ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' 
                : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
            }`}>
              {resendMessage}
            </div>
          )}

          {/* Sign in link */}
          <p className="mt-6 text-sm text-gray-600 dark:text-gray-400">
            Already confirmed?{' '}
            <a
              href="/auth/signin"
              className="text-gray-900 dark:text-white font-medium hover:underline"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Loading...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please wait a moment.
          </p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}