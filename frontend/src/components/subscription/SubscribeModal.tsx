'use client';

import { useRouter } from 'next/navigation';
import { Lock, X } from 'lucide-react';

interface SubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export default function SubscribeModal({ isOpen, onClose, message }: SubscribeModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(20, 19, 16, 0.5)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="relative rounded-2xl p-10 flex flex-col items-center text-center gap-5 max-w-sm w-full mx-4"
        style={{ backgroundColor: 'var(--background)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg cursor-pointer"
          style={{ color: 'var(--muted-foreground)' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--sidebar-accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <X size={18} />
        </button>

        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: '#a16207' }}
        >
          <Lock size={36} color="white" strokeWidth={2.5} />
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
            Subscribe to unlock.
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            {message ?? 'This feature requires a premium subscription.'}
          </p>
        </div>

        <button
          onClick={() => router.push('/upgrade')}
          className="px-8 py-3 rounded-xl font-semibold text-base cursor-pointer w-full"
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
