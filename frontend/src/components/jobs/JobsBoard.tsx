"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Search } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { supabase } from "@/lib/supabase/client";
import { JOB_LEVELS, JOB_ROLES, type JobOpening, type JobsFeed } from "@/lib/jobs/types";

type BoardState =
  | { kind: "loading" }
  | { kind: "signin" }
  | { kind: "subscribe"; total: number; firms: number }
  | { kind: "error" }
  | { kind: "ready"; feed: JobsFeed };

interface Filters {
  roles: string[];
  levels: string[];
  region: string;
  firm: string;
  query: string;
}

const EMPTY_FILTERS: Filters = { roles: [], levels: [], region: "", firm: "", query: "" };
const FILTERS_KEY = "epigram_jobs_filters";
const PAGE = 40;
const NEW_DAYS = 7;

function loadFilters(): Filters {
  try {
    const saved = localStorage.getItem(FILTERS_KEY);
    return saved ? { ...EMPTY_FILTERS, ...JSON.parse(saved), query: "" } : EMPTY_FILTERS;
  } catch {
    return EMPTY_FILTERS;
  }
}

function postedLabel(postedAt: string | null): { text: string; isNew: boolean } | null {
  if (!postedAt) return null;
  const days = Math.floor((Date.now() - new Date(postedAt).getTime()) / 86_400_000);
  if (Number.isNaN(days) || days < 0) return null;
  const text = days === 0 ? "Posted today" : days === 1 ? "Posted yesterday" : days < 60 ? `Posted ${days} days ago` : "Posted 2+ months ago";
  return { text, isNew: days < NEW_DAYS };
}

function shortLocation(job: JobOpening) {
  return job.location.length <= 48 ? job.location : `${job.regions.slice(0, 3).join(", ")} +${Math.max(job.regions.length - 3, 1)} more`;
}

export default function JobsBoard() {
  const router = useRouter();
  const [state, setState] = useState<BoardState>({ kind: "loading" });
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [shown, setShown] = useState(PAGE);

  useEffect(() => setFilters(loadFilters()), []);

  useEffect(() => {
    try {
      localStorage.setItem(FILTERS_KEY, JSON.stringify({ ...filters, query: "" }));
    } catch {
      // Saving filters is a convenience only.
    }
    setShown(PAGE);
  }, [filters]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch("/api/jobs", {
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
        cache: "no-store",
      });
      if (cancelled) return;
      if (response.status === 401) return setState({ kind: "signin" });
      if (response.status === 403) {
        const data = await response.json().catch(() => ({}));
        return setState({ kind: "subscribe", total: data.total ?? 0, firms: data.firms ?? 0 });
      }
      if (!response.ok) return setState({ kind: "error" });
      const feed: JobsFeed = await response.json();
      if (!cancelled) setState({ kind: "ready", feed });
    }
    load().catch(() => {
      if (!cancelled) setState({ kind: "error" });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const jobs = useMemo(() => (state.kind === "ready" ? state.feed.jobs : []), [state]);

  const regionOptions = useMemo(() => {
    const counts = new Map<string, number>();
    jobs.forEach((j) => j.regions.forEach((r) => counts.set(r, (counts.get(r) ?? 0) + 1)));
    return [...counts.entries()].filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]).map(([r]) => r);
  }, [jobs]);

  const firmOptions = useMemo(() => [...new Set(jobs.map((j) => j.firm))].sort(), [jobs]);

  const filtered = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return jobs.filter((j) =>
      (!filters.roles.length || filters.roles.includes(j.role)) &&
      (!filters.levels.length || filters.levels.includes(j.level)) &&
      (!filters.region || j.regions.includes(filters.region)) &&
      (!filters.firm || j.firm === filters.firm) &&
      (!q || `${j.title} ${j.firm} ${j.location}`.toLowerCase().includes(q))
    );
  }, [jobs, filters]);

  const toggle = (key: "roles" | "levels", value: string) =>
    setFilters((f) => ({ ...f, [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value] }));

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

  const chip = (label: string, active: boolean, onClick: () => void) => (
    <button
      key={label}
      onClick={onClick}
      className="px-3 py-1 text-sm rounded-full border cursor-pointer transition-colors"
      style={{
        backgroundColor: active ? "#141310" : "var(--background)",
        color: active ? "#ffffff" : "var(--foreground)",
        borderColor: active ? "#141310" : "var(--border)",
      }}
    >
      {label}
    </button>
  );

  const selectStyle = { border: "1px solid var(--border)", backgroundColor: "#ffffff", color: "var(--foreground)" };

  return (
    <AppShell>
      {state.kind === "loading" && prompt("Loading openings...", "")}
      {state.kind === "signin" && prompt("Sign in to see open roles.", "Create a free account or sign in to continue.", { label: "Sign in", href: "/auth/signin" })}
      {state.kind === "subscribe" &&
        prompt(
          "Subscribe to see open roles.",
          `${state.total ? `${state.total} quant openings` : "Quant openings"} from ${state.firms || "top"} trading firms and funds, updated daily. Part of Epigram Premium.`,
          { label: "Subscribe", href: "/upgrade" }
        )}
      {state.kind === "error" && prompt("Openings couldn't be loaded.", "Please try again in a few minutes.")}

      {state.kind === "ready" && (
        <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ backgroundColor: "var(--background)" }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
            <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--foreground)" }}>Jobs</h1>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--muted-foreground)" }}>
              {jobs.length} quant openings from {state.feed.firms.filter((f) => f.ok).length} trading firms and funds, taken from their
              official job boards. Updated {new Date(state.feed.fetchedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}.
            </p>

            {/* Filters */}
            <div className="flex flex-col gap-3 mb-6">
              <div className="flex flex-wrap gap-2">{JOB_ROLES.map((r) => chip(r, filters.roles.includes(r), () => toggle("roles", r)))}</div>
              <div className="flex flex-wrap gap-2">{JOB_LEVELS.map((l) => chip(l === "Unspecified" ? "Level not stated" : l, filters.levels.includes(l), () => toggle("levels", l)))}</div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={filters.region}
                  onChange={(e) => setFilters((f) => ({ ...f, region: e.target.value }))}
                  className="px-3 py-1.5 text-sm rounded-lg cursor-pointer"
                  style={selectStyle}
                  aria-label="Location"
                >
                  <option value="">All locations</option>
                  {regionOptions.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <select
                  value={filters.firm}
                  onChange={(e) => setFilters((f) => ({ ...f, firm: e.target.value }))}
                  className="px-3 py-1.5 text-sm rounded-lg cursor-pointer"
                  style={selectStyle}
                  aria-label="Firm"
                >
                  <option value="">All firms</option>
                  {firmOptions.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
                <div className="relative flex-1 min-w-[180px]">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
                  <input
                    value={filters.query}
                    onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
                    placeholder="Search titles, e.g. machine learning"
                    className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg outline-none"
                    style={selectStyle}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{filtered.length} matching</p>
              {(filters.roles.length || filters.levels.length || filters.region || filters.firm || filters.query) ? (
                <button onClick={() => setFilters(EMPTY_FILTERS)} className="text-sm cursor-pointer" style={{ color: "#a16207" }}>Clear filters</button>
              ) : null}
            </div>

            {/* Openings */}
            <div className="flex flex-col gap-2">
              {filtered.slice(0, shown).map((job) => {
                const posted = postedLabel(job.postedAt);
                return (
                  <div key={job.id} className="rounded-xl p-4" style={{ border: "1px solid var(--border)", backgroundColor: "var(--sidebar-background)" }}>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase mb-0.5" style={{ color: "#a16207", letterSpacing: "1px" }}>
                          {job.firm}
                          {posted?.isNew && (
                            <span className="ml-2 px-1.5 py-0.5 rounded text-white normal-case" style={{ backgroundColor: "#2A6048", letterSpacing: 0 }}>New</span>
                          )}
                        </p>
                        <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>{job.title}</h2>
                        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                          {job.role} · {job.level === "Unspecified" ? "Level not stated" : job.level} · {shortLocation(job)}
                          {posted && ` · ${posted.text}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        {job.epigramLabel && (
                          <Link href="/problems" className="text-sm cursor-pointer hover:opacity-70" style={{ color: "#a16207" }}>
                            Practise {job.epigramLabel} problems
                          </Link>
                        )}
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-1.5 text-sm font-medium rounded-lg cursor-pointer hover:opacity-90"
                          style={{ backgroundColor: "#a16207", color: "#ffffff" }}
                        >
                          View &amp; apply
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <p className="text-sm py-10 text-center" style={{ color: "var(--muted-foreground)" }}>No openings match these filters right now.</p>
            )}
            {filtered.length > shown && (
              <button
                onClick={() => setShown((n) => n + PAGE)}
                className="mt-4 w-full py-2.5 text-sm rounded-xl border cursor-pointer"
                style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                Show more ({filtered.length - shown} left)
              </button>
            )}

            <p className="text-xs mt-8" style={{ color: "var(--muted-foreground)" }}>
              Roles are grouped automatically from job titles, so a few may be mislabelled. Always check the firm&apos;s posting before applying.
            </p>
          </div>
        </div>
      )}
    </AppShell>
  );
}
