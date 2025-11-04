'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useSubscriptionStore } from '@/stores/subscriptionStore';

export default function SubscriptionTab() {
  const {
    subscription,
    plan,
    usage,
    isTrial,
    canStartTrial,
    fetchSubscription,
    fetchUsage,
    startCheckout,
    cancelSubscription,
    acceptRetentionDiscount,
    declineRetentionAndCancel,
    restoreSubscription,
    openCustomerPortal,
    isLoading,
  } = useSubscriptionStore();

  const [showRetentionModal, setShowRetentionModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    fetchSubscription();
    fetchUsage();
  }, [fetchSubscription, fetchUsage]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getStatusBadge = () => {
    if (!subscription || subscription.plan_id === 'free') {
      return (
        <span
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: '#f5f4ee', color: '#141310' }}
        >
          <AlertCircle size={12} />
          Free
        </span>
      );
    }

    if (subscription.status === 'trialing') {
      return (
        <span
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: '#a16207', color: '#ffffff' }}
        >
          <Clock size={12} />
          Trial
        </span>
      );
    }

    if (subscription.status === 'active') {
      return (
        <span
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: '#141310', color: '#ffffff' }}
        >
          <CheckCircle size={12} />
          Active
        </span>
      );
    }

    if (subscription.status === 'past_due') {
      return (
        <span
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
        >
          <XCircle size={12} />
          Past Due
        </span>
      );
    }

    return (
      <span
        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
        style={{ backgroundColor: '#f5f4ee', color: '#141310' }}
      >
        {subscription.status}
      </span>
    );
  };

  const handleStartTrial = async () => {
    const result = await startCheckout(selectedPlan);
    if (result.url) {
      window.location.href = result.url;
    }
  };

  const handleCancelSubscription = async () => {
    const result = await cancelSubscription();
    if (result.showRetentionOffer) {
      setShowRetentionModal(true);
    }
  };

  const handleAcceptDiscount = async () => {
    // Apply discount and then redirect to Stripe portal
    await acceptRetentionDiscount();
    setShowRetentionModal(false);

    // Redirect to Stripe portal after a short delay to ensure discount is applied
    setTimeout(async () => {
      const result = await openCustomerPortal();
      if (result.url) {
        window.open(result.url, '_blank');
      }
    }, 500);
  };

  const handleDeclineAndCancel = async () => {
    await declineRetentionAndCancel();
    setShowRetentionModal(false);
  };

  const handleOpenPortal = async () => {
    const result = await openCustomerPortal();
    if (result.url) {
      window.open(result.url, '_blank');
    }
  };

  const handleRestoreSubscription = async () => {
    // Prevent double-clicks
    if (isRestoring) {
      console.log('Already restoring, please wait...');
      return;
    }

    console.log('Attempting to restore subscription...');
    setIsRestoring(true);

    try {
      const result = await restoreSubscription();
      console.log('Restore result:', result);

      if (result.success) {
        // Successfully restored via API
        console.log('Subscription restored successfully, fetching updated data...');
        await fetchSubscription();
      } else {
        // If API restore fails for any reason, open Stripe portal
        // where user can reactivate or manage their subscription
        console.log('Restore failed, opening Stripe portal...', result.error);
        const portalResult = await openCustomerPortal();
        if (portalResult.url) {
          window.open(portalResult.url, '_blank');
        }
      }
    } catch (error) {
      console.error('Error in handleRestoreSubscription:', error);
      // As a fallback, try to open the portal
      const portalResult = await openCustomerPortal();
      if (portalResult.url) {
        window.open(portalResult.url, '_blank');
      }
    } finally {
      setIsRestoring(false);
    }
  };

  // Free tier user
  if (!subscription || subscription.plan_id === 'free') {
    return (
      <div className="space-y-6">
        {/* Current Plan */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold" style={{ color: '#141310' }}>
              Current Plan
            </h3>
            {getStatusBadge()}
          </div>
          <div
            className="p-4 rounded-xl border"
            style={{ backgroundColor: '#ffffff', borderColor: 'rgb(240,238,230)' }}
          >
            <p className="text-sm mb-4" style={{ color: '#141310' }}>
              You&apos;re currently on the <strong>Free</strong> plan.
            </p>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm" style={{ color: '#141310', opacity: 0.7 }}>
                <span>•</span>
                <span>Access to first 3 topics</span>
              </div>
              <div className="flex items-center gap-2 text-sm" style={{ color: '#141310', opacity: 0.7 }}>
                <span>•</span>
                <span>{usage.personalized_practice}/3 personalized practice attempts used</span>
              </div>
              <div className="flex items-center gap-2 text-sm" style={{ color: '#141310', opacity: 0.7 }}>
                <span>•</span>
                <span>{usage.mock_exam}/3 mock exam attempts used</span>
              </div>
              <div className="flex items-center gap-2 text-sm" style={{ color: '#141310', opacity: 0.7 }}>
                <span>•</span>
                <span>{usage.ai_tutor}/3 AI tutor problems used</span>
              </div>
            </div>
          </div>
        </div>

        {/* Upgrade Options */}
        {canStartTrial && (
          <div>
            <h3 className="text-base font-semibold mb-4" style={{ color: '#141310' }}>
              Start Your Free Trial
            </h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { id: 'weekly' as const, name: 'Weekly', price: '$4.99/week', popular: true },
                { id: 'monthly' as const, name: 'Monthly', price: '$14.99/month', savings: 'Save 25%' },
                { id: 'yearly' as const, name: 'Yearly', price: '$99.99/year', savings: 'Save 62%' },
              ].map((planOption) => (
                <div
                  key={planOption.id}
                  onClick={() => setSelectedPlan(planOption.id)}
                  className="relative p-3 rounded-xl border-2 cursor-pointer transition-all"
                  style={{
                    backgroundColor: selectedPlan === planOption.id ? '#ffffff' : '#faf9f5',
                    borderColor: selectedPlan === planOption.id ? '#141310' : 'rgb(240,238,230)',
                  }}
                >
                  {planOption.popular && (
                    <div
                      className="absolute -top-2 left-1/2 transform -translate-x-1/2 px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                      style={{ backgroundColor: '#141310', color: '#ffffff', fontSize: '10px' }}
                    >
                      Popular
                    </div>
                  )}
                  {planOption.savings && (
                    <div
                      className="absolute -top-2 left-1/2 transform -translate-x-1/2 px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                      style={{ backgroundColor: '#a16207', color: '#ffffff', fontSize: '10px' }}
                    >
                      {planOption.savings}
                    </div>
                  )}
                  <div className="text-center mt-2">
                    <div className="text-xs font-medium mb-1" style={{ color: '#141310' }}>
                      {planOption.name}
                    </div>
                    <div className="text-sm font-semibold" style={{ color: '#141310' }}>
                      {planOption.price}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={handleStartTrial}
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-medium cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: '#141310', color: '#ffffff' }}
              onMouseEnter={(e) => !isLoading && (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => !isLoading && (e.currentTarget.style.opacity = '1')}
            >
              {isLoading ? 'Processing...' : 'Start 7-Day Free Trial'}
            </button>
            <p className="text-xs text-center mt-2" style={{ color: '#141310', opacity: 0.6 }}>
              No charge for 7 days. Cancel anytime.
            </p>
          </div>
        )}

        {!canStartTrial && (
          <div
            className="p-4 rounded-xl border"
            style={{ backgroundColor: '#faf9f5', borderColor: '#a16207' }}
          >
            <p className="text-sm" style={{ color: '#141310' }}>
              You&apos;ve already used your free trial. Upgrade to Pro to unlock all features.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Pro user (active subscription)
  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold" style={{ color: '#141310' }}>
            Current Plan
          </h3>
          {getStatusBadge()}
        </div>
        <div
          className="p-4 rounded-xl border"
          style={{ backgroundColor: '#ffffff', borderColor: 'rgb(240,238,230)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold" style={{ color: '#141310' }}>
              {plan?.name || 'Pro Weekly'}
            </span>
            <span className="text-lg font-bold" style={{ color: '#141310' }}>
              {plan?.price_cents ? formatPrice(plan.price_cents) : '$4.99'}
              <span className="text-sm font-normal" style={{ opacity: 0.6 }}>
                /{plan?.billing_interval || 'week'}
              </span>
            </span>
          </div>
          {isTrial && subscription.trial_end && (
            <div className="flex items-center gap-2 mb-3 p-2 rounded" style={{ backgroundColor: '#fef3c7' }}>
              <Clock size={14} style={{ color: '#a16207' }} />
              <span className="text-xs" style={{ color: '#141310' }}>
                Trial ends {formatDate(subscription.trial_end)}
              </span>
            </div>
          )}
          {subscription.cancel_at_period_end && (
            <div className="mb-3 p-2 rounded" style={{ backgroundColor: '#fee2e2' }}>
              <span className="text-xs" style={{ color: '#141310' }}>
                {subscription.current_period_end ? `Subscription will cancel on ${formatDate(subscription.current_period_end)}` : 'Subscription is canceled'}
              </span>
            </div>
          )}
        </div>
      </div>


      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={handleOpenPortal}
          disabled={isLoading}
          className="w-full py-3 rounded-xl border font-medium cursor-pointer disabled:opacity-50"
          style={{
            backgroundColor: '#faf9f5',
            borderColor: 'rgb(240,238,230)',
            color: '#141310',
          }}
          onMouseEnter={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#f5f4ee')}
          onMouseLeave={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#faf9f5')}
        >
          Manage Payment Method
        </button>

        {subscription.cancel_at_period_end ? (
          <button
            onClick={handleRestoreSubscription}
            disabled={isRestoring || isLoading}
            className="w-full py-3 rounded-xl font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: '#141310',
              color: '#ffffff',
            }}
            onMouseEnter={(e) => !isRestoring && !isLoading && (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => !isRestoring && !isLoading && (e.currentTarget.style.opacity = '1')}
          >
            {isRestoring ? 'Restoring...' : 'Restore Subscription'}
          </button>
        ) : (
          <button
            onClick={handleCancelSubscription}
            disabled={isLoading}
            className="w-full py-3 rounded-xl font-medium cursor-pointer disabled:opacity-50"
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #dc2626',
              color: '#dc2626',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#dc2626';
                e.currentTarget.style.color = '#ffffff';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.color = '#dc2626';
              }
            }}
          >
            {isLoading ? 'Processing...' : 'Cancel Subscription'}
          </button>
        )}
      </div>

      {/* Retention Modal */}
      {showRetentionModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(20, 19, 16, 0.5)', backdropFilter: 'blur(8px)' }}
        >
          <div
            className="relative w-full max-w-md p-6 rounded-xl"
            style={{ backgroundColor: '#faf9f5' }}
          >
            <h3 className="text-xl font-bold mb-2" style={{ color: '#141310' }}>
              Wait! Special Offer
            </h3>
            <p className="text-sm mb-4" style={{ color: '#141310' }}>
              We&apos;d hate to see you go. How about <strong>50% off</strong> for{' '}
              {plan?.billing_interval === 'week' ? 'the next 2 weeks' : `the next ${plan?.billing_interval}`}?
            </p>
            <div className="space-y-3">
              <button
                onClick={handleAcceptDiscount}
                disabled={isLoading}
                className="w-full py-3 rounded-xl font-medium cursor-pointer"
                style={{ backgroundColor: '#141310', color: '#ffffff' }}
              >
                Accept 50% Discount
              </button>
              <button
                onClick={handleDeclineAndCancel}
                disabled={isLoading}
                className="w-full py-3 rounded-xl font-medium cursor-pointer"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid rgb(240,238,230)',
                  color: '#141310',
                }}
              >
                No Thanks, Cancel Subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
