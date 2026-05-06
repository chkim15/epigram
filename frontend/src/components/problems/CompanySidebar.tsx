"use client";

import { useState } from "react";
import { Search, Lock } from "lucide-react";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import SubscribeModal from "@/components/subscription/SubscribeModal";
import NewsletterModal from "@/components/marketing/NewsletterModal";

function NewsletterCard() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <NewsletterModal isOpen={open} onClose={() => setOpen(false)} />
      <div
        className="mt-6 p-4 rounded-xl"
        style={{
          background: 'rgba(161,98,7,0.08)',
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
        <button
          onClick={() => setOpen(true)}
          className="w-full cursor-pointer"
          style={{ padding: '4px 4px 4px 10px', borderRadius: '8px', background: '#ffffff', border: '1px solid rgb(220,218,210)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}
        >
          <span style={{ fontSize: '11px', color: '#9b9b93', fontWeight: 400 }}>Email address</span>
          <span
            style={{ padding: '6px 10px', borderRadius: '5px', background: '#a16207', color: '#fff', fontSize: '11px', fontWeight: 600, flexShrink: 0 }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#8b5006')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#a16207')}
          >
            Subscribe →
          </span>
        </button>
      </div>
    </>
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
