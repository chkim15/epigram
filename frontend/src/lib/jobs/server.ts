import { unstable_cache } from 'next/cache';
import type { JobLevel, JobOpening, JobRole, JobsFeed } from './types';

// Quant firms whose openings come from official public job-board APIs (Greenhouse, Ashby).
// These APIs exist so job boards can read them; no scraping is involved.
const FIRMS: { name: string; ats: 'greenhouse' | 'ashby'; slug: string; epigramLabel: string | null }[] = [
  { name: 'Jane Street', ats: 'greenhouse', slug: 'janestreet', epigramLabel: 'Jane Street' },
  { name: 'Point72', ats: 'greenhouse', slug: 'point72', epigramLabel: 'Point72' },
  { name: 'DRW', ats: 'greenhouse', slug: 'drweng', epigramLabel: null },
  { name: 'IMC Trading', ats: 'greenhouse', slug: 'imc', epigramLabel: 'IMC Trading' },
  { name: 'Jump Trading', ats: 'greenhouse', slug: 'jumptrading', epigramLabel: 'Jump Trading' },
  { name: 'Tower Research', ats: 'greenhouse', slug: 'towerresearchcapital', epigramLabel: null },
  { name: 'Squarepoint', ats: 'greenhouse', slug: 'squarepointcapital', epigramLabel: 'Squarepoint' },
  { name: 'WorldQuant', ats: 'greenhouse', slug: 'worldquant', epigramLabel: 'WorldQuant' },
  { name: 'AQR', ats: 'greenhouse', slug: 'aqr', epigramLabel: null },
  { name: 'Virtu', ats: 'greenhouse', slug: 'virtu', epigramLabel: null },
  { name: 'Flow Traders', ats: 'greenhouse', slug: 'flowtraders', epigramLabel: null },
  { name: 'Akuna Capital', ats: 'greenhouse', slug: 'akunacapital', epigramLabel: null },
  { name: 'Chicago Trading Co', ats: 'greenhouse', slug: 'chicagotrading', epigramLabel: null },
  { name: 'PDT Partners', ats: 'greenhouse', slug: 'pdtpartners', epigramLabel: null },
  { name: 'Maven Securities', ats: 'ashby', slug: 'maven', epigramLabel: null },
];

const REFRESH_SECONDS = 6 * 60 * 60;

interface RawJob {
  id: string;
  title: string;
  location: string;
  department: string;
  description: string;
  url: string;
  postedAt: string | null;
}

interface GreenhouseJob {
  id: number;
  title: string;
  absolute_url: string;
  first_published?: string;
  updated_at?: string;
  location?: { name?: string };
  departments?: { name: string }[];
  content?: string;
}

interface AshbyJob {
  id: string;
  title: string;
  location?: string;
  department?: string;
  jobUrl: string;
  publishedAt?: string;
  isListed?: boolean;
  descriptionPlain?: string;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'").replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
}

// Greenhouse sends its job HTML entity-encoded; only plain text is needed for tagging.
function htmlToText(s: string | undefined): string {
  return decodeEntities(decodeEntities(s ?? '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

async function fetchFirm(firm: (typeof FIRMS)[number]): Promise<RawJob[]> {
  const url = firm.ats === 'greenhouse'
    ? `https://boards-api.greenhouse.io/v1/boards/${firm.slug}/jobs?content=true`
    : `https://api.ashbyhq.com/posting-api/job-board/${firm.slug}`;
  // The whole feed is cached below, so skip the per-request fetch cache (Greenhouse responses can exceed its size limit).
  const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`${firm.name}: HTTP ${res.status}`);
  const data = await res.json();

  if (firm.ats === 'greenhouse') {
    return (data.jobs as GreenhouseJob[]).map((j) => ({
      id: `gh-${firm.slug}-${j.id}`,
      title: j.title.trim(),
      location: j.location?.name ?? '',
      department: (j.departments ?? []).map((d) => d.name).join(', '),
      description: htmlToText(j.content).slice(0, 8000),
      url: j.absolute_url,
      postedAt: j.first_published ?? j.updated_at ?? null,
    }));
  }
  return (data.jobs as AshbyJob[])
    .filter((j) => j.isListed !== false)
    .map((j) => ({
      id: `ashby-${firm.slug}-${j.id}`,
      title: j.title.trim(),
      location: j.location ?? '',
      department: j.department ?? '',
      description: (j.descriptionPlain ?? '').slice(0, 8000),
      url: j.jobUrl,
      postedAt: j.publishedAt ?? null,
    }));
}

// ---------- tagging (keyword rules; to be replaced by an LLM pass once postings are stored) ----------

const NOT_QUANT = new RegExp(
  '(recruit|talent|human resources|\\bhr\\b|people partner|legal|counsel|paralegal|complian|' +
  'accountant|accounting|payroll|tax\\b|audit|treasury|office manager|facilit|receptionist|' +
  'executive assistant|administrative|admin assistant|marketing|communications|events?\\b|' +
  'investor relations|business development|sales|client service|procurement|vendor|' +
  'help ?desk|desktop support|it support|service desk|workplace|security officer|chef|' +
  'benefits|operations(?! research)|middle office|back office|settlement|project manager|' +
  'programm?e? manager|coordinator|specialist|connect with us|' +
  'fund accounting|reconciliation|kyc|aml\\b)', 'i');

const ROLE_RULES: [JobRole, RegExp][] = [
  ['Quant Researcher', /(quant\w*\s+research|research(er)?\b.*quant|quantitative analyst|alpha|\bresearcher\b|scientist|machine learning (intern|researcher)|machine learning research|statistician|portfolio construction|systematic research|\bqr\b)/i],
  ['Quant Trader', /(\btrader\b|trading (analyst|associate|intern)|quantitative trading|portfolio manager|\bpm\b|market maker|execution trader|\bqt\b)/i],
  ['Quant Developer', /(quant\w*\s+(developer|engineer|dev)|software (engineer|developer)|developer|engineer|fpga|hardware|\bswe\b|data engineer|machine learning engineer|programmer|site reliability|infrastructure|platform)/i],
  ['Data Scientist', /(data scien|data analyst|analytics)/i],
];

const LEVEL_RULES: [Exclude<JobLevel, 'Unspecified'>, RegExp][] = [
  ['Intern', /(\bintern(ship)?\b|summer (analyst|associate|program)|co-?op\b|insight (week|program))/i],
  ['New grad', /(graduate|new grad|campus|entry[- ]level|early career|junior|\bgrad\b|20(26|27|28) start|phd (program|track))/i],
  ['Experienced', /(senior|\bsr\.?\b|lead\b|head of|principal|director|\bvp\b|experienced|staff\b|manager\b)/i],
];
const YEARS_RX = /\b([2-9]|1[0-5])\s*\+?\s*(?:-\s*\d+\s*)?(years|yrs)\b[^.\n]{0,40}(experience|industry|professional)/i;
const STUDENT_RX = /(currently pursuing|graduating (in|between)|recent graduate|expected graduation|final[- ]year|completing (a|your) (degree|phd))/i;

const REGIONS: [string, RegExp][] = [
  ['New York', /new york|nyc|\bny\b/i], ['Chicago', /chicago/i], ['Austin', /austin/i], ['Boston', /boston/i],
  ['Miami', /miami/i], ['San Francisco', /san francisco|bay area/i], ['Greenwich/Stamford', /greenwich|stamford/i],
  ['London', /london/i], ['Amsterdam', /amsterdam/i], ['Dublin', /dublin/i], ['Paris', /paris/i],
  ['Zug/Zurich', /zug|zurich/i], ['Hong Kong', /hong kong/i], ['Singapore', /singapore/i], ['Sydney', /sydney/i],
  ['India', /mumbai|gurgaon|gurugram|bangalore|bengaluru|pune/i], ['Shanghai', /shanghai/i], ['Tokyo', /tokyo/i],
  ['Remote', /remote/i],
];

function tag(raw: RawJob, firm: (typeof FIRMS)[number]): JobOpening | null {
  const { title, department } = raw;
  if (NOT_QUANT.test(title)) return null;
  const role = ROLE_RULES.find(([, rx]) => rx.test(title))?.[0] ?? ROLE_RULES.find(([, rx]) => rx.test(department))?.[0];
  if (!role) return null;

  let level: JobLevel | undefined = LEVEL_RULES.find(([, rx]) => rx.test(title))?.[0];
  if (!level) level = LEVEL_RULES.slice(0, 2).find(([, rx]) => rx.test(`${title} | ${department}`))?.[0];
  if (!level) level = YEARS_RX.test(raw.description) ? 'Experienced' : STUDENT_RX.test(raw.description) ? 'New grad' : 'Unspecified';

  const regions = REGIONS.filter(([, rx]) => rx.test(raw.location)).map(([name]) => name);
  return {
    id: raw.id, firm: firm.name, title, location: raw.location,
    regions: regions.length ? regions : raw.location ? [raw.location] : [],
    role, level, url: raw.url, postedAt: raw.postedAt, epigramLabel: firm.epigramLabel,
  };
}

// Each firm is cached on its own: a feed that fails throws, so nothing is stored and the next
// request retries it, while the other firms keep serving their cached openings.
function getFirmJobs(firm: (typeof FIRMS)[number]) {
  return unstable_cache(
    async () => {
      const raws = await fetchFirm(firm);
      const jobs = raws.map((raw) => tag(raw, firm)).filter((j): j is JobOpening => j !== null);
      return { fetchedAt: new Date().toISOString(), jobs };
    },
    ['jobs-firm-v2', firm.slug],
    { revalidate: REFRESH_SECONDS }
  )();
}

/** Today's quant openings, refreshed at most every six hours per firm. */
export async function getJobsFeed(): Promise<JobsFeed> {
  const results = await Promise.allSettled(FIRMS.map(getFirmJobs));
  const jobs: JobOpening[] = [];
  const fetched: string[] = [];
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(`Jobs feed error (${FIRMS[i].name}):`, r.reason instanceof Error ? r.reason.message : r.reason);
      return;
    }
    jobs.push(...r.value.jobs);
    fetched.push(r.value.fetchedAt);
  });
  jobs.sort((a, b) => (b.postedAt ?? '').localeCompare(a.postedAt ?? ''));
  return {
    fetchedAt: fetched.sort()[0] ?? new Date().toISOString(),
    firms: FIRMS.map((f, i) => ({ name: f.name, ok: results[i].status === 'fulfilled' })),
    jobs,
  };
}
