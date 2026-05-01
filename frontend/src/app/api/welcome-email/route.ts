import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/emails/sendWelcomeEmail';

export async function POST(request: NextRequest) {
  try {
    const { email, full_name } = await request.json() as { email: string; full_name?: string };

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await sendWelcomeEmail(email, full_name);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    console.error('Welcome email error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
