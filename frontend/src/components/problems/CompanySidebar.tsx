"use client";

import { useState } from "react";
import { Search } from "lucide-react";

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
    <div
      className="w-[280px] flex-shrink-0 border-l px-4 pt-12 pb-4 overflow-y-auto custom-scrollbar hidden lg:block"
      style={{ borderColor: 'var(--border)' }}
    >
      <h3
        className="text-sm font-semibold mb-3"
        style={{ color: 'var(--foreground)' }}
      >
        Companies
      </h3>

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
              onClick={() => onSelectCompany(isActive ? null : tag.name)}
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
              <span
                className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'var(--sidebar-accent)',
                  color: isActive ? 'var(--background)' : 'var(--muted-foreground)',
                }}
              >
                {tag.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
