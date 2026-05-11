import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getPostHogClient } from '@/lib/posthog-server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && session) {
      // Check if user has completed onboarding
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('onboarding_completed, welcome_email_sent')
        .eq('user_id', session.user.id)
        .single();

      // Determine new vs returning user from auth.users.created_at, which is set
      // atomically when Supabase creates the row on first OAuth signup. Using the
      // profile row's existence is racy because the DB trigger that creates the
      // profile can fire before this handler runs.
      const createdAtMs = session.user.created_at
        ? new Date(session.user.created_at).getTime()
        : 0;
      const isNewUser = createdAtMs > 0 && Date.now() - createdAtMs < 60_000;

      // Fallback: create profile if the trigger somehow didn't
      if (!profile) {
        await supabase
          .from('user_profiles')
          .insert({
            user_id: session.user.id,
            onboarding_completed: false,
          });
      }

      // Identify user and capture auth event in PostHog (server-side)
      try {
        const posthog = getPostHogClient();
        posthog.identify({
          distinctId: session.user.id,
          properties: {
            email: session.user.email,
          },
        });
        posthog.capture({
          distinctId: session.user.id,
          event: isNewUser ? 'user_signed_up' : 'user_signed_in',
          properties: { method: 'google' },
        });
      } catch (e) {
        console.error('PostHog capture failed in auth callback:', e);
      }

      // Welcome email is triggered from the onboarding page (handles both PKCE and implicit OAuth flows).

      // If onboarding not completed, redirect to onboarding
      if (!profile?.onboarding_completed) {
        return NextResponse.redirect(new URL('/auth/onboarding', requestUrl.origin));
      }

      // Only redirect to app if onboarding is complete
      return NextResponse.redirect(new URL('/problems', requestUrl.origin));
    }
    
    // If there was an error with the session, redirect to signin
    return NextResponse.redirect(new URL('/auth/signin?error=auth_failed', requestUrl.origin));
  }

  // No code provided, redirect to signin
  return NextResponse.redirect(new URL('/auth/signin', requestUrl.origin));
}