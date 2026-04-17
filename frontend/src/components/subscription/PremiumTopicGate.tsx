'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import { useSubscriptionStore } from '@/stores/subscriptionStore';

interface PremiumTopicGateProps {
  isPremiumTopic: boolean;
  children: ReactNode;
}

export default function PremiumTopicGate({ isPremiumTopic, children }: PremiumTopicGateProps) {
  const router = useRouter();
  const { isPro, isLoading, fetchSubscription } = useSubscriptionStore();

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  if (isPremiumTopic && !isLoading && !isPro) {
    return (
      <div
        className="flex-1 flex items-center justify-center p-8"
        style={{ backgroundColor: 'var(--background)' }}
      >
        <div className="flex flex-col items-center text-center gap-5 max-w-sm">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: '#a16207' }}
          >
            <Lock size={36} color="white" strokeWidth={2.5} />
          </div>
          <div>
            <h2
              className="text-2xl font-bold mb-2"
              style={{ color: 'var(--foreground)' }}
            >
              Subscribe to unlock.
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
              This topic is part of the premium curriculum. Subscribe to get full access to all 29 topics and problems.
            </p>
          </div>
          <button
            onClick={() => router.push('/upgrade')}
            className="px-8 py-3 rounded-xl font-semibold text-base cursor-pointer"
            style={{ backgroundColor: '#a16207', color: 'white' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#8b5006')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#a16207')}
          >
            Subscribe
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
