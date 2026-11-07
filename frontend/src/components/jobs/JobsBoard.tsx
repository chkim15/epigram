"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Search } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { supabase } from "@/lib/supabase/client";
import { openPostingWindow } from "@/components/jobs/openPosting";
import ForYou from "@/components/jobs/ForYou";
import { FIRM_TYPES, JOB_LEVELS, JOB_ROLES, MORE_JOB_LINKS, type JobOpening, type JobsFeed } from "@/lib/jobs/types";

type BoardState =
  | { kind: "loading" }
  | { kind: "signin" }
  | { kind: "subscribe"; total: number; firms: number }
  | { kind: "error" }
  | { kind: "ready"; feed: JobsFeed };

interface Filters {
  roles: string[];
  levels: string[];
  firms: string[];
  region: string;
  query: string;
}

type FilterTab = "roles" | "levels" | "firms";

const EMPTY_FILTERS: Filters = { roles: [], levels: [], firms: [], region: "", query: "" };
const FILTERS_KEY = "epigram_jobs_filters";
const VIEW_KEY = "epigram_jobs_view";
const PAGE = 40;
const NEW_DAYS = 7;
const TAB_LABELS: Record<FilterTab, string> = { roles: "Role", levels: "Experience level", firms: "Firm" };

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function loadFilters(): Filters {
  try {
    const saved = JSON.parse(localStorage.getItem(FILTERS_KEY) ?? "null");
    if (!saved || typeof saved !== "object") return EMPTY_FILTERS;
    // Drop saved values from older versions of the page (e.g. renamed roles).
    return {
      roles: stringArray(saved.roles).filter((r) => (JOB_ROLES as readonly string[]).includes(r)),
      levels: stringArray(saved.levels).filter((l) => (JOB_LEVELS as readonly string[]).includes(l)),
      firms: stringArray(saved.firms),
      region: typeof saved.region === "string" ? saved.region : "",
      query: "",
    };
  } catch {
    return EMPTY_FILTERS;
  }
}

function levelLabel(level: string) {
  return level === "Unspecified" ? "Level not stated" : level;
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

function countBy(jobs: JobOpening[], key: (j: JobOpening) => string) {
  const counts = new Map<string, number>();
  jobs.forEach((j) => counts.set(key(j), (counts.get(key(j)) ?? 0) + 1));
  return counts;
}

export default function JobsBoard() {
  const router = useRouter();
  const [state, setState] = useState<BoardState>({ kind: "loading" });
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [tab, setTab] = useState<FilterTab>("roles");
  const [view, setView] = useState<"for-you" | "all">("all");

  useEffect(() => {
    try {
      if (localStorage.getItem(VIEW_KEY) === "for-you") setView("for-you");
    } catch {
      // Remembering the view is a convenience only.
    }
  }, []);

  const chooseView = (v: "for-you" | "all") => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      // Remembering the view is a convenience only.
    }
  };
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
      // No `cache: "no-store"` here: it sends Cache-Control: no-cache, which makes the server skip
      // its cached feed and refetch every firm. The response is already marked private, no-store.
      const response = await fetch("/api/jobs", {
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
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
  const roleCounts = useMemo(() => countBy(jobs, (j) => j.role), [jobs]);
  const levelCounts = useMemo(() => countBy(jobs, (j) => j.level), [jobs]);
  const firmCounts = useMemo(() => countBy(jobs, (j) => j.firm), [jobs]);

  const regionOptions = useMemo(() => {
    const counts = new Map<string, number>();
    jobs.forEach((j) => j.regions.forEach((r) => counts.set(r, (counts.get(r) ?? 0) + 1)));
    // Biggest first; "Other" (places we couldn't match to a city) always last.
    return [...counts.entries()].filter(([, n]) => n >= 3)
      .sort((a, b) => Number(a[0] === "Other") - Number(b[0] === "Other") || b[1] - a[1]).map(([r]) => r);
  }, [jobs]);

  // Firms grouped by type, largest first, hiding firms with no current quant openings.
  const firmGroups = useMemo(() => {
    const firms = state.kind === "ready" ? state.feed.firms : [];
    return FIRM_TYPES.map((type) => ({
      type,
      names: firms.filter((f) => f.type === type && firmCounts.get(f.name)).map((f) => f.name)
        .sort((a, b) => (firmCounts.get(b) ?? 0) - (firmCounts.get(a) ?? 0)),
    }));
  }, [state, firmCounts]);

  // Saved firms or locations can disappear when today's openings change; ignore those instead
  // of silently showing zero results.
  const activeFirms = useMemo(() => filters.firms.filter((f) => firmCounts.has(f)), [filters.firms, firmCounts]);
  const activeRegion = regionOptions.includes(filters.region) ? filters.region : "";

  const filtered = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return jobs.filter((j) =>
      (!filters.roles.length || filters.roles.includes(j.role)) &&
      (!filters.levels.length || filters.levels.includes(j.level)) &&
      (!activeFirms.length || activeFirms.includes(j.firm)) &&
      (!activeRegion || j.regions.includes(activeRegion)) &&
      (!q || `${j.title} ${j.firm} ${j.location}`.toLowerCase().includes(q))
    );
  }, [jobs, filters.roles, filters.levels, filters.query, activeFirms, activeRegion]);

  const toggle = (key: FilterTab, value: string) =>
    setFilters((f) => ({ ...f, [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value] }));

  const toggleGroup = (names: string[]) =>
    setFilters((f) => {
      const allOn = names.every((n) => f.firms.includes(n));
      return { ...f, firms: allOn ? f.firms.filter((n) => !names.includes(n)) : [...new Set([...f.firms, ...names])] };
    });

  const hasFilters = filters.roles.length || filters.levels.length || activeFirms.length || activeRegion || filters.query;

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

  const chip = (label: string, count: number | undefined, active: boolean, onClick: () => void) => (
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
      {count !== undefined && <span style={{ opacity: 0.6, marginLeft: 6 }}>{count}</span>}
    </button>
  );

  const inputStyle = { border: "1px solid var(--border)", backgroundColor: "#ffffff", color: "var(--foreground)" };

  return (
    <AppShell>
      {state.kind === "loading" && prompt("Loading openings...", "")}
      {state.kind === "signin" && prompt("Sign in to see open roles.", "Create a free account or sign in to continue.", { label: "Sign in", href: "/auth/signin" })}
      {state.kind === "subscribe" &&
        prompt(
          "Subscribe to see open roles.",
          `${state.total ? `${state.total} quant openings` : "Quant openings"} from ${state.firms || "top"} trading firms, funds and banks, updated daily. Part of Epigram Premium.`,
          { label: "Subscribe", href: "/upgrade" }
        )}
      {state.kind === "error" && prompt("Openings couldn't be loaded.", "Please try again in a few minutes.")}

      {state.kind === "ready" && (
        <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ backgroundColor: "var(--background)" }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
            <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--foreground)" }}>Current Job Openings</h1>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--muted-foreground)" }}>
              {jobs.length} quant openings from {state.feed.firms.filter((f) => f.ok).length} trading firms, funds and banks. Updated{" "}
              {new Date(state.feed.fetchedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}.
            </p>

            {/* View switch */}
            <div className="inline-flex rounded-lg p-1 mb-6" style={{ backgroundColor: "var(--sidebar-background)", border: "1px solid var(--border)" }}>
              {([["for-you", "For you"], ["all", "All openings"]] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => chooseView(key)}
                  className="px-4 py-1.5 text-sm font-medium rounded-md cursor-pointer transition-colors"
                  style={{
                    backgroundColor: view === key ? "#141310" : "transparent",
                    color: view === key ? "#ffffff" : "var(--muted-foreground)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {view === "for-you" ? (
              <ForYou />
            ) : (
            <>
            {/* Search and location */}
            <div className="flex flex-wrap gap-2 mb-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
                <input
                  value={filters.query}
                  onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
                  placeholder="Search titles, e.g. machine learning"
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-lg outline-none"
                  style={inputStyle}
                />
              </div>
              <select
                value={activeRegion}
                onChange={(e) => setFilters((f) => ({ ...f, region: e.target.value }))}
                className="px-3 py-2 text-sm rounded-lg cursor-pointer"
                style={inputStyle}
                aria-label="Location"
              >
                <option value="">All locations</option>
                {regionOptions.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {/* Filter tabs */}
            <div className="rounded-xl mb-6" style={{ border: "1px solid var(--border)", backgroundColor: "var(--sidebar-background)" }}>
              <div role="tablist" className="flex overflow-x-auto" style={{ borderBottom: "1px solid var(--border)" }}>
                {(Object.keys(TAB_LABELS) as FilterTab[]).map((key) => {
                  const active = tab === key;
                  const selected = key === "firms" ? activeFirms.length : filters[key].length;
                  return (
                    <button
                      key={key}
                      role="tab"
                      aria-selected={active}
                      onClick={() => setTab(key)}
                      className="relative px-4 py-2.5 text-sm font-medium whitespace-nowrap cursor-pointer transition-colors"
                      style={{ color: active ? "var(--foreground)" : "var(--muted-foreground)" }}
                    >
                      {TAB_LABELS[key]}
                      {selected > 0 && (
                        <span className="ml-1.5 px-1.5 rounded-full text-xs text-white" style={{ backgroundColor: "#a16207" }}>{selected}</span>
                      )}
                      {active && <span className="absolute left-3 right-3 bottom-0 h-0.5 rounded-full" style={{ backgroundColor: "var(--foreground)" }} />}
                    </button>
                  );
                })}
              </div>

              <div role="tabpanel" className="p-4">
                {tab === "roles" && (
                  <div className="flex flex-wrap gap-2">
                    {JOB_ROLES.map((r) => chip(r, roleCounts.get(r) ?? 0, filters.roles.includes(r), () => toggle("roles", r)))}
                  </div>
                )}
                {tab === "levels" && (
                  <div className="flex flex-wrap gap-2">
                    {JOB_LEVELS.map((l) => chip(levelLabel(l), levelCounts.get(l) ?? 0, filters.levels.includes(l), () => toggle("levels", l)))}
                  </div>
                )}
                {tab === "firms" && (
                  <div className="flex flex-col gap-4">
                    {firmGroups.map(({ type, names }) => names.length > 0 && (
                      <div key={type}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold uppercase" style={{ color: "#a16207", letterSpacing: "1px" }}>{type}</p>
                          <button onClick={() => toggleGroup(names)} className="text-xs cursor-pointer" style={{ color: "var(--muted-foreground)" }}>
                            {names.every((n) => filters.firms.includes(n)) ? "Clear all" : "Select all"}
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {names.map((n) => chip(n, firmCounts.get(n), filters.firms.includes(n), () => toggle("firms", n)))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{filtered.length} matching</p>
              {hasFilters ? (
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
                          {job.role} · {levelLabel(job.level)} · {shortLocation(job)}
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
                          onClick={(e) => openPostingWindow(e, job.url)}
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

            {/* Boards we can't list automatically */}
            <div className="mt-10 rounded-xl p-5" style={{ border: "1px solid var(--border)" }}>
              <h2 className="text-base font-semibold mb-1" style={{ color: "var(--foreground)" }}>Search more firms and job boards</h2>
              <p className="text-sm mb-3" style={{ color: "var(--muted-foreground)" }}>
                These don&apos;t share their openings in a form we can list here. Each link opens their own search.
              </p>
              <div className="flex flex-wrap gap-2">
                {MORE_JOB_LINKS.map((l) => (
                  <a
                    key={l.label}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 text-sm rounded-full border cursor-pointer hover:opacity-70"
                    style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                  >
                    {l.label} ↗
                  </a>
                ))}
              </div>
            </div>

            </>
            )}

            <p className="text-xs mt-6" style={{ color: "var(--muted-foreground)" }}>
              Roles are grouped automatically from job titles, so a few may be mislabelled. Always check the firm&apos;s posting before applying.
            </p>
          </div>
        </div>
      )}
    </AppShell>
  );
}
