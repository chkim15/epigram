import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import type { CvProfile, JobMatch, TaggedOpening } from './types';

export type StoredOpening = TaggedOpening & { firstSeenAt: string; lastSeenAt: string; isActive: boolean };

export interface RefreshRun {
  startedAt: string;
  finishedAt: string;
  firmsOk: number;
  firmsFailed: string[];
  openingsSeen: number;
  openingsNew: number;
  openingsClosed: number;
}

/** Where step B keeps openings, CV profiles, CV files and matches. */
export interface JobsStore {
  kind: 'file' | 'supabase';
  /** Upsert this run's openings. Openings from firms that failed this run are left untouched. */
  saveOpenings(openings: TaggedOpening[], okFirms: string[], seenAt: string): Promise<{ added: number; closed: number }>;
  activeOpenings(): Promise<StoredOpening[]>;
  logRun(run: RefreshRun): Promise<void>;
  getProfile(userId: string): Promise<CvProfile | null>;
  saveProfile(profile: CvProfile): Promise<void>;
  confirmedProfiles(): Promise<CvProfile[]>;
  saveCvFile(userId: string, fileName: string, bytes: Uint8Array, contentType: string): Promise<string>;
  /** Remove one stored CV file (used when a user uploads a new CV). Never throws. */
  deleteCvFile(storagePath: string): Promise<void>;
  /** Removes the user's profile, matches and every CV file they uploaded. */
  deleteUserData(userId: string): Promise<void>;
  replaceMatches(userId: string, matches: JobMatch[]): Promise<void>;
  getMatches(userId: string): Promise<JobMatch[]>;
}

/**
 * Local development: JOBS_DEV_STORE=file in .env.development.local keeps everything in the
 * gitignored .protected-content/jobs/ folder, so the whole flow runs without the migration.
 * It can never apply outside `next dev`.
 */
export function getJobsStore(): JobsStore {
  return process.env.NODE_ENV === 'development' && process.env.JOBS_DEV_STORE === 'file' ? fileStore : supabaseStore;
}

const safeName = (name: string) => name.replace(/[^\w.-]+/g, '_').slice(-80) || 'cv';

// ---------------------------------------------------------------------------------------------
// File store (development only)
// ---------------------------------------------------------------------------------------------

interface FileData {
  openings: Record<string, StoredOpening>;
  runs: RefreshRun[];
  profiles: Record<string, CvProfile>;
  matches: Record<string, JobMatch[]>;
}

const DEV_DIR = path.join(process.cwd(), '.protected-content', 'jobs');
const DEV_FILE = path.join(DEV_DIR, 'store.json');
let queue: Promise<unknown> = Promise.resolve();

async function readData(): Promise<FileData> {
  try {
    return JSON.parse(await fs.readFile(DEV_FILE, 'utf8')) as FileData;
  } catch {
    return { openings: {}, runs: [], profiles: {}, matches: {} };
  }
}

/** Serialise read-modify-write cycles so concurrent requests can't overwrite each other. */
function withData<T>(fn: (data: FileData) => T | Promise<T>, write = false): Promise<T> {
  const next = queue.then(async () => {
    const data = await readData();
    const result = await fn(data);
    if (write) {
      await fs.mkdir(DEV_DIR, { recursive: true });
      await fs.writeFile(DEV_FILE, JSON.stringify(data));
    }
    return result;
  });
  queue = next.catch(() => undefined);
  return next;
}

const fileStore: JobsStore = {
  kind: 'file',
  saveOpenings: (openings, okFirms, seenAt) => withData((d) => {
    let added = 0;
    let closed = 0;
    const seenIds = new Set(openings.map((o) => o.id));
    for (const o of openings) {
      const prev = d.openings[o.id];
      if (!prev) added++;
      d.openings[o.id] = { ...o, firstSeenAt: prev?.firstSeenAt ?? seenAt, lastSeenAt: seenAt, isActive: true };
    }
    for (const o of Object.values(d.openings)) {
      if (o.isActive && okFirms.includes(o.firm) && !seenIds.has(o.id)) { o.isActive = false; closed++; }
    }
    return { added, closed };
  }, true),
  activeOpenings: () => withData((d) => Object.values(d.openings).filter((o) => o.isActive)),
  logRun: (run) => withData((d) => { d.runs = [...d.runs, run].slice(-60); }, true),
  getProfile: (userId) => withData((d) => d.profiles[userId] ?? null),
  saveProfile: (profile) => withData((d) => { d.profiles[profile.userId] = profile; }, true),
  confirmedProfiles: () => withData((d) => Object.values(d.profiles).filter((p) => p.confirmedAt)),
  saveCvFile: async (userId, fileName, bytes) => {
    const rel = path.join(safeName(userId), `${Date.now()}-${safeName(fileName)}`);
    const full = path.join(DEV_DIR, 'cvs', rel);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, bytes);
    return rel;
  },
  deleteCvFile: async (storagePath) => {
    await fs.rm(path.join(DEV_DIR, 'cvs', storagePath), { force: true }).catch(() => undefined);
  },
  deleteUserData: async (userId) => {
    await withData((d) => { delete d.profiles[userId]; delete d.matches[userId]; }, true);
    await fs.rm(path.join(DEV_DIR, 'cvs', safeName(userId)), { recursive: true, force: true });
  },
  replaceMatches: (userId, matches) => withData((d) => { d.matches[userId] = matches; }, true),
  getMatches: (userId) => withData((d) => d.matches[userId] ?? []),
};

// ---------------------------------------------------------------------------------------------
// Supabase store (production): tables from supabase/migrations/20261106_create_job_matching.sql
// ---------------------------------------------------------------------------------------------

function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function check<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

const PAGE = 1000;

interface OpeningRow {
  id: string; firm: string; firm_type: string; title: string; location: string; regions: string[];
  role: string; level: string; url: string; description: string; epigram_label: string | null;
  posted_at: string | null; first_seen_at: string; last_seen_at: string; is_active: boolean;
}

const toOpening = (r: OpeningRow): StoredOpening => ({
  id: r.id, firm: r.firm, firmType: r.firm_type as StoredOpening['firmType'], title: r.title, location: r.location,
  regions: r.regions, role: r.role as StoredOpening['role'], level: r.level as StoredOpening['level'], url: r.url,
  description: r.description, epigramLabel: r.epigram_label, postedAt: r.posted_at,
  firstSeenAt: r.first_seen_at, lastSeenAt: r.last_seen_at, isActive: r.is_active,
});

interface ProfileRow {
  user_id: string; cv_storage_path: string | null; cv_file_name: string | null; cv_uploaded_at: string | null;
  education: CvProfile['education']; experiences: CvProfile['experiences']; skills: CvProfile['skills'];
  achievements: CvProfile['achievements']; languages: CvProfile['languages']; projects: CvProfile['projects'];
  links: CvProfile['links']; summary: string | null; highest_degree: CvProfile['highestDegree'];
  degree_field: string | null; graduation_year: number | null; career_stage: CvProfile['careerStage'];
  years_experience: number | null; extracted_at: string | null; extraction_model: string | null;
  confirmed_at: string | null; work_authorization: Record<string, string>; preferred_roles: string[];
  preferred_levels: string[]; preferred_regions: string[]; alerts_enabled: boolean; consent_at: string;
}

const toProfile = (r: ProfileRow): CvProfile => ({
  userId: r.user_id, cvStoragePath: r.cv_storage_path, cvFileName: r.cv_file_name, cvUploadedAt: r.cv_uploaded_at,
  education: r.education, experiences: r.experiences, skills: r.skills, achievements: r.achievements,
  languages: r.languages, projects: r.projects, links: r.links, summary: r.summary,
  highestDegree: r.highest_degree, degreeField: r.degree_field, graduationYear: r.graduation_year,
  careerStage: r.career_stage, yearsExperience: r.years_experience === null ? null : Number(r.years_experience),
  extractedAt: r.extracted_at, extractionModel: r.extraction_model, confirmedAt: r.confirmed_at,
  workAuthorization: r.work_authorization, preferredRoles: r.preferred_roles, preferredLevels: r.preferred_levels,
  preferredRegions: r.preferred_regions, alertsEnabled: r.alerts_enabled, consentAt: r.consent_at,
});

const fromProfile = (p: CvProfile): ProfileRow => ({
  user_id: p.userId, cv_storage_path: p.cvStoragePath, cv_file_name: p.cvFileName, cv_uploaded_at: p.cvUploadedAt,
  education: p.education, experiences: p.experiences, skills: p.skills, achievements: p.achievements,
  languages: p.languages, projects: p.projects, links: p.links, summary: p.summary,
  highest_degree: p.highestDegree, degree_field: p.degreeField, graduation_year: p.graduationYear,
  career_stage: p.careerStage, years_experience: p.yearsExperience, extracted_at: p.extractedAt,
  extraction_model: p.extractionModel, confirmed_at: p.confirmedAt, work_authorization: p.workAuthorization,
  preferred_roles: p.preferredRoles, preferred_levels: p.preferredLevels, preferred_regions: p.preferredRegions,
  alerts_enabled: p.alertsEnabled, consent_at: p.consentAt,
});

async function allRows<T>(query: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const page = check(await query(from, from + PAGE - 1)) ?? [];
    rows.push(...page);
    if (page.length < PAGE) return rows;
  }
}

const supabaseStore: JobsStore = {
  kind: 'supabase',
  async saveOpenings(openings, okFirms, seenAt) {
    const db = admin();
    const existing = new Set((await allRows<{ id: string }>((a, b) => db.from('job_openings').select('id').order('id').range(a, b))).map((r) => r.id));
    const row = (o: TaggedOpening) => ({
      id: o.id, firm: o.firm, firm_type: o.firmType, title: o.title, location: o.location, regions: o.regions,
      role: o.role, level: o.level, url: o.url, description: o.description, epigram_label: o.epigramLabel,
      posted_at: o.postedAt, last_seen_at: seenAt, is_active: true,
    });
    // New and existing rows go in separate batches: every row in a batch must have the same columns,
    // and existing rows must keep their original first_seen_at.
    const fresh = openings.filter((o) => !existing.has(o.id)).map((o) => ({ ...row(o), first_seen_at: seenAt }));
    const known = openings.filter((o) => existing.has(o.id)).map(row);
    for (const batch of [fresh, known]) {
      for (let i = 0; i < batch.length; i += 500) {
        check(await db.from('job_openings').upsert(batch.slice(i, i + 500), { onConflict: 'id' }));
      }
    }
    // Close openings from firms that answered this run but no longer list them.
    const closedRows = check(await db.from('job_openings').update({ is_active: false })
      .eq('is_active', true).in('firm', okFirms).lt('last_seen_at', seenAt).select('id')) ?? [];
    return { added: openings.filter((o) => !existing.has(o.id)).length, closed: closedRows.length };
  },
  async activeOpenings() {
    const db = admin();
    return (await allRows<OpeningRow>((a, b) => db.from('job_openings').select('*').eq('is_active', true).order('id').range(a, b))).map(toOpening);
  },
  async logRun(run) {
    check(await admin().from('job_refresh_runs').insert({
      started_at: run.startedAt, finished_at: run.finishedAt, firms_ok: run.firmsOk, firms_failed: run.firmsFailed,
      openings_seen: run.openingsSeen, openings_new: run.openingsNew, openings_closed: run.openingsClosed,
    }));
  },
  async getProfile(userId) {
    const row = check(await admin().from('user_cv_profiles').select('*').eq('user_id', userId).maybeSingle()) as ProfileRow | null;
    return row ? toProfile(row) : null;
  },
  async saveProfile(profile) {
    check(await admin().from('user_cv_profiles').upsert(fromProfile(profile), { onConflict: 'user_id' }));
  },
  async confirmedProfiles() {
    const db = admin();
    return (await allRows<ProfileRow>((a, b) => db.from('user_cv_profiles').select('*').not('confirmed_at', 'is', null).order('user_id').range(a, b))).map(toProfile);
  },
  async saveCvFile(userId, fileName, bytes, contentType) {
    const objectPath = `${userId}/${Date.now()}-${safeName(fileName)}`;
    check(await admin().storage.from('cvs').upload(objectPath, bytes, { contentType, upsert: false }));
    return objectPath;
  },
  async deleteCvFile(storagePath) {
    try {
      const { error } = await admin().storage.from('cvs').remove([storagePath]);
      if (error) console.error('Old CV delete failed:', error.message);
    } catch (error) {
      console.error('Old CV delete failed:', error instanceof Error ? error.message : error);
    }
  },
  async deleteUserData(userId) {
    const db = admin();
    const files = check(await db.storage.from('cvs').list(userId, { limit: 100 })) ?? [];
    if (files.length) check(await db.storage.from('cvs').remove(files.map((f) => `${userId}/${f.name}`)));
    check(await db.from('job_matches').delete().eq('user_id', userId));
    check(await db.from('user_cv_profiles').delete().eq('user_id', userId));
  },
  async replaceMatches(userId, matches) {
    const db = admin();
    check(await db.from('job_matches').delete().eq('user_id', userId));
    if (matches.length) {
      check(await db.from('job_matches').insert(matches.map((m) => ({
        user_id: userId, opening_id: m.openingId, score: m.score, matched_skills: m.matchedSkills,
        missing_skills: m.missingSkills, notes: m.notes, computed_at: m.computedAt,
      }))));
    }
  },
  async getMatches(userId) {
    const rows = check(await admin().from('job_matches').select('*').eq('user_id', userId).order('score', { ascending: false })) as
      { opening_id: string; score: number; matched_skills: string[]; missing_skills: string[]; notes: string[]; computed_at: string }[] | null;
    return (rows ?? []).map((r) => ({
      openingId: r.opening_id, score: r.score, matchedSkills: r.matched_skills, missingSkills: r.missing_skills,
      notes: r.notes, computedAt: r.computed_at,
    }));
  },
};
