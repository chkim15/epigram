'use client';

import { useEffect, useState, ReactNode, cloneElement, isValidElement } from 'react';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { useAuthStore } from '@/stores/authStore';
import { FeatureType } from '@/types/database';
import UpgradeModal from './UpgradeModal';

interface ProGateProps {
  children: ReactNode;
  feature: FeatureType;
  fallback?: ReactNode;
  onBlocked?: () => void;
}

export default function ProGate({ children, feature, fallback, onBlocked }: ProGateProps) {
  const { user } = useAuthStore();
  const { isPro, usage, fetchSubscription, fetchUsage, checkFeatureAccess, trackUsage } = useSubscriptionStore();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  const [blockReason, setBlockReason] = useState<string>('');

  useEffect(() => {
    if (user) {
      fetchSubscription();
      fetchUsage();
    }
  }, [user, fetchSubscription, fetchUsage]);

  useEffect(() => {
    async function checkAccess() {
      if (!user) {
        setIsAllowed(false);
        setBlockReason('Please sign in to access this feature');
        return;
      }

      const result = await checkFeatureAccess(feature);
      setIsAllowed(result.allowed);
      if (!result.allowed) {
        setBlockReason(result.reason || 'Access denied');
        if (onBlocked) {
          onBlocked();
        }
      }
    }

    checkAccess();
  }, [user, feature, isPro, usage, checkFeatureAccess, onBlocked]);

  const handleInterceptedClick = async (e: React.MouseEvent, originalOnClick?: (e: React.MouseEvent) => void) => {
    e.preventDefault();
    e.stopPropagation();

    // If user not logged in, show upgrade modal
    if (!user) {
      setShowUpgradeModal(true);
      return;
    }

    // If Pro user, allow immediately
    if (isPro) {
      if (originalOnClick) {
        originalOnClick(e);
      }
      return;
    }

    // For free users, check and track usage
    const accessCheck = await checkFeatureAccess(feature);
    if (!accessCheck.allowed) {
      setShowUpgradeModal(true);
      return;
    }

    // Track usage BEFORE executing the action
    const trackResult = await trackUsage(feature);
    if (!trackResult.success) {
      setShowUpgradeModal(true);
      return;
    }

    // Refresh usage to update UI
    await fetchUsage();

    // Finally, execute the original action
    if (originalOnClick) {
      originalOnClick(e);
    }
  };

  // Loading state
  if (isAllowed === null) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm" style={{ color: '#141310' }}>Loading...</div>
      </div>
    );
  }

  // Blocked state
  if (!isAllowed) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <>
        <div
          className="flex flex-col items-center justify-center p-8 rounded-xl border"
          style={{
            backgroundColor: '#faf9f5',
            borderColor: 'rgb(240,238,230)',
          }}
        >
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold mb-2" style={{ color: '#141310' }}>
              {isPro ? 'Feature Unavailable' : 'Upgrade to Pro'}
            </h3>
            <p className="text-sm" style={{ color: '#141310', opacity: 0.7 }}>
              {blockReason}
            </p>
          </div>
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="px-6 py-2 rounded-xl font-medium cursor-pointer"
            style={{
              backgroundColor: '#141310',
              color: '#ffffff',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            Start 7-Day Free Trial
          </button>
        </div>

        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          reason={blockReason}
        />
      </>
    );
  }

  // Allowed - intercept click on the child element
  if (isValidElement(children)) {
    const originalOnClick = (children.props as { onClick?: (e: React.MouseEvent) => void }).onClick;

    return (
      <>
        {cloneElement(children as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>, {
          onClick: (e: React.MouseEvent) => handleInterceptedClick(e, originalOnClick),
        })}

        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          reason={blockReason}
        />
      </>
    );
  }

  return <>{children}</>;
}
