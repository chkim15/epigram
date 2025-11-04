'use client';

import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { useAuthStore } from '@/stores/authStore';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
}

export default function UpgradeModal({ isOpen, onClose, reason }: UpgradeModalProps) {
  const { user } = useAuthStore();
  const { startCheckout, isLoading, canStartTrial } = useSubscriptionStore();
  const [selectedPlan, setSelectedPlan] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

  if (!isOpen) return null;

  const plans = [
    {
      id: 'weekly' as const,
      name: 'Weekly',
      price: '$4.99',
      period: '/week',
      description: 'Perfect for short-term prep',
    },
    {
      id: 'monthly' as const,
      name: 'Monthly',
      price: '$14.99',
      period: '/month',
      description: 'Most flexible option',
      popular: true,
    },
    {
      id: 'yearly' as const,
      name: 'Yearly',
      price: '$99.99',
      period: '/year',
      description: 'Best value - 2 months free',
      savings: 'Save 44%',
    },
  ];

  const features = [
    'Unlimited access to all problems',
    'Unlimited AI tutoring sessions',
    'Unlimited practice exams',
    'Step-by-step solutions',
    'Priority support',
    'All course materials',
  ];

  const handleUpgrade = async () => {
    if (!user) {
      // Redirect to signup
      window.location.href = '/signup';
      return;
    }

    const result = await startCheckout(selectedPlan);
    if (result.url) {
      window.location.href = result.url;
    } else if (result.error) {
      alert(result.error);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(20, 19, 16, 0.5)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl p-8"
        style={{
          backgroundColor: '#faf9f5',
          borderColor: 'rgb(240,238,230)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg cursor-pointer"
          style={{ color: '#141310' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f4ee'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2" style={{ color: '#141310' }}>
            Upgrade to Pro
          </h2>
          {reason && (
            <p className="text-sm" style={{ color: '#141310', opacity: 0.7 }}>
              {reason}
            </p>
          )}
          {canStartTrial && (
            <div className="mt-2">
              <span
                className="inline-block px-3 py-1 rounded-full text-sm font-medium"
                style={{ backgroundColor: '#a16207', color: '#ffffff' }}
              >
                🎉 Start your 7-day free trial
              </span>
            </div>
          )}
        </div>

        {/* Plan selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className="relative p-6 rounded-xl border-2 cursor-pointer transition-all"
              style={{
                backgroundColor: selectedPlan === plan.id ? '#ffffff' : '#faf9f5',
                borderColor: selectedPlan === plan.id ? '#141310' : 'rgb(240,238,230)',
              }}
            >
              {plan.popular && (
                <div
                  className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: '#141310', color: '#ffffff' }}
                >
                  Most Popular
                </div>
              )}
              {plan.savings && (
                <div
                  className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: '#a16207', color: '#ffffff' }}
                >
                  {plan.savings}
                </div>
              )}
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#141310' }}>
                  {plan.name}
                </h3>
                <div className="mb-2">
                  <span className="text-3xl font-bold" style={{ color: '#141310' }}>
                    {plan.price}
                  </span>
                  <span className="text-sm" style={{ color: '#141310', opacity: 0.6 }}>
                    {plan.period}
                  </span>
                </div>
                <p className="text-sm" style={{ color: '#141310', opacity: 0.7 }}>
                  {plan.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Features list */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#141310' }}>
            Everything in Pro:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-2">
                <div
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#141310' }}
                >
                  <Check size={14} style={{ color: '#ffffff' }} />
                </div>
                <span className="text-sm" style={{ color: '#141310' }}>
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA button */}
        <button
          onClick={handleUpgrade}
          disabled={isLoading}
          className="w-full py-4 rounded-xl font-semibold text-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: '#141310',
            color: '#ffffff',
          }}
          onMouseEnter={(e) => !isLoading && (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={(e) => !isLoading && (e.currentTarget.style.opacity = '1')}
        >
          {isLoading
            ? 'Processing...'
            : canStartTrial
            ? 'Start 7-Day Free Trial'
            : 'Upgrade to Pro'}
        </button>

        {/* Fine print */}
        <p className="text-xs text-center mt-4" style={{ color: '#141310', opacity: 0.6 }}>
          {canStartTrial
            ? 'No charge for 7 days. Cancel anytime during trial for free.'
            : 'Cancel anytime. No refunds but access continues until end of billing period.'}
        </p>
      </div>
    </div>
  );
}
