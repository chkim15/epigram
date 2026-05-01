import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWelcomeEmail } from '@/lib/emails/sendWelcomeEmail';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, full_name, user_id } = await request.json() as {
      email: string;
      full_name?: string;
      user_id?: string;
    };

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Atomically claim the flag before sending: only one concurrent request will get a returned row.
    if (user_id) {
      const { data: claimed } = await supabaseAdmin
        .from('user_profiles')
        .update({ welcome_email_sent: true })
        .eq('user_id', user_id)
        .eq('welcome_email_sent', false)
        .select('user_id');

      if (!claimed || claimed.length === 0) {
        return NextResponse.json({ ok: true, skipped: true });
      }
    }

    try {
      await sendWelcomeEmail(email, full_name);
    } catch (err) {
      // Roll back the claim so the user can retry on a later sign-in
      if (user_id) {
        await supabaseAdmin
          .from('user_profiles')
          .update({ welcome_email_sent: false })
          .eq('user_id', user_id);
      }
      throw err;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    console.error('Welcome email error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
