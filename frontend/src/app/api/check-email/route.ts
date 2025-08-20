import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Create server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Try to sign in with a dummy password to check if email exists
    // This is a safe way to check email existence without exposing user data
    const { error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password: 'dummy-check-password-12345', // This will always fail
    });

    if (error) {
      // Check the specific error messages that indicate the email exists
      if (
        error.message.includes('Invalid login credentials') || 
        error.message.includes('Email not confirmed') ||
        error.message.includes('not confirmed') ||
        error.message.includes('Invalid email or password')
      ) {
        // Email exists (either not confirmed or wrong password)
        return NextResponse.json({ 
          exists: true,
          message: 'An account with this email already exists.'
        });
      } else {
        // Email doesn't exist (user not found or similar error)
        return NextResponse.json({ 
          exists: false,
          message: 'Email is available.'
        });
      }
    }

    // If no error (very unlikely with dummy password), email exists
    return NextResponse.json({ 
      exists: true,
      message: 'An account with this email already exists.'
    });

  } catch (error) {
    console.error('Error checking email:', error);
    return NextResponse.json(
      { error: 'Failed to check email', exists: false },
      { status: 500 }
    );
  }
}