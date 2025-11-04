import { create } from 'zustand';
import { UserSubscription, SubscriptionPlan, FeatureType } from '@/types/database';
import { supabase } from '@/lib/supabase/client';

interface UsageLimits {
  personalized_practice: number;
  mock_exam: number;
  ai_tutor: number;
}

interface SubscriptionState {
  subscription: UserSubscription | null;
  plan: SubscriptionPlan | null;
  usage: UsageLimits;
  isLoading: boolean;
  error: string | null;

  // Computed properties
  isPro: boolean;
  isTrial: boolean;
  isFree: boolean;
  hasUsedTrial: boolean;
  canStartTrial: boolean;

  // Actions
  fetchSubscription: () => Promise<void>;
  fetchUsage: () => Promise<void>;
  checkFeatureAccess: (feature: FeatureType) => Promise<{ allowed: boolean; reason?: string }>;
  trackUsage: (feature: FeatureType) => Promise<{ success: boolean; remaining: number }>;
  startCheckout: (planType: 'weekly' | 'monthly' | 'yearly') => Promise<{ url?: string; error?: string }>;
  cancelSubscription: () => Promise<{ showRetentionOffer: boolean; error?: string }>;
  acceptRetentionDiscount: () => Promise<{ success: boolean; error?: string }>;
  declineRetentionAndCancel: () => Promise<{ success: boolean; error?: string }>;
  restoreSubscription: () => Promise<{ success: boolean; error?: string }>;
  openCustomerPortal: () => Promise<{ url?: string; error?: string }>;
  reset: () => void;
}

const FREE_TIER_LIMITS = {
  personalized_practice: 3,
  mock_exam: 3,
  ai_tutor: 3,
};

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
  usage: {
    personalized_practice: 0,
    mock_exam: 0,
    ai_tutor: 0,
  },
  isLoading: false,
  error: null,

  // Computed properties
  get isPro() {
    const { subscription } = get();
    return subscription?.status === 'active' || subscription?.status === 'trialing';
  },

  get isTrial() {
    const { subscription } = get();
    return subscription?.status === 'trialing';
  },

  get isFree() {
    const { subscription } = get();
    return !subscription || subscription.plan_id === 'free';
  },

  get hasUsedTrial() {
    const { subscription } = get();
    return subscription?.has_used_trial || false;
  },

  get canStartTrial() {
    const { hasUsedTrial, isFree } = get();
    return isFree && !hasUsedTrial;
  },

  fetchSubscription: async () => {
    set({ isLoading: true, error: null });
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/subscription/status', { headers });
      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }
      const data = await response.json();
      set({
        subscription: data.subscription,
        plan: data.plan,
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

  fetchUsage: async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/usage/check', { headers });
      if (!response.ok) {
        throw new Error('Failed to fetch usage');
      }
      const data = await response.json();
      set({
        usage: {
          personalized_practice: data.personalized_practice || 0,
          mock_exam: data.mock_exam || 0,
          ai_tutor: data.ai_tutor || 0,
        },
      });
    } catch (error) {
      // Silently fail if user is not logged in - this is expected
      if (error instanceof Error && error.message === 'No active session') {
        return;
      }
      console.error('Error fetching usage:', error);
    }
  },

  checkFeatureAccess: async (feature: FeatureType) => {
    const { isPro, usage } = get();

    // Pro users have unlimited access
    if (isPro) {
      return { allowed: true };
    }

    // Free users check usage limits
    const currentUsage = usage[feature];
    const limit = FREE_TIER_LIMITS[feature];

    if (currentUsage >= limit) {
      return {
        allowed: false,
        reason: `You've reached the free tier limit of ${limit} ${feature.replace('_', ' ')} attempts. Upgrade to Pro for unlimited access.`,
      };
    }

    return { allowed: true };
  },

  trackUsage: async (feature: FeatureType) => {
    const { isPro } = get();

    // Pro users don't need tracking
    if (isPro) {
      return { success: true, remaining: -1 }; // -1 indicates unlimited
    }

    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/usage/track', {
        method: 'POST',
        headers,
        body: JSON.stringify({ feature }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to track usage:', response.status, errorData);
        return { success: false, remaining: 0 };
      }

      const data = await response.json();

      // Update local usage state
      set((state) => ({
        usage: {
          ...state.usage,
          [feature]: data.usage_count,
        },
      }));

      return {
        success: true,
        remaining: FREE_TIER_LIMITS[feature] - data.usage_count,
      };
    } catch (error) {
      console.error('Error tracking usage:', error);
      return { success: false, remaining: 0 };
    }
  },

  startCheckout: async (planType: 'weekly' | 'monthly' | 'yearly') => {
    set({ isLoading: true, error: null });
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers,
        body: JSON.stringify({ planType }),
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
      usage: {
        personalized_practice: 0,
        mock_exam: 0,
        ai_tutor: 0,
      },
      isLoading: false,
      error: null,
    });
  },
}));
