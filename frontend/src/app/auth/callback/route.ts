import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
        .select('onboarding_completed')
        .eq('user_id', session.user.id)
        .single();

      // If profile doesn't exist, create it (fallback if trigger fails)
      if (!profile) {
        await supabase
          .from('user_profiles')
          .insert({
            user_id: session.user.id,
            onboarding_completed: false
          });
        // Always redirect new users to onboarding
        return NextResponse.redirect(new URL('/auth/onboarding', requestUrl.origin));
      }

      // If onboarding not completed, redirect to onboarding
      if (!profile.onboarding_completed) {
        return NextResponse.redirect(new URL('/auth/onboarding', requestUrl.origin));
      }
      
      // Only redirect to app if onboarding is complete
      return NextResponse.redirect(new URL('/app', requestUrl.origin));
    }
    
    // If there was an error with the session, redirect to signin
    return NextResponse.redirect(new URL('/auth/signin?error=auth_failed', requestUrl.origin));
  }

  // No code provided, redirect to signin
  return NextResponse.redirect(new URL('/auth/signin', requestUrl.origin));
}