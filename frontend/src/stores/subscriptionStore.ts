import { create } from 'zustand';
import { UserSubscription, SubscriptionPlan } from '@/types/database';
import { supabase } from '@/lib/supabase/client';

interface SubscriptionState {
  subscription: UserSubscription | null;
  plan: SubscriptionPlan | null;
  isLoading: boolean;
  error: string | null;
  isTeam: boolean;

  // Computed properties
  isPro: boolean;
  isTrial: boolean;
  isFree: boolean;
  hasUsedTrial: boolean;
  canStartTrial: boolean;

  // Actions
  fetchSubscription: () => Promise<void>;
  startCheckout: (planType: 'monthly' | 'six_month', promoCode?: string) => Promise<{ url?: string; error?: string }>;
  cancelSubscription: () => Promise<{ showRetentionOffer: boolean; error?: string }>;
  acceptRetentionDiscount: () => Promise<{ success: boolean; error?: string }>;
  declineRetentionAndCancel: () => Promise<{ success: boolean; error?: string }>;
  restoreSubscription: () => Promise<{ success: boolean; error?: string }>;
  openCustomerPortal: () => Promise<{ url?: string; error?: string }>;
  reset: () => void;
}

// Helper function to get authorization headers
async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('No active session');
  }
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscription: null,
  plan: null,
  isLoading: false,
  error: null,
  isTeam: false,

  // Computed properties (stored explicitly — Zustand's Object.assign flattens JS getters)
  isPro: false,
  isTrial: false,
  isFree: true,
  hasUsedTrial: false,
  canStartTrial: false,

  fetchSubscription: async () => {
    set({ isLoading: true, error: null });
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/subscription/status', { headers });
      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }
      const data = await response.json();
      const isTeam: boolean = data.isTeam ?? false;
      const subscription: UserSubscription | null = data.subscription ?? null;
      const isPro =
        isTeam ||
        ((subscription?.status === 'active' || subscription?.status === 'trialing') &&
          subscription?.plan_id !== 'free');
      const isTrial = subscription?.status === 'trialing' || false;
      const isFree = !subscription || subscription.plan_id === 'free';
      const hasUsedTrial = subscription?.has_used_trial ?? false;
      const canStartTrial = isFree && !hasUsedTrial;
      set({
        subscription,
        plan: data.plan,
        isTeam,
        isPro,
        isTrial,
        isFree,
        hasUsedTrial,
        canStartTrial,
        isLoading: false,
      });
    } catch (error) {
      // Silently fail if user is not logged in - this is expected
      if (error instanceof Error && error.message === 'No active session') {
        set({ isLoading: false });
        return;
      }
      console.error('Error fetching subscription:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch subscription',
        isLoading: false,
      });
    }
  },

  startCheckout: async (planType: 'monthly' | 'six_month', promoCode?: string) => {
    set({ isLoading: true, error: null });
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers,
        body: JSON.stringify({ planType, promoCode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const data = await response.json();
      set({ isLoading: false });
      return { url: data.url };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start checkout';
      set({ error: errorMessage, isLoading: false });
      return { error: errorMessage };
    }
  },

  cancelSubscription: async () => {
    set({ isLoading: true, error: null });
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      const data = await response.json();
      set({ isLoading: false });

      // If retention offer is available, return true to show modal
      if (data.showRetentionOffer) {
        return { showRetentionOffer: true };
      }

      // Otherwise, subscription was canceled
      await get().fetchSubscription();
      return { showRetentionOffer: false };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel subscription';
      set({ error: errorMessage, isLoading: false });
      return { showRetentionOffer: false, error: errorMessage };
    }
  },

  acceptRetentionDiscount: async () => {
    set({ isLoading: true, error: null });
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/subscription/accept-discount', {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to apply discount');
      }

      await get().fetchSubscription();
      set({ isLoading: false });
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to apply discount';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  declineRetentionAndCancel: async () => {
    set({ isLoading: true, error: null });
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers,
        body: JSON.stringify({ declineOffer: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      await get().fetchSubscription();
      set({ isLoading: false });
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel subscription';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  restoreSubscription: async () => {
    set({ isLoading: true, error: null });
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/subscription/restore', {
        method: 'POST',
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        // Return the actual error message from the API
        const errorMessage = data.error || 'Failed to restore subscription';
        set({ error: errorMessage, isLoading: false });
        return { success: false, error: errorMessage };
      }

      await get().fetchSubscription();
      set({ isLoading: false });
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to restore subscription';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  openCustomerPortal: async () => {
    set({ isLoading: true, error: null });
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/subscription/portal', {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to open customer portal');
      }

      const data = await response.json();
      set({ isLoading: false });
      return { url: data.url };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to open customer portal';
      set({ error: errorMessage, isLoading: false });
      return { error: errorMessage };
    }
  },

  reset: () => {
    set({
      subscription: null,
      plan: null,
      isLoading: false,
      error: null,
      isTeam: false,
      isPro: false,
      isTrial: false,
      isFree: true,
      hasUsedTrial: false,
      canStartTrial: false,
    });
  },
}));
