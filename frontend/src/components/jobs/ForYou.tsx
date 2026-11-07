"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FileUp, Trash2, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { openPostingWindow } from "@/components/jobs/openPosting";
import {
  CAREER_STAGES, JOB_LEVELS, JOB_ROLES, REGION_NAMES,
  type CareerStage, type CvProfile, type CvSkill, type JobMatchView,
} from "@/lib/jobs/types";

type Stage =
  | { kind: "loading" }
  | { kind: "upload"; error?: string; back?: Stage }
  | { kind: "reading" }
  | { kind: "review"; profile: CvProfile; saving?: boolean; error?: string }
  | { kind: "matches"; profile: CvProfile; matches: JobMatchView[]; openingsStored: number }
  | { kind: "error"; message: string };

const GOLD = "#a16207";
const GREEN = "#2A6048";
const LEVEL_ORDER: CvSkill["level"][] = ["expert", "proficient", "familiar"];

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return session ? { Authorization: `Bearer ${session.access_token}` } : {};
}

function monthLabel(m: string | null) {
  if (!m) return "present";
  const [y, mo] = m.split("-").map(Number);
  return new Date(Date.UTC(y, (mo || 1) - 1, 1)).toLocaleDateString(undefined, { month: "short", year: "numeric", timeZone: "UTC" });
}

export default function ForYou() {
  const [stage, setStage] = useState<Stage>({ kind: "loading" });
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);

  const loadMatches = useCallback(async (profile: CvProfile) => {
    const res = await fetch("/api/jobs/matches", { headers: await authHeaders() });
    if (!res.ok) return setStage({ kind: "error", message: "Your matches couldn't be loaded. Please try again." });
    const data = await res.json();
    setStage({ kind: "matches", profile, matches: data.matches, openingsStored: data.openingsStored });
  }, []);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/jobs/profile", { headers: await authHeaders() });
      if (!res.ok) return setStage({ kind: "error", message: "Your profile couldn't be loaded. Please try again." });
      const { profile } = (await res.json()) as { profile: CvProfile | null };
      if (!profile) return setStage({ kind: "upload" });
      if (!profile.confirmedAt) return setStage({ kind: "review", profile });
      await loadMatches(profile);
    })().catch(() => setStage({ kind: "error", message: "Your profile couldn't be loaded. Please try again." }));
  }, [loadMatches]);

  async function upload() {
    if (!file || !consent) return;
    const back = stage.kind === "upload" ? stage.back : undefined;
    setStage({ kind: "reading" });
    const form = new FormData();
    form.append("file", file);
    form.append("consent", "yes");
    const res = await fetch("/api/jobs/profile", { method: "POST", headers: await authHeaders(), body: form });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setStage({ kind: "upload", error: data.error ?? "Upload failed. Please try again.", back });
    setFile(null);
    setStage({ kind: "review", profile: data.profile });
  }

  async function saveProfile(profile: CvProfile) {
    setStage({ kind: "review", profile, saving: true });
    const res = await fetch("/api/jobs/profile", {
      method: "PUT",
      headers: { ...(await authHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify({
        sections: {
          education: profile.education, experiences: profile.experiences, skills: profile.skills,
          achievements: profile.achievements, languages: profile.languages, projects: profile.projects,
          links: profile.links, summary: profile.summary,
        },
        careerStage: profile.careerStage,
        preferredRoles: profile.preferredRoles,
        preferredLevels: profile.preferredLevels,
        preferredRegions: profile.preferredRegions,
        confirm: true,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setStage({ kind: "review", profile, error: data.error ?? "Saving failed. Please try again." });
    await loadMatches(data.profile);
  }

  async function deleteCv() {
    if (!window.confirm("Delete your CV, profile and matches from Epigram? This can't be undone.")) return;
    const res = await fetch("/api/jobs/profile", { method: "DELETE", headers: await authHeaders() });
    if (res.ok) setStage({ kind: "upload" });
    else window.alert("Your CV couldn't be deleted. Please try again.");
  }

  const card = "rounded-xl p-5";
  const cardStyle = { border: "1px solid var(--border)", backgroundColor: "var(--sidebar-background)" };
  const muted = { color: "var(--muted-foreground)" };
  const primaryBtn = "px-5 py-2 text-sm font-medium rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

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

  if (stage.kind === "loading") return <p className="text-sm py-10 text-center" style={muted}>Loading your profile...</p>;
  if (stage.kind === "error") return <p className="text-sm py-10 text-center" style={{ color: GOLD }}>{stage.message}</p>;

  if (stage.kind === "reading") {
    return (
      <div className={`${card} text-center py-12`} style={cardStyle}>
        <p className="text-base font-semibold mb-1" style={{ color: "var(--foreground)" }}>Reading your CV...</p>
        <p className="text-sm" style={muted}>This can take up to a minute. Please keep this page open.</p>
      </div>
    );
  }

  // ---------- 1. Upload ----------
  if (stage.kind === "upload") {
    return (
      <div className={card} style={cardStyle}>
        <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--foreground)" }}>Find the roles that fit you</h2>
        <p className="text-sm leading-relaxed mb-5" style={muted}>
          Upload your CV and we&apos;ll score every current opening against your experience, skills and preferences,
          with the reasons and the gaps for each. Matches update every day as new roles appear.
        </p>
        <label
          className="flex items-center gap-3 rounded-lg p-4 mb-4 cursor-pointer"
          style={{ border: "1px dashed var(--border)", backgroundColor: "var(--background)" }}
        >
          <FileUp size={20} style={{ color: GOLD }} />
          <span className="text-sm" style={{ color: "var(--foreground)" }}>
            {file ? file.name : "Choose a PDF or Word (.docx) file, up to 5 MB"}
          </span>
          <input
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <label className="flex items-start gap-2 text-sm mb-5 cursor-pointer" style={muted}>
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 cursor-pointer" />
          <span>
            I agree that Epigram stores my CV privately and uses it, with the help of AI, to match me with job openings.
            Contact details are removed before the AI reads it. I can delete my CV and profile at any time.
          </span>
        </label>
        {stage.error && <p className="text-sm mb-3" style={{ color: GOLD }}>{stage.error}</p>}
        <button onClick={upload} disabled={!file || !consent} className={primaryBtn} style={{ backgroundColor: GOLD, color: "#fff" }}>
          Upload and read my CV
        </button>
        {stage.back && (
          <button onClick={() => setStage(stage.back!)} className="ml-4 text-sm cursor-pointer" style={muted}>
            Cancel, keep my current CV
          </button>
        )}
      </div>
    );
  }

  // ---------- 2. Review ----------
  if (stage.kind === "review") {
    const p = stage.profile;
    const update = (patch: Partial<CvProfile>) => setStage({ ...stage, profile: { ...p, ...patch }, error: undefined });
    const toggle = (key: "preferredRoles" | "preferredLevels" | "preferredRegions", v: string) =>
      update({ [key]: p[key].includes(v) ? p[key].filter((x) => x !== v) : [...p[key], v] });
    const cycleLevel = (i: number) =>
      update({ skills: p.skills.map((s, j) => (j === i ? { ...s, level: LEVEL_ORDER[(LEVEL_ORDER.indexOf(s.level) + 1) % 3] } : s)) });

    return (
      <div className="flex flex-col gap-4">
        <div className={card} style={cardStyle}>
          <div className="flex items-start justify-between gap-3 mb-1">
            <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>Check your profile</h2>
            <span className="text-xs" style={muted}>From {p.cvFileName}</span>
          </div>
          <p className="text-sm mb-4" style={muted}>
            We read this from your CV. Fix anything that&apos;s wrong, choose what you&apos;re looking for, then confirm.
          </p>
          {p.summary && <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--foreground)" }}>{p.summary}</p>}

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs font-semibold uppercase mb-2" style={{ color: GOLD, letterSpacing: "1px" }}>Education</p>
              {p.education.map((e, i) => (
                <p key={i} className="text-sm mb-1" style={{ color: "var(--foreground)" }}>
                  <b>{e.degree === "Other" ? "" : `${e.degree} `}{e.field}</b> · {e.institution}
                  <span style={muted}> · {monthLabel(e.end)}</span>
                </p>
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase mb-2" style={{ color: GOLD, letterSpacing: "1px" }}>Experience</p>
              {p.experiences.slice(0, 6).map((e, i) => (
                <p key={i} className="text-sm mb-1" style={{ color: "var(--foreground)" }}>
                  <b>{e.title}</b> · {e.organization}
                  <span style={muted}> · {monthLabel(e.start)} – {monthLabel(e.end)}</span>
                </p>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <p className="text-xs font-semibold uppercase" style={{ color: GOLD, letterSpacing: "1px" }}>Career stage</p>
            <select
              value={p.careerStage ?? ""}
              onChange={(e) => update({ careerStage: e.target.value as CareerStage })}
              className="px-3 py-1.5 text-sm rounded-lg cursor-pointer"
              style={{ border: "1px solid var(--border)", backgroundColor: "#ffffff", color: "var(--foreground)" }}
            >
              {CAREER_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            {p.yearsExperience ? <span className="text-sm" style={muted}>about {p.yearsExperience} years of full-time experience</span> : null}
          </div>

          <p className="text-xs font-semibold uppercase mb-2" style={{ color: GOLD, letterSpacing: "1px" }}>
            Skills <span className="normal-case font-normal" style={muted}>· tap a skill to change its level, × to remove it</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {p.skills.map((s, i) => (
              <span key={s.name} className="inline-flex items-center gap-1 pl-3 pr-1.5 py-1 text-sm rounded-full border" style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}>
                <button onClick={() => cycleLevel(i)} className="cursor-pointer" style={{ color: "var(--foreground)" }}>
                  {s.name} <span style={{ color: s.level === "familiar" ? GOLD : GREEN }}>· {s.level}</span>
                </button>
                <button onClick={() => update({ skills: p.skills.filter((_, j) => j !== i) })} className="cursor-pointer p-0.5" aria-label={`Remove ${s.name}`} style={muted}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className={card} style={cardStyle}>
          <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--foreground)" }}>What are you looking for?</h2>
          <p className="text-sm mb-4" style={muted}>Leave a group empty to include everything.</p>
          <p className="text-xs font-semibold uppercase mb-2" style={{ color: GOLD, letterSpacing: "1px" }}>Roles</p>
          <div className="flex flex-wrap gap-2 mb-4">{JOB_ROLES.map((r) => chip(r, p.preferredRoles.includes(r), () => toggle("preferredRoles", r)))}</div>
          <p className="text-xs font-semibold uppercase mb-2" style={{ color: GOLD, letterSpacing: "1px" }}>Levels</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {JOB_LEVELS.map((l) => chip(l === "Unspecified" ? "Level not stated" : l, p.preferredLevels.includes(l), () => toggle("preferredLevels", l)))}
          </div>
          <p className="text-xs font-semibold uppercase mb-2" style={{ color: GOLD, letterSpacing: "1px" }}>Locations</p>
          <div className="flex flex-wrap gap-2">{REGION_NAMES.map((r) => chip(r, p.preferredRegions.includes(r), () => toggle("preferredRegions", r)))}</div>
        </div>

        {stage.error && <p className="text-sm" style={{ color: GOLD }}>{stage.error}</p>}
        <div className="flex flex-wrap items-center gap-4">
          <button onClick={() => saveProfile(p)} disabled={stage.saving} className={primaryBtn} style={{ backgroundColor: GOLD, color: "#fff" }}>
            {stage.saving ? "Finding your matches..." : "Confirm and find my matches"}
          </button>
          <button onClick={() => setStage({ kind: "upload" })} className="text-sm cursor-pointer" style={{ color: "var(--foreground)" }}>Upload a different CV</button>
          <button onClick={deleteCv} className="text-sm cursor-pointer inline-flex items-center gap-1" style={muted}><Trash2 size={14} /> Delete my CV</button>
        </div>
      </div>
    );
  }

  // ---------- 3. Matches ----------
  const { profile, matches, openingsStored } = stage;
  const prefs = [
    profile.preferredRoles.join(", ") || "All roles",
    profile.preferredLevels.map((l) => (l === "Unspecified" ? "Level not stated" : l)).join(", ") || "All levels",
    profile.preferredRegions.join(", ") || "All locations",
  ].join(" · ");
  return (
    <div className="flex flex-col gap-3">
      <div className={card} style={cardStyle}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              {profile.highestDegree ? `${profile.highestDegree}${profile.degreeField ? ` in ${profile.degreeField}` : ""} · ` : ""}
              {profile.careerStage}
              {profile.yearsExperience ? ` (~${profile.yearsExperience} yrs)` : ""}
            </p>
            <p className="text-sm" style={muted}>{prefs}</p>
            {profile.cvFileName && <p className="text-xs mt-0.5" style={muted}>From {profile.cvFileName}</p>}
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <button onClick={() => setStage({ kind: "upload", back: stage })} className="text-sm cursor-pointer inline-flex items-center gap-1" style={{ color: "var(--foreground)" }}><FileUp size={14} /> Update CV</button>
            <button onClick={() => setStage({ kind: "review", profile })} className="text-sm cursor-pointer" style={{ color: GOLD }}>Edit profile</button>
            <button onClick={deleteCv} className="text-sm cursor-pointer inline-flex items-center gap-1" style={muted}><Trash2 size={14} /> Delete my CV</button>
          </div>
        </div>
      </div>

      <p className="text-sm" style={muted}>
        {matches.length ? `Your ${matches.length} best matches out of ${openingsStored} current openings, each with a fit score out of 100. Updated daily.` : ""}
      </p>
      {!matches.length && (
        <p className="text-sm py-8 text-center" style={muted}>
          {openingsStored ? "No openings match your preferences right now. Try widening your roles or locations." : "Openings are being collected. Check back after the next daily update."}
        </p>
      )}

      {matches.map((m) => (
        <div key={m.openingId} className="rounded-xl p-4 flex gap-4" style={cardStyle}>
          <div className="shrink-0 w-14 h-14 rounded-full grid place-content-center text-center" title={`Fit score: ${m.score} out of 100`} aria-label={`Fit score ${m.score} out of 100`} style={{ border: `3px solid ${m.score >= 80 ? GOLD : "var(--border)"}` }}>
            <span className="text-lg font-bold leading-none" style={{ color: "var(--foreground)" }}>{m.score}</span>
            <span className="text-[10px] leading-none mt-0.5" style={muted}>/100</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase mb-0.5" style={{ color: GOLD, letterSpacing: "1px" }}>
              {m.opening.firm}
              {m.opening.isNew && <span className="ml-2 px-1.5 py-0.5 rounded text-white normal-case" style={{ backgroundColor: GREEN, letterSpacing: 0 }}>New today</span>}
            </p>
            <h3 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>{m.opening.title}</h3>
            <p className="text-sm mb-2" style={muted}>
              {m.opening.role} · {m.opening.level === "Unspecified" ? "Level not stated" : m.opening.level} · {m.opening.location.length > 60 ? `${m.opening.regions.slice(0, 3).join(", ")} +more` : m.opening.location}
            </p>
            {m.matchedSkills.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <span className="text-xs w-16 shrink-0" style={muted}>You have</span>
                {m.matchedSkills.map((s) => <span key={s} className="text-xs rounded-full px-2 py-0.5" style={{ backgroundColor: "#2A604814", color: GREEN }}>{s}</span>)}
              </div>
            )}
            {m.missingSkills.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <span className="text-xs w-16 shrink-0" style={muted}>Gaps</span>
                {m.missingSkills.map((s) => <span key={s} className="text-xs rounded-full px-2 py-0.5" style={{ backgroundColor: "#a1620714", color: GOLD }}>{s}</span>)}
              </div>
            )}
            {m.notes.length > 0 && <p className="text-xs mt-1" style={muted}>{m.notes.join(" · ")}</p>}
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              <a
                href={m.opening.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => openPostingWindow(e, m.opening.url)}
                className="px-4 py-1.5 text-sm font-medium rounded-lg cursor-pointer hover:opacity-90"
                style={{ backgroundColor: GOLD, color: "#ffffff" }}
              >
                View &amp; apply
              </a>
              {m.opening.epigramLabel && (
                <Link href="/problems" className="text-sm cursor-pointer hover:opacity-70" style={{ color: GOLD }}>
                  Practise {m.opening.epigramLabel} problems
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
