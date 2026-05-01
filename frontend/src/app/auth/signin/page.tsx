"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { auth } from '@/lib/auth/client';
import { supabase } from '@/lib/supabase/client';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, signInWithGoogle, isLoading, checkAuth, user } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check auth state on mount and redirect if authenticated
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Listen for auth state changes (for OAuth callbacks)
  useEffect(() => {
    const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Re-check auth to update the store
        checkAuth();
      }
    });

    return () => subscription.unsubscribe();
  }, [checkAuth]);

  // Redirect authenticated users appropriately
  useEffect(() => {
    async function handleAuthenticatedUser() {
      if (user) {
        // Check if user has completed onboarding
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('onboarding_completed')
          .eq('user_id', user.id)
          .single();

        if (!profile || !profile.onboarding_completed) {
          // Redirect to onboarding if not completed
          router.push('/auth/onboarding');
        } else {
          // Only redirect to app if onboarding is complete
          router.push('/problems');
        }
      }
    }
    
    handleAuthenticatedUser();
  }, [user, router]);

  useEffect(() => {
    // Check for confirmation success or error from query params
    if (searchParams.get('confirmed') === 'true') {
      setSuccessMessage('Email confirmed successfully! You can now sign in.');
    } else if (searchParams.get('error') === 'confirmation_failed') {
      setError('Email confirmation failed. Please try again or contact support.');
    }
  }, [searchParams]);

  useEffect(() => {
    // Parse Supabase errors passed as hash fragments (e.g. expired email links)
    const hash = window.location.hash;
    if (!hash) return;
    const params = new URLSearchParams(hash.slice(1));
    const errorCode = params.get('error_code');
    const errorDescription = params.get('error_description');
    if (errorCode === 'otp_expired') {
      setError('Your email confirmation link has expired. Please sign up again or request a new confirmation email.');
    } else if (errorDescription) {
      setError(errorDescription.replace(/\+/g, ' '));
    }
    // Clear the hash so it doesn't persist on refresh
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }, []);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message);
    } else {
      router.push('/problems');
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message);
    }
  };

  if (isLoading || user) {
    return <div className="min-h-screen" style={{ backgroundColor: '#faf9f5' }} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#faf9f5' }}>
      <div className="w-full max-w-md">
        <div className="rounded-xl p-8" style={{ backgroundColor: '#ffffff', border: '1px solid rgb(240,238,230)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          {/* Welcome text */}
          <h1 className="text-2xl font-semibold text-center mb-2" style={{ color: '#141310' }}>
            Welcome to Epigram
          </h1>
          <p className="text-center mb-8" style={{ color: '#6b6b6b' }}>
            Sign in to continue.
          </p>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ border: '1px solid rgb(240,238,230)', backgroundColor: '#ffffff' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#faf9f5')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#ffffff')}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="font-medium" style={{ color: '#141310' }}>
              Continue with Google
            </span>
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: 'rgb(240,238,230)' }}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4" style={{ backgroundColor: '#ffffff', color: '#9b9b9b' }}>
                or continue with
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141310] focus:border-transparent"
                style={{ border: '1px solid rgb(240,238,230)', backgroundColor: '#ffffff', color: '#141310' }}
                disabled={isLoading}
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141310] focus:border-transparent"
                style={{ border: '1px solid rgb(240,238,230)', backgroundColor: '#ffffff', color: '#141310' }}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: '#9b9b9b' }}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Forgot password */}
            <div className="text-right">
              <Link
                href="/auth/forgot-password"
                className="text-sm hover:underline"
                style={{ color: '#6b6b6b' }}
              >
                Forgot password?
              </Link>
            </div>

            {/* Success message */}
            {successMessage && (
              <div className="p-3 rounded-xl text-sm" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                {successMessage}
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="p-3 rounded-xl text-sm" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
                {error}
              </div>
            )}

            {/* Sign In button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 font-medium rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#141310', color: '#faf9f5' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2c2c2c')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#141310')}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Sign up link */}
          <p className="mt-6 text-center" style={{ color: '#6b6b6b' }}>
            Don&apos;t have an account?{' '}
            <Link
              href="/auth/signup"
              className="font-medium hover:underline"
              style={{ color: '#141310' }}
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SignInForm />
    </Suspense>
  );
}