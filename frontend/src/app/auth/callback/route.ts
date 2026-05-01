import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWelcomeEmail } from '@/lib/emails/sendWelcomeEmail';

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

      // Fallback: create profile if the trigger somehow didn't
      if (!profile) {
        await supabase
          .from('user_profiles')
          .insert({
            user_id: session.user.id,
            onboarding_completed: false,
          });
      }

      // Send welcome email once per user (idempotent via welcome_email_sent flag)
      if (!profile?.welcome_email_sent) {
        try {
          await sendWelcomeEmail(
            session.user.email!,
            session.user.user_metadata?.full_name
          );
          await supabase
            .from('user_profiles')
            .update({ welcome_email_sent: true })
            .eq('user_id', session.user.id);
        } catch (err) {
          console.error('Welcome email failed:', err);
        }
      }

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