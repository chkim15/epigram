import { JOB_FIRMS, fetchFirmOpenings } from './server';
import { scoreMatches } from './match';
import { getJobsStore, type RefreshRun } from './store';
import type { CvProfile, FirmType, JobMatchView, TaggedOpening } from './types';

/**
 * The daily job: store the firms' current openings, then recompute everyone's matches.
 * `firmType` limits a run to one group (trading firms or banks), so each scheduled call stays
 * well inside the serverless time limit; banks' careers sites are the slow ones.
 */
export async function refreshOpeningsAndMatches(firmType?: FirmType): Promise<RefreshRun & { profilesMatched: number; store: string }> {
  const store = getJobsStore();
  const startedAt = new Date().toISOString();

  // Locations already stored, so multi-city Workday openings aren't looked up again every day.
  const knownLocations = new Map((await store.activeOpenings()).map((o) => [o.id, o.location]));

  // Up to 20 firms at a time: fast enough for the 60s function limit, polite to each careers site.
  const results: { firm: string; openings: TaggedOpening[] | null }[] = [];
  const queue = JOB_FIRMS.filter((f) => !firmType || f.type === firmType);
  await Promise.all(Array.from({ length: 20 }, async () => {
    for (let firm = queue.shift(); firm; firm = queue.shift()) {
      const t0 = Date.now();
      try {
        results.push({ firm: firm.name, openings: await fetchFirmOpenings(firm, knownLocations) });
        const seconds = (Date.now() - t0) / 1000;
        if (seconds > 10) console.warn(`Jobs refresh: ${firm.name} took ${seconds.toFixed(1)}s`);
      } catch (error) {
        console.error(`Jobs refresh error (${firm.name}):`, error instanceof Error ? error.message : error);
        results.push({ firm: firm.name, openings: null });
      }
    }
  }));

  const ok = results.filter((r) => r.openings);
  // One row per id: the same posting can come back twice (e.g. from two search terms), and a
  // database upsert fails if one batch touches a row twice.
  const openings = [...new Map(ok.flatMap((r) => r.openings as TaggedOpening[]).map((o) => [o.id, o])).values()];
  const { added, closed } = await store.saveOpenings(openings, ok.map((r) => r.firm), startedAt);

  const active = await store.activeOpenings();
  const profiles = await store.confirmedProfiles();
  for (const profile of profiles) {
    await store.replaceMatches(profile.userId, scoreMatches(profile, active));
  }

  const run: RefreshRun = {
    startedAt,
    finishedAt: new Date().toISOString(),
    firmsOk: ok.length,
    firmsFailed: results.filter((r) => !r.openings).map((r) => r.firm),
    openingsSeen: openings.length,
    openingsNew: added,
    openingsClosed: closed,
  };
  await store.logRun(run);
  return { ...run, profilesMatched: profiles.length, store: store.kind };
}

/** Recompute one user's matches right away (after they confirm or edit their profile). */
export async function rematchUser(profile: CvProfile): Promise<number> {
  const store = getJobsStore();
  const active = await store.activeOpenings();
  const matches = scoreMatches(profile, active);
  await store.replaceMatches(profile.userId, matches);
  return matches.length;
}

/** A user's saved matches joined with their openings, best first. */
export async function matchesWithOpenings(userId: string): Promise<{ matches: JobMatchView[]; openingsStored: number }> {
  const store = getJobsStore();
  const [matches, active] = await Promise.all([store.getMatches(userId), store.activeOpenings()]);
  const byId = new Map(active.map((o) => [o.id, o]));
  // A firm's first refresh finds all of its openings at once, so those never count as new. This is
  // per firm: trading firms and banks refresh in separate runs, and firms can be added later.
  const baseline = new Map<string, string>();
  for (const o of active) {
    const b = baseline.get(o.firm);
    if (!b || o.firstSeenAt < b) baseline.set(o.firm, o.firstSeenAt);
  }
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const views: JobMatchView[] = [];
  for (const m of matches) {
    const o = byId.get(m.openingId);
    if (!o) continue; // closed since the last match run
    views.push({
      ...m,
      opening: {
        id: o.id, firm: o.firm, firmType: o.firmType, title: o.title, location: o.location, regions: o.regions,
        role: o.role, level: o.level, url: o.url, postedAt: o.postedAt, epigramLabel: o.epigramLabel,
        firstSeenAt: o.firstSeenAt,
        isNew: o.firstSeenAt !== baseline.get(o.firm) && o.firstSeenAt >= dayAgo,
      },
    });
  }
  return { matches: views.sort((a, b) => b.score - a.score), openingsStored: active.length };
}
