'use client';

import { useEffect, useState, ReactNode } from 'react';
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

  const handleUseFeature = async () => {
    if (isPro) {
      return; // Pro users don't need tracking
    }

    const result = await trackUsage(feature);
    if (!result.success) {
      setIsAllowed(false);
      setShowUpgradeModal(true);
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

  // Allowed - render children with usage tracking
  return (
    <div onClick={handleUseFeature}>
      {children}
    </div>
  );
}
