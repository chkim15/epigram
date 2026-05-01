"use client";

import { useState } from "react";
import { Search, Lock } from "lucide-react";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import SubscribeModal from "@/components/subscription/SubscribeModal";

function NewsletterCard() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div
      className="mt-6 p-4 rounded-xl"
      style={{
        background: 'rgba(161,98,7,0.08)',
        border: '1px solid rgba(161,98,7,0.4)',
      }}
    >
      <span
        style={{
          display: 'inline-block',
          background: '#a16207',
          color: '#fff',
          fontSize: '9px',
          fontWeight: 700,
          letterSpacing: '1.2px',
          textTransform: 'uppercase',
          padding: '2px 6px',
          borderRadius: '3px',
          marginBottom: '10px',
        }}
      >
        Free Newsletter
      </span>
      <h4
        style={{
          fontFamily: 'var(--font-playfair, serif)',
          fontSize: '17px',
          fontWeight: 700,
          color: 'var(--foreground)',
          lineHeight: 1.2,
          marginBottom: '6px',
        }}
      >
        The Quant Signal
      </h4>
      <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', lineHeight: 1.5, marginBottom: '12px' }}>
        Weekly interview problems, prep tips, and strategy notes for top quant funds.
      </p>
      {status === 'success' ? (
        <p style={{ fontSize: '12px', color: '#15803d', fontWeight: 500 }}>
          ✓ Check your inbox to confirm.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 text-xs rounded-lg border bg-white focus:outline-none"
            style={{ borderColor: 'rgb(220,218,210)', color: 'var(--foreground)' }}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full px-3 py-2 text-xs font-semibold rounded-lg cursor-pointer"
            style={{
              background: '#a16207',
              color: '#fff',
              border: 'none',
              opacity: status === 'loading' ? 0.7 : 1,
              cursor: status === 'loading' ? 'not-allowed' : 'pointer',
            }}
          >
            {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
          </button>
          {status === 'error' && (
            <p style={{ fontSize: '11px', color: '#b91c1c' }}>
              Something went wrong — try again.
            </p>
          )}
        </form>
      )}
    </div>
  );
}

interface CompanyTag {
  name: string;
  count: number;
}

interface CompanySidebarProps {
  companyTags: CompanyTag[];
  selectedCompany: string | null;
  onSelectCompany: (name: string | null) => void;
}

export default function CompanySidebar({
  companyTags,
  selectedCompany,
  onSelectCompany,
}: CompanySidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const { isPro } = useSubscriptionStore();

  const filteredTags = companyTags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (companyTags.length === 0) {
    return (
      <div
        className="w-[280px] flex-shrink-0 border-l px-4 pt-12 pb-6 hidden lg:block"
        style={{ borderColor: 'var(--border)' }}
      >
        <h3
          className="text-sm font-semibold mb-3"
          style={{ color: 'var(--foreground)' }}
        >
          Companies
        </h3>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          No company data yet
        </p>
      </div>
    );
  }

  return (
    <>
    <SubscribeModal
      isOpen={showSubscribeModal}
      onClose={() => setShowSubscribeModal(false)}
      message="Company filters are a premium feature. Subscribe to filter problems by company."
    />
    <div
      className="w-[280px] flex-shrink-0 border-l px-4 pt-12 pb-4 overflow-y-auto custom-scrollbar hidden lg:block"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-1.5 mb-3">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
          Companies
        </h3>
        {!isPro && <Lock size={12} style={{ color: 'var(--muted-foreground)' }} />}
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search
          className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
          style={{ color: 'var(--muted-foreground)' }}
        />
        <input
          type="text"
          placeholder="Search for a company..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-8 pl-8 pr-3 text-sm rounded-xl border bg-white focus:outline-none"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--foreground)',
          }}
        />
      </div>

      {/* Company Tags */}
      <div className="flex flex-wrap gap-2">
        {filteredTags.map((tag) => {
          const isActive = selectedCompany === tag.name;
          return (
            <button
              key={tag.name}
              onClick={() => isPro ? onSelectCompany(isActive ? null : tag.name) : setShowSubscribeModal(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm rounded-xl border cursor-pointer transition-colors"
              style={{
                backgroundColor: isActive ? 'var(--foreground)' : 'transparent',
                color: isActive ? 'var(--background)' : 'var(--foreground)',
                borderColor: isActive ? 'var(--foreground)' : 'var(--border)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--sidebar-accent)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span>{tag.name}</span>
            </button>
          );
        })}
      </div>

      <NewsletterCard />
    </div>
    </>
  );
}
