"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useSubscriptionStore } from "@/stores/subscriptionStore";

interface LibrarySummary {
  slug: string;
  title: string;
  summary: string;
  status: "published" | "coming_soon";
  is_free_sample: boolean;
}

interface LibraryIndexProps {
  section: "notebooks" | "projects";
  heading: string;
  /** Introduction shown under the heading, one string per paragraph. */
  intro: string[];
}

export default function LibraryIndex({ section, heading, intro }: LibraryIndexProps) {
  const [items, setItems] = useState<LibrarySummary[] | null>(null);
  const [failed, setFailed] = useState(false);
  // Loads the visitor's plan (signed-out visitors can still browse the list).
  useAuthGuard({ requireAuth: false });
  const { isPro, isLoading: isPlanLoading } = useSubscriptionStore();
  // Premium members can open everything, so they see no locks or "Free sample" tags. Wait for the plan
  // before showing locks, so a Premium member never sees them flash.
  const showAccessTags = !isPro && !isPlanLoading;

  useEffect(() => {
    fetch(`/api/library/${section}`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load");
        return response.json();
      })
      .then((data) => setItems(data.items))
      .catch(() => setFailed(true));
  }, [section]);

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ backgroundColor: "var(--background)" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <h1 className="text-3xl font-bold mb-3" style={{ color: "var(--foreground)" }}>{heading}</h1>
          <div className="flex flex-col gap-3 mb-8">
            {intro.map((paragraph, i) => (
              <p key={i} className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{paragraph}</p>
            ))}
          </div>

          {failed && <p className="text-sm" style={{ color: "#a16207" }}>This section couldn&apos;t be loaded. Please try again.</p>}
          {!items && !failed && <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Loading...</p>}

          <div className="flex flex-col gap-3">
            {items?.map((item) => {
              const comingSoon = item.status === "coming_soon";
              const card = (
                <div
                  className="rounded-xl p-5"
                  style={{
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--sidebar-background)",
                    opacity: comingSoon ? 0.65 : 1,
                  }}
                >
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>{item.title}</h2>
                    {comingSoon ? (
                      <span className="text-xs whitespace-nowrap" style={{ color: "var(--muted-foreground)" }}>Coming soon</span>
                    ) : !showAccessTags ? null : item.is_free_sample ? (
                      <span className="text-xs font-semibold whitespace-nowrap" style={{ color: "#a16207" }}>Free sample</span>
                    ) : (
                      <Lock size={14} className="shrink-0 mt-1" style={{ color: "var(--muted-foreground)" }} aria-label="For subscribers" />
                    )}
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{item.summary}</p>
                </div>
              );
              return comingSoon ? (
                <div key={item.slug}>{card}</div>
              ) : (
                <Link key={item.slug} href={`/${section}/${item.slug}`} className="block cursor-pointer">{card}</Link>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
