"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function ConfirmPage() {
  const router = useRouter();

  useEffect(() => {
    // Handle the confirmation from the email link
    const handleEmailConfirmation = async () => {
      // Get the hash from the URL (Supabase includes tokens in the hash)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      
      if (accessToken && refreshToken) {
        // Set the session with the tokens from the email confirmation
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (!error) {
          // Successfully confirmed - redirect to signin page
          router.push('/auth/signin?confirmed=true');
        } else {
          // Error confirming email
          router.push('/auth/signin?error=confirmation_failed');
        }
      } else {
        // No tokens in URL, redirect to signin
        router.push('/auth/signin');
      }
    };

    handleEmailConfirmation();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Confirming your email...
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Please wait a moment.
        </p>
      </div>
    </div>
  );
}