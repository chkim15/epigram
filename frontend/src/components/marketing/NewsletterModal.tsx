'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';

interface NewsletterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewsletterModal({ isOpen, onClose }: NewsletterModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(20, 19, 16, 0.5)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="relative rounded-2xl overflow-hidden mx-4"
        style={{ width: '100%', maxWidth: '520px', backgroundColor: '#ffffff' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 p-1.5 rounded-lg cursor-pointer z-10"
          style={{ color: 'var(--muted-foreground)', backgroundColor: 'rgba(255,255,255,0.9)' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--sidebar-accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.9)')}
        >
          <X size={18} />
        </button>
        <iframe
          src="https://thequantsignal.substack.com/embed"
          width="100%"
          height={320}
          style={{ border: 0, display: 'block', background: '#ffffff' }}
          frameBorder={0}
          scrolling="no"
          title="Subscribe to The Quant Signal"
        />
      </div>
    </div>
  );
}
