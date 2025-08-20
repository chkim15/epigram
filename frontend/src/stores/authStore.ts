import { create } from 'zustand';
import { User, AuthError } from '@supabase/supabase-js';
import { auth } from '@/lib/auth/client';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | { message: string; code: string } | null }>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
  deleteAccount: () => Promise<{ error: { message: string } | null }>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({ 
    user, 
    isAuthenticated: !!user,
    isLoading: false 
  }),

  setLoading: (loading) => set({ isLoading: loading }),

  signIn: async (email, password) => {
    set({ isLoading: true });
    const { data, error } = await auth.signInWithEmail(email, password);
    if (!error && data.user) {
      set({ user: data.user, isAuthenticated: true });
    }
    set({ isLoading: false });
    return { error };
  },

  signInWithGoogle: async () => {
    set({ isLoading: true });
    const { error } = await auth.signInWithGoogle();
    set({ isLoading: false });
    return { error };
  },

  signUp: async (email, password, fullName) => {
    set({ isLoading: true });
    const { data, error } = await auth.signUpWithEmail(email, password, fullName);
    if (!error && data && data.user) {
      set({ user: data.user, isAuthenticated: true });
    }
    set({ isLoading: false });
    return { error };
  },

  signOut: async () => {
    set({ isLoading: true });
    await auth.signOut();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    const { user } = await auth.getUser();
    set({ 
      user, 
      isAuthenticated: !!user,
      isLoading: false 
    });
  },

  deleteAccount: async () => {
    set({ isLoading: true });
    const { error } = await auth.deleteAccount();
    if (!error) {
      // Clear user state after successful deletion
      set({ user: null, isAuthenticated: false });
    }
    set({ isLoading: false });
    return { error };
  },
}));