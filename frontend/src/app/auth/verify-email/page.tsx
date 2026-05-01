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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#faf9f5' }}>
      <div className="w-full max-w-md">
        <div className="rounded-xl p-8 text-center" style={{ backgroundColor: '#ffffff', border: '1px solid rgb(240,238,230)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h1 className="text-2xl font-semibold mb-4" style={{ color: '#141310' }}>
            Verify your account
          </h1>

          <div className="w-full border-t mb-8" style={{ borderColor: 'rgb(240,238,230)' }}></div>

          <p className="mb-2" style={{ color: '#141310' }}>
            We&apos;ve sent a verification email to your inbox.
          </p>

          <p className="font-medium mb-4" style={{ color: '#a16207' }}>
            Check your inbox or junk folder
          </p>

          <p className="mb-8" style={{ color: '#6b6b6b' }}>
            and click the link to continue.
          </p>

          {userEmail && (
            <p className="text-sm mb-6" style={{ color: '#9b9b9b' }}>
              Email sent to: <span className="font-medium" style={{ color: '#141310' }}>{userEmail}</span>
            </p>
          )}

          <button
            onClick={handleResendEmail}
            disabled={isResending}
            className="w-full py-3 font-medium rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#141310', color: '#faf9f5' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2c2c2c')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#141310')}
          >
            {isResending ? 'Sending...' : 'Resend email'}
          </button>

          {resendMessage && (
            <div
              className="mt-4 p-3 rounded-xl text-sm"
              style={resendMessage.includes('Error')
                ? { backgroundColor: '#fef2f2', color: '#dc2626' }
                : { backgroundColor: '#f0fdf4', color: '#16a34a' }}
            >
              {resendMessage}
            </div>
          )}

          <p className="mt-6 text-sm" style={{ color: '#6b6b6b' }}>
            Already confirmed?{' '}
            <a
              href="/auth/signin"
              className="font-medium hover:underline"
              style={{ color: '#141310' }}
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#faf9f5' }}>
        <p style={{ color: '#6b6b6b' }}>Loading...</p>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
