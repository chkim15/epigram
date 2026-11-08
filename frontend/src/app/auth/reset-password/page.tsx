"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Keep in sync with the signup page's minimum password length.
const MIN_PASSWORD_LENGTH = 6;

type LinkState = 'checking' | 'ready' | 'invalid';

// What the recovery email link gave us. It is held in memory only and used once, on submit.
type RecoveryCredentials =
  | { kind: 'tokens'; accessToken: string; refreshToken: string }
  | { kind: 'token_hash'; tokenHash: string };

/**
 * A Supabase client that never stores a session and never reads the URL.
 *
 * This page deliberately does NOT import the app's shared client (@/lib/supabase/client):
 * that client has detectSessionInUrl on, so it would pick up the recovery tokens from the
 * link and save them, signing the user in to their account just by clicking the email,
 * even if they never set a new password. With this client the recovery session exists only
 * in this tab's memory, is used to change the password, and is then revoked.
 */
function createRecoveryClient(): SupabaseClient {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: 'epigram-password-recovery',
    },
  });
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [linkState, setLinkState] = useState<LinkState>('checking');
  const [linkError, setLinkError] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const credentialsRef = useRef<RecoveryCredentials | null>(null);
  const clientRef = useRef<SupabaseClient | null>(null);
  const sessionReadyRef = useRef(false);

  const showInvalid = (message?: string) => {
    setLinkError(message ?? null);
    setLinkState('invalid');
  };

  // Read the recovery link. Supabase can deliver it two ways:
  //  1. Default email template: Supabase verifies the link itself and redirects here with
  //     tokens in the URL hash (#access_token=...&refresh_token=...&type=recovery).
  //  2. Custom template (recommended): ?token_hash=...&type=recovery, verified only when the
  //     user submits the form, so nothing is consumed by just opening (or prefetching) the link.
  useEffect(() => {
    // The URL is cleared below, so a second run (e.g. React Strict Mode) must not re-read it.
    if (credentialsRef.current) return;
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const queryParams = new URLSearchParams(window.location.search);
    // Strip tokens from the address bar and browser history straight away.
    if (window.location.hash || window.location.search) {
      window.history.replaceState(null, '', window.location.pathname);
    }

    // Expired or already-used links come back as error params in the hash or query.
    const errorCode = hashParams.get('error_code') || queryParams.get('error_code');
    const errorDescription = hashParams.get('error_description') || queryParams.get('error_description');
    if (errorCode || errorDescription) {
      showInvalid(
        errorCode === 'otp_expired'
          ? 'This reset link has expired or has already been used.'
          : errorDescription?.replace(/\+/g, ' ')
      );
      return;
    }

    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    if (accessToken && refreshToken && hashParams.get('type') === 'recovery') {
      const expiresAt = Number(hashParams.get('expires_at'));
      if (expiresAt && expiresAt * 1000 < Date.now()) {
        showInvalid('This reset link has expired.');
        return;
      }
      credentialsRef.current = { kind: 'tokens', accessToken, refreshToken };
      setLinkState('ready');
      return;
    }

    const tokenHash = queryParams.get('token_hash');
    if (tokenHash && queryParams.get('type') === 'recovery') {
      credentialsRef.current = { kind: 'token_hash', tokenHash };
      setLinkState('ready');
      return;
    }

    showInvalid();
  }, []);

  // Turn the link credentials into an in-memory session (once; a token_hash is single-use).
  const establishRecoverySession = async (client: SupabaseClient): Promise<boolean> => {
    if (sessionReadyRef.current) return true;
    const credentials = credentialsRef.current;
    if (!credentials) return false;

    const { error } =
      credentials.kind === 'tokens'
        ? await client.auth.setSession({
            access_token: credentials.accessToken,
            refresh_token: credentials.refreshToken,
          })
        : await client.auth.verifyOtp({ type: 'recovery', token_hash: credentials.tokenHash });

    if (error) {
      console.error('Recovery link could not be verified:', error.message);
      return false;
    }
    sessionReadyRef.current = true;
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    const client = (clientRef.current ??= createRecoveryClient());

    if (!(await establishRecoverySession(client))) {
      setIsSubmitting(false);
      showInvalid('This reset link has expired or has already been used.');
      return;
    }

    const { error } = await client.auth.updateUser({ password });
    if (error) {
      setIsSubmitting(false);
      // Recovery session missing, expired or revoked: send the user back to request a new link.
      const sessionCodes = ['bad_jwt', 'session_not_found', 'session_expired', 'refresh_token_not_found'];
      if (
        error.name === 'AuthSessionMissingError' ||
        error.status === 401 ||
        error.status === 403 ||
        (error.code && sessionCodes.includes(error.code))
      ) {
        showInvalid('Your reset session has expired.');
        return;
      }
      setError(
        error.code === 'same_password'
          ? 'Your new password must be different from your old password.'
          : error.code === 'weak_password'
            ? error.message
            : 'Something went wrong updating your password. Please try again.'
      );
      console.error('Password update failed:', error.message);
      return;
    }

    // Revoke the recovery session and every other session for this account, so anyone who
    // was signed in with the old password is signed out too. The user then signs in fresh.
    await client.auth.signOut({ scope: 'global' });
    credentialsRef.current = null;
    router.push('/auth/signin?reset=success');
  };

  const inputClass =
    'w-full px-4 py-3 pr-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--foreground)] focus:border-transparent';
  const inputStyle = { border: '1px solid var(--border)', backgroundColor: 'var(--input)', color: 'var(--foreground)' };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--background)' }}>
      <div className="w-full max-w-md">
        <div className="rounded-xl p-8" style={{ backgroundColor: 'var(--input)', border: '1px solid var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h1 className="text-2xl font-semibold text-center mb-2" style={{ color: 'var(--foreground)' }}>
            {linkState === 'invalid' ? 'Link not valid' : 'Set a new password'}
          </h1>

          {linkState === 'checking' && (
            <p className="text-center" style={{ color: 'var(--muted-foreground)' }}>
              Verifying your reset link...
            </p>
          )}

          {linkState === 'invalid' && (
            <>
              <p className="text-center mb-6" style={{ color: 'var(--muted-foreground)' }}>
                {linkError ?? 'This reset link is invalid or has expired.'} Please request a new one.
              </p>
              <Link
                href="/auth/forgot-password"
                className="block w-full py-3 text-center font-medium rounded-xl transition-opacity cursor-pointer hover:opacity-90"
                style={{ backgroundColor: 'var(--foreground)', color: 'var(--background)' }}
              >
                Request a new link
              </Link>
            </>
          )}

          {linkState === 'ready' && (
            <>
              <p className="text-center mb-8" style={{ color: 'var(--muted-foreground)' }}>
                Choose a password with at least {MIN_PASSWORD_LENGTH} characters.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="New password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                    style={inputStyle}
                    disabled={isSubmitting}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                    style={{ color: 'var(--muted-foreground)' }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                  disabled={isSubmitting}
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
                  {isSubmitting ? 'Updating...' : 'Update password'}
                </button>
              </form>
            </>
          )}

          <p className="mt-6 text-center" style={{ color: 'var(--muted-foreground)' }}>
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
