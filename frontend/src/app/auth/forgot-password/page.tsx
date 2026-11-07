"use client";

import { useState } from 'react';
import Link from 'next/link';
import { auth } from '@/lib/auth/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    const { error } = await auth.resetPassword(trimmed);
    setIsSubmitting(false);

    if (error) {
      console.error('Password reset request failed:', error.code, error.message);
    }

    // Only the per-IP request limit applies whether or not the account exists, so it is the
    // only rate limit safe to show. Email-sending limits (the 60-second per-account cooldown and
    // the project-wide hourly email cap, both code over_email_send_rate_limit) are only hit for
    // real accounts, so surfacing them would reveal that the email is registered.
    if (error?.code === 'over_request_rate_limit') {
      setError('Too many requests. Please wait a few minutes and try again.');
      return;
    }

    // Always show the same message so the page does not reveal whether an account exists.
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--background)' }}>
      <div className="w-full max-w-md">
        <div className="rounded-xl p-8" style={{ backgroundColor: 'var(--input)', border: '1px solid var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h1 className="text-2xl font-semibold text-center mb-2" style={{ color: 'var(--foreground)' }}>
            Reset your password
          </h1>
          <p className="text-center mb-8" style={{ color: 'var(--muted-foreground)' }}>
            {submitted
              ? 'Check your inbox for the next step.'
              : 'Enter your email and we’ll send you a link to reset your password.'}
          </p>

          {submitted ? (
            <div className="space-y-4">
              <div className="p-3 rounded-xl text-sm" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                If an account exists for <strong>{email.trim()}</strong>, we&apos;ve sent a link to reset your password.
                The link expires after a short time, so use it soon. Don&apos;t forget to check your spam folder.
                If you&apos;ve just requested a link, wait a minute before requesting another.
              </div>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="w-full py-3 font-medium rounded-xl transition-opacity cursor-pointer hover:opacity-80"
                style={{ border: '1px solid var(--border)', backgroundColor: 'var(--input)', color: 'var(--foreground)' }}
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--foreground)] focus:border-transparent"
                style={{ border: '1px solid var(--border)', backgroundColor: 'var(--input)', color: 'var(--foreground)' }}
                disabled={isSubmitting}
                autoFocus
              />

              {error && (
                <div className="p-3 rounded-xl text-sm" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 font-medium rounded-xl transition-opacity cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--foreground)', color: 'var(--background)' }}
              >
                {isSubmitting ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          )}

          <p className="mt-6 text-center" style={{ color: 'var(--muted-foreground)' }}>
            Remembered it?{' '}
            <Link
              href="/auth/signin"
              className="font-medium hover:underline cursor-pointer"
              style={{ color: 'var(--foreground)' }}
            >
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
