"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase/client";

export function useAuthGuard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading, checkAuth } = useAuthStore();
  const [showCheckoutSuccess, setShowCheckoutSuccess] = useState(false);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Handle successful checkout - refetch subscription status
  useEffect(() => {
    const checkout = searchParams.get('checkout');
    if (checkout === 'success') {
      setShowCheckoutSuccess(true);
      setTimeout(() => setShowCheckoutSuccess(false), 10000);

      import('@/stores/subscriptionStore').then(({ useSubscriptionStore }) => {
        const timeouts = [1000, 3000, 5000, 8000];
        timeouts.forEach((delay) => {
          setTimeout(() => {
            useSubscriptionStore.getState().fetchSubscription();
          }, delay);
        });
      });

      // Clear the checkout parameter from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('checkout');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams]);

  // Redirect to signin if not authenticated
  useEffect(() => {
    const isFromCheckout = searchParams.get('checkout') === 'success';

    if (!authLoading && !isAuthenticated && user === null && !isFromCheckout) {
      const timeoutId = setTimeout(() => {
        if (!isAuthenticated && user === null) {
          router.push('/auth/signin');
        }
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [authLoading, isAuthenticated, user, router, searchParams]);

  // Check if authenticated user has completed onboarding
  useEffect(() => {
    async function checkOnboarding() {
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('onboarding_completed')
          .eq('user_id', user.id)
          .single();

        if (!profile || !profile.onboarding_completed) {
          router.push('/auth/onboarding');
        }
      }
    }

    checkOnboarding();
  }, [user, router]);

  const isFromCheckout = searchParams.get('checkout') === 'success';
  const isLoading = authLoading || (isFromCheckout && !user);

  return {
    user,
    isAuthenticated,
    isLoading,
    showCheckoutSuccess,
    setShowCheckoutSuccess,
  };
}
