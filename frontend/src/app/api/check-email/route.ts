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
      // Supabase returns different error messages for existing vs non-existing users
      // "Invalid login credentials" can mean either:
      // 1. User exists but password is wrong
      // 2. User doesn't exist at all
      // We need to check for more specific error indicators
      
      // These errors specifically indicate the email EXISTS
      if (
        error.message.includes('Email not confirmed') ||
        error.message.includes('email requires confirmation') ||
        error.message.includes('email needs to be confirmed')
      ) {
        // Email exists but not confirmed yet
        return NextResponse.json({ 
          exists: true,
          message: 'An account with this email already exists but is not confirmed.'
        });
      }
      
      // For "Invalid login credentials", we can't definitively know
      // So we should return false to allow signup to proceed
      // Supabase will handle the actual duplicate check during signup
      return NextResponse.json({ 
        exists: false,
        message: 'Email check completed.'
      });
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