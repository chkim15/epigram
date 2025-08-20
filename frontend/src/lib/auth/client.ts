import { supabase } from '@/lib/supabase/client';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

export const auth = {
  // Sign in with email and password
  async signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Check if email already exists
  async checkEmailExists(email: string) {
    try {
      const response = await fetch('/api/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      return {
        exists: result.exists || false,
        message: result.message || '',
      };
    } catch (error) {
      console.error('Error checking email:', error);
      // If check fails, allow signup to proceed (fail open)
      return { exists: false, message: '' };
    }
  },

  // Sign up with email and password
  async signUpWithEmail(email: string, password: string, fullName?: string) {
    // First check if email already exists
    const emailCheck = await this.checkEmailExists(email);
    if (emailCheck.exists) {
      return { 
        data: null, 
        error: { 
          message: 'An account with this email already exists. Please try signing in instead.',
          code: 'email_already_exists'
        } 
      };
    }

    // Proceed with signup if email doesn't exist
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
        data: {
          full_name: fullName,
        },
      },
    });
    
    return { data, error };
  },

  // Sign in with Google OAuth
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current user
  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  // Get current session
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  // Reset password
  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { data, error };
  },

  // Update password
  async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { data, error };
  },

  // Delete user account
  async deleteAccount() {
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { error: { message: 'No active session' } };
      }

      // Call our API endpoint to delete the account
      const response = await fetch('/api/delete-account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        return { error: { message: result.error || 'Failed to delete account' } };
      }

      return { error: null };
    } catch (error) {
      return { error: { message: 'Failed to delete account' } };
    }
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};