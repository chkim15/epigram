"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import "katex/dist/katex.min.css";
import "./library.css";
import AppShell from "@/components/layout/AppShell";
import LabCell, { type Lab } from "@/components/library/LabCell";
import { supabase } from "@/lib/supabase/client";

interface LibraryReaderProps {
  section: "notebooks" | "projects";
  slug: string;
  backLabel: string;
}

type ReaderState =
  | { kind: "loading" }
  | { kind: "signin" }
  | { kind: "subscribe" }
  | { kind: "missing" }
  | { kind: "error" }
  | { kind: "ready"; html: string; labs: Lab[]; email: string };

const BLOCKED_KEYS = new Set(["a", "c", "p", "s", "u", "v", "x"]);

function watermarkImage(email: string) {
  const safe = email.replace(/[<>&"']/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="220"><text x="20" y="130" transform="rotate(-25 180 110)" font-family="sans-serif" font-size="14" fill="#141310" fill-opacity="0.07">${safe}</text></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export default function LibraryReader({ section, slug, backLabel }: LibraryReaderProps) {
  const router = useRouter();
  const [state, setState] = useState<ReaderState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`/api/library/${section}/${slug}`, {
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
        cache: "no-store",
      });
      if (cancelled) return;
      if (response.status === 401) return setState({ kind: "signin" });
      if (response.status === 403) return setState({ kind: "subscribe" });
      if (response.status === 404) return setState({ kind: "missing" });
      if (!response.ok) return setState({ kind: "error" });
      const data = await response.json();
      if (!cancelled) setState({ kind: "ready", html: data.html, labs: data.labs ?? [], email: data.email });
    }
    load().catch(() => {
      if (!cancelled) setState({ kind: "error" });
    });
    return () => {
      cancelled = true;
    };
  }, [section, slug]);

  const isReady = state.kind === "ready";
  useEffect(() => {
    if (!isReady) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && BLOCKED_KEYS.has(event.key.toLowerCase())) {
        event.preventDefault();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isReady]);

  const watermark = useMemo(() => (state.kind === "ready" ? watermarkImage(state.email) : undefined), [state]);

  // Odd positions are lab ids captured from the placeholders the build script inserts.
  const segments = useMemo(() => (state.kind === "ready" ? state.html.split(/<div data-lab="([^"]+)"><\/div>/) : []), [state]);

  const prompt = (title: string, body: string, action?: { label: string; href: string }) => (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="flex flex-col items-center text-center gap-5 max-w-sm">
        {action && (
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#a16207" }}>
            <Lock size={28} color="white" strokeWidth={2.5} />
          </div>
        )}
        <div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--foreground)" }}>{title}</h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{body}</p>
        </div>
        {action && (
          <button
            onClick={() => router.push(action.href)}
            className="px-8 py-3 rounded-xl font-semibold text-base cursor-pointer"
            style={{ backgroundColor: "#a16207", color: "white" }}
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <AppShell>
      {state.kind === "loading" && prompt("Loading...", "")}
      {state.kind === "signin" && prompt("Sign in to read this.", "Create a free account or sign in to continue.", { label: "Sign in", href: "/auth/signin" })}
      {state.kind === "subscribe" && prompt("Subscribe to unlock.", "This is part of Epigram's premium content.", { label: "Subscribe", href: "/upgrade" })}
      {state.kind === "missing" && prompt("Not found.", "This page doesn't exist or isn't available yet.")}
      {state.kind === "error" && prompt("Something went wrong.", "This page couldn't be loaded. Please try again.")}
      {state.kind === "ready" && (
        <div className="flex-1 overflow-y-auto custom-scrollbar relative" style={{ backgroundColor: "var(--background)" }}>
          <div className="library-print-notice">Printing is not available for this content.</div>
          <div
            className="library-protected max-w-3xl mx-auto px-4 sm:px-6 py-8"
            onCopy={(event) => event.preventDefault()}
            onCut={(event) => event.preventDefault()}
            onContextMenu={(event) => event.preventDefault()}
            onDragStart={(event) => event.preventDefault()}
          >
            <Link href={`/${section}`} className="text-sm cursor-pointer" style={{ color: "#a16207" }}>&larr; {backLabel}</Link>
            {section === "notebooks" && (
              <p className="library-note">
                {state.labs.length > 0
                  ? "Results come from a saved run. The practice cells run in your browser on simulated data."
                  : "This is a read-only edition with saved results. To run the code, type it into your own Colab or Jupyter notebook."}
              </p>
            )}
            {segments.map((segment, i) => {
              if (i % 2 === 0) {
                return <div key={i} className="library-body" dangerouslySetInnerHTML={{ __html: segment }} />;
              }
              const lab = state.labs.find((candidate) => candidate.id === segment);
              return lab ? <LabCell key={lab.id} lab={lab} /> : null;
            })}
          </div>
          <div className="library-watermark" aria-hidden="true" style={{ backgroundImage: watermark }} />
        </div>
      )}
    </AppShell>
  );
}
