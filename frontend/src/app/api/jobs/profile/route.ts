import { NextRequest, NextResponse } from 'next/server';
import { getLibraryViewer } from '@/lib/library/server';
import { CV_MAX_BYTES, detectCvKind, extractCvText } from '@/lib/jobs/cv-text';
import { deriveFields, extractProfileSections, sanitizeSections } from '@/lib/jobs/profile';
import { rematchUser } from '@/lib/jobs/refresh';
import { getJobsStore } from '@/lib/jobs/store';
import { CAREER_STAGES, JOB_LEVELS, JOB_ROLES, type CareerStage, type CvProfile } from '@/lib/jobs/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const NO_STORE = { 'Cache-Control': 'private, no-store' };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: NO_STORE });

const CONTENT_TYPES = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
} as const;

const pick = (v: unknown, allowed: readonly string[], max = 20): string[] =>
  Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string' && allowed.includes(x)))].slice(0, max) : [];

/** Anyone signed in may read or delete their own CV data, even after Premium lapses. */
export async function GET(request: NextRequest) {
  const viewer = await getLibraryViewer(request);
  if (!viewer) return json({ error: 'Sign in required' }, 401);
  try {
    return json({ profile: await getJobsStore().getProfile(viewer.userId), isPro: viewer.isPro });
  } catch (error) {
    console.error('CV profile read error:', error);
    return json({ error: 'Failed to load' }, 500);
  }
}

/** Upload a CV: store the file, read it, and save an unconfirmed profile for the user to review. */
export async function POST(request: NextRequest) {
  const viewer = await getLibraryViewer(request);
  if (!viewer) return json({ error: 'Sign in required' }, 401);
  if (!viewer.isPro) return json({ error: 'Subscription required' }, 403);

  try {
    const form = await request.formData();
    if (form.get('consent') !== 'yes') return json({ error: 'Please agree to CV processing first.' }, 400);
    const file = form.get('file');
    if (!(file instanceof File)) return json({ error: 'No file uploaded.' }, 400);
    if (file.size > CV_MAX_BYTES) return json({ error: 'The file is larger than 5 MB.' }, 400);

    const bytes = new Uint8Array(await file.arrayBuffer());
    const kind = detectCvKind(bytes);
    if (!kind) return json({ error: 'Please upload a PDF or Word (.docx) file.' }, 400);

    let text: string;
    try {
      text = await extractCvText(bytes, kind);
    } catch (error) {
      console.error('CV text extraction failed:', error instanceof Error ? error.message : error);
      return json({ error: "We couldn't open this file. Is it password-protected or damaged? Try saving it again as a PDF." }, 400);
    }
    if (text.length < 200) return json({ error: "We couldn't read text from this file. Is it a scanned image?" }, 400);

    const store = getJobsStore();
    const previous = await store.getProfile(viewer.userId);
    const { sections, model } = await extractProfileSections(text);
    const storagePath = await store.saveCvFile(viewer.userId, file.name, bytes, CONTENT_TYPES[kind]);
    const now = new Date().toISOString();

    const profile: CvProfile = {
      userId: viewer.userId,
      cvFileName: file.name.slice(0, 120),
      cvUploadedAt: now,
      cvStoragePath: storagePath,
      ...sections,
      ...deriveFields(sections),
      extractedAt: now,
      extractionModel: model,
      confirmedAt: null, // the user reviews the profile before matching starts
      workAuthorization: previous?.workAuthorization ?? {},
      preferredRoles: previous?.preferredRoles ?? [],
      preferredLevels: previous?.preferredLevels ?? [],
      preferredRegions: previous?.preferredRegions ?? [],
      alertsEnabled: previous?.alertsEnabled ?? false,
      consentAt: now,
    };
    await store.saveProfile(profile);
    // Matches from the old CV no longer apply; new ones are made when the user confirms this profile.
    await store.replaceMatches(viewer.userId, []);
    // Keep only the latest CV: remove the file this upload replaced.
    if (previous?.cvStoragePath && previous.cvStoragePath !== storagePath) await store.deleteCvFile(previous.cvStoragePath);
    return json({ profile });
  } catch (error) {
    console.error('CV upload error:', error);
    return json({ error: 'Something went wrong reading your CV. Please try again.' }, 500);
  }
}

/** Save edits and preferences; with confirm: true, start matching. */
export async function PUT(request: NextRequest) {
  const viewer = await getLibraryViewer(request);
  if (!viewer) return json({ error: 'Sign in required' }, 401);
  if (!viewer.isPro) return json({ error: 'Subscription required' }, 403);

  try {
    const store = getJobsStore();
    const current = await store.getProfile(viewer.userId);
    if (!current) return json({ error: 'Upload a CV first.' }, 404);
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'Invalid request.' }, 400);

    const sections = body.sections ? sanitizeSections(body.sections) : {
      education: current.education, experiences: current.experiences, skills: current.skills,
      achievements: current.achievements, languages: current.languages, projects: current.projects,
      links: current.links, summary: current.summary,
    };
    const stage = typeof body.careerStage === 'string' && (CAREER_STAGES as readonly string[]).includes(body.careerStage)
      ? (body.careerStage as CareerStage) : current.careerStage;
    const auth = body.workAuthorization && typeof body.workAuthorization === 'object' ? body.workAuthorization as Record<string, unknown> : current.workAuthorization;

    const profile: CvProfile = {
      ...current,
      ...sections,
      ...deriveFields(sections, stage),
      preferredRoles: body.preferredRoles !== undefined ? pick(body.preferredRoles, JOB_ROLES) : current.preferredRoles,
      preferredLevels: body.preferredLevels !== undefined ? pick(body.preferredLevels, JOB_LEVELS) : current.preferredLevels,
      preferredRegions: Array.isArray(body.preferredRegions)
        ? [...new Set(body.preferredRegions.filter((r): r is string => typeof r === 'string' && r.length <= 40))].slice(0, 15)
        : current.preferredRegions,
      alertsEnabled: typeof body.alertsEnabled === 'boolean' ? body.alertsEnabled : current.alertsEnabled,
      workAuthorization: Object.fromEntries(
        Object.entries(auth).filter(([k, v]) => /^[A-Za-z ]{2,30}$/.test(k) && ['authorized', 'needs_sponsorship'].includes(String(v))).slice(0, 10)
      ) as Record<string, string>,
      confirmedAt: body.confirm === true ? new Date().toISOString() : current.confirmedAt,
    };
    await store.saveProfile(profile);
    const matched = profile.confirmedAt ? await rematchUser(profile) : 0;
    return json({ profile, matched });
  } catch (error) {
    console.error('CV profile update error:', error);
    return json({ error: 'Failed to save' }, 500);
  }
}

export async function DELETE(request: NextRequest) {
  const viewer = await getLibraryViewer(request);
  if (!viewer) return json({ error: 'Sign in required' }, 401);
  try {
    await getJobsStore().deleteUserData(viewer.userId);
    return json({ deleted: true });
  } catch (error) {
    console.error('CV delete error:', error);
    return json({ error: 'Failed to delete' }, 500);
  }
}
