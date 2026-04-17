"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useAuthStore } from "@/stores/authStore";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import UserProfileDropdown from "@/components/auth/UserProfileDropdown";

interface UnifiedHeaderProps {
  className?: string;
}

const NAV_TABS = [
  { label: "Curriculum", href: "/curriculum", match: "/curriculum" },
  { label: "Problems", href: "/problems", match: "/problems" },
  { label: "Mock Interview", href: "/mock-interview", match: "/mock-interview" },
  { label: "Tutoring", href: "/tutoring", match: "/tutoring" },
] as const;

export default function UnifiedHeader({ className }: UnifiedHeaderProps) {
  const { user } = useAuthStore();
  const { isPro } = useSubscriptionStore();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <>
      <div
        className={cn(
          "h-[52px] flex flex-shrink-0 px-4 items-center w-full border-b",
          className
        )}
        style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer mr-6"
          onClick={() => router.push('/problems')}
        >
          <Image
            src="/epigram_logo.svg"
            alt="Epigram Logo"
            width={28}
            height={28}
            style={{ filter: 'var(--logo-filter, none)' }}
          />
          <h1 className="font-bold text-lg" style={{ color: 'var(--epigram-text-color)' }}>
            Epigram
          </h1>
        </div>

        {/* Nav Tabs */}
        <nav className="flex items-center gap-1 h-full">
          {NAV_TABS.map((tab) => {
            const isActive = pathname.startsWith(tab.match);
            return (
              <button
                key={tab.href}
                onClick={() => router.push(tab.href)}
                className="relative h-full px-3 flex items-center text-sm font-medium transition-colors cursor-pointer"
                style={{
                  color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = 'var(--foreground)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = 'var(--muted-foreground)';
                }}
              >
                {tab.label}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
                    style={{ backgroundColor: 'var(--foreground)' }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Premium Button - Only show for non-Pro users */}
        {!isPro && (
          <>
            <Button
              onClick={() => router.push('/upgrade')}
              size="sm"
              className="h-8 px-4 rounded-lg cursor-pointer font-medium"
              style={{
                backgroundColor: '#a16207',
                color: '#ffffff',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8b5006'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#a16207'}
            >
              Premium
            </Button>
            <div className="w-2" />
          </>
        )}

        {/* User Profile / Sign in */}
        {user ? (
          <UserProfileDropdown user={user} />
        ) : (
          <button
            onClick={() => window.location.href = '/auth/signin'}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer border"
            style={{
              backgroundColor: 'var(--background)',
              borderColor: 'var(--border)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--secondary)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--background)'}
          >
            <UserIcon className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
          </button>
        )}
      </div>

    </>
  );
}
