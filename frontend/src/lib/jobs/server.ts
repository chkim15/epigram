import { unstable_cache } from 'next/cache';
import type { FirmType, JobLevel, JobOpening, JobRole, JobsFeed, TaggedOpening } from './types';

// Openings come from each firm's own careers system through the public JSON feeds their
// careers pages use (Greenhouse, Lever, Ashby, Workday, Oracle). Every source here was checked
// against the site's robots.txt; sites that ask crawlers to stay out (e.g. Citi, Goldman Sachs)
// are linked from the page instead (MORE_JOB_LINKS).

type Source =
  | { ats: 'greenhouse' | 'lever' | 'ashby'; slug: string }
  | { ats: 'workday'; host: string; tenant: string; site: string }
  | { ats: 'oracle'; host: string; siteNumber: string };

export interface Firm {
  name: string;
  type: FirmType;
  source: Source;
  epigramLabel: string | null;
}

const TRADING: FirmType = 'Trading firms & funds';
const BANK: FirmType = 'Banks & asset managers';

const FIRMS: Firm[] = [
  // Trading firms and hedge funds: their whole board, filtered to quant roles below
  { name: 'Jane Street', type: TRADING, source: { ats: 'greenhouse', slug: 'janestreet' }, epigramLabel: 'Jane Street' },
  { name: 'Optiver', type: TRADING, source: { ats: 'greenhouse', slug: 'optiverus' }, epigramLabel: null },
  { name: 'Hudson River Trading', type: TRADING, source: { ats: 'greenhouse', slug: 'wehrtyou' }, epigramLabel: 'HRT' },
  { name: 'Point72', type: TRADING, source: { ats: 'greenhouse', slug: 'point72' }, epigramLabel: 'Point72' },
  { name: 'DRW', type: TRADING, source: { ats: 'greenhouse', slug: 'drweng' }, epigramLabel: null },
  { name: 'IMC Trading', type: TRADING, source: { ats: 'greenhouse', slug: 'imc' }, epigramLabel: 'IMC Trading' },
  { name: 'Jump Trading', type: TRADING, source: { ats: 'greenhouse', slug: 'jumptrading' }, epigramLabel: 'Jump Trading' },
  { name: 'Tower Research', type: TRADING, source: { ats: 'greenhouse', slug: 'towerresearchcapital' }, epigramLabel: null },
  { name: 'Squarepoint', type: TRADING, source: { ats: 'greenhouse', slug: 'squarepointcapital' }, epigramLabel: 'Squarepoint' },
  { name: 'WorldQuant', type: TRADING, source: { ats: 'greenhouse', slug: 'worldquant' }, epigramLabel: 'WorldQuant' },
  { name: 'Five Rings', type: TRADING, source: { ats: 'greenhouse', slug: 'fiveringsllc' }, epigramLabel: 'Five Rings' },
  { name: 'Voleon', type: TRADING, source: { ats: 'ashby', slug: 'voleon' }, epigramLabel: 'Voleon Group' },
  { name: 'Schonfeld', type: TRADING, source: { ats: 'greenhouse', slug: 'schonfeld' }, epigramLabel: null },
  { name: 'Bridgewater', type: TRADING, source: { ats: 'greenhouse', slug: 'bridgewater89' }, epigramLabel: null },
  { name: 'AQR', type: TRADING, source: { ats: 'greenhouse', slug: 'aqr' }, epigramLabel: null },
  { name: 'DV Trading', type: TRADING, source: { ats: 'greenhouse', slug: 'dvtrading' }, epigramLabel: null },
  { name: 'Virtu', type: TRADING, source: { ats: 'greenhouse', slug: 'virtu' }, epigramLabel: null },
  { name: 'Flow Traders', type: TRADING, source: { ats: 'greenhouse', slug: 'flowtraders' }, epigramLabel: null },
  { name: 'Akuna Capital', type: TRADING, source: { ats: 'greenhouse', slug: 'akunacapital' }, epigramLabel: null },
  { name: 'Belvedere Trading', type: TRADING, source: { ats: 'lever', slug: 'belvederetrading' }, epigramLabel: null },
  { name: 'Chicago Trading Co', type: TRADING, source: { ats: 'greenhouse', slug: 'chicagotrading' }, epigramLabel: null },
  { name: 'GSA Capital', type: TRADING, source: { ats: 'greenhouse', slug: 'gsacapital' }, epigramLabel: null },
  { name: 'Geneva Trading', type: TRADING, source: { ats: 'greenhouse', slug: 'genevatrading' }, epigramLabel: null },
  { name: 'PDT Partners', type: TRADING, source: { ats: 'greenhouse', slug: 'pdtpartners' }, epigramLabel: null },
  { name: 'Engineers Gate', type: TRADING, source: { ats: 'greenhouse', slug: 'engineersgate' }, epigramLabel: null },
  { name: 'Vatic Labs', type: TRADING, source: { ats: 'greenhouse', slug: 'vaticlabs' }, epigramLabel: null },
  { name: 'XTX Markets', type: TRADING, source: { ats: 'greenhouse', slug: 'xtxmarketstechnologies' }, epigramLabel: null },
  { name: 'ExodusPoint', type: TRADING, source: { ats: 'greenhouse', slug: 'exoduspoint' }, epigramLabel: null },
  { name: 'Quadrature', type: TRADING, source: { ats: 'greenhouse', slug: 'quadraturecapital' }, epigramLabel: null },
  { name: 'Maven Securities', type: TRADING, source: { ats: 'ashby', slug: 'maven' }, epigramLabel: null },
  // Banks and asset managers: searched for quant terms only, since their boards hold thousands of roles
  { name: 'JPMorgan Chase', type: BANK, source: { ats: 'oracle', host: 'jpmc.fa.oraclecloud.com', siteNumber: 'CX_1001' }, epigramLabel: null },
  { name: 'Morgan Stanley', type: BANK, source: { ats: 'workday', host: 'ms.wd5.myworkdayjobs.com', tenant: 'ms', site: 'External' }, epigramLabel: null },
  { name: 'Bank of America', type: BANK, source: { ats: 'workday', host: 'ghr.wd1.myworkdayjobs.com', tenant: 'ghr', site: 'Lateral-US' }, epigramLabel: null },
  { name: 'Barclays', type: BANK, source: { ats: 'workday', host: 'barclays.wd3.myworkdayjobs.com', tenant: 'barclays', site: 'External_Career_Site_Barclays' }, epigramLabel: 'Barclays' },
  { name: 'Deutsche Bank', type: BANK, source: { ats: 'workday', host: 'db.wd3.myworkdayjobs.com', tenant: 'db', site: 'DBWebsite' }, epigramLabel: null },
  { name: 'BlackRock', type: BANK, source: { ats: 'workday', host: 'blackrock.wd1.myworkdayjobs.com', tenant: 'blackrock', site: 'BlackRock_Professional' }, epigramLabel: null },
  { name: 'State Street', type: BANK, source: { ats: 'workday', host: 'statestreet.wd1.myworkdayjobs.com', tenant: 'statestreet', site: 'Global' }, epigramLabel: null },
  { name: 'MUFG', type: BANK, source: { ats: 'workday', host: 'mufgub.wd3.myworkdayjobs.com', tenant: 'mufgub', site: 'MUFG-Careers' }, epigramLabel: null },
];

const BANK_SEARCH_TERMS = ['quantitative', 'quant', 'strats', 'model validation', 'trader', 'machine learning'];
const REFRESH_SECONDS = 6 * 60 * 60;
const TIMEOUT_MS = 20000;

interface RawJob {
  id: string;
  title: string;
  location: string;
  department: string;
  description: string;
  url: string;
  postedAt: string | null;
}

async function getJson<T>(url: string, init?: RequestInit, retries = 1): Promise<T> {
  try {
    // Each firm's result is cached below, so skip the per-request fetch cache (Greenhouse responses can exceed its size limit).
    const res = await fetch(url, { ...init, cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${new URL(url).host}`);
    return (await res.json()) as T;
  } catch (error) {
    if (retries > 0) return getJson<T>(url, init, retries - 1);
    throw error;
  }
}

/** Run one search per term; a failed term is skipped unless every term fails. */
async function searchAllTerms(run: (term: string) => Promise<void>, firmHost: string) {
  const results = await Promise.allSettled(BANK_SEARCH_TERMS.map(run));
  if (results.every((r) => r.status === 'rejected')) throw new Error(`All searches failed for ${firmHost}`);
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'").replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
}

// Greenhouse sends its job HTML entity-encoded; only plain text is needed for tagging.
function htmlToText(s: string | undefined): string {
  return decodeEntities(decodeEntities(s ?? '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim().slice(0, 8000);
}

/** Workday shows relative dates ("Posted 3 Days Ago"); turn them into an approximate ISO date.
 *  "30+ Days Ago" has no exact age, so it gets no date rather than a misleading one. */
function workdayPostedAt(postedOn: string | undefined): string | null {
  if (!postedOn || /\+/.test(postedOn)) return null;
  const days = /today/i.test(postedOn) ? 0 : /yesterday/i.test(postedOn) ? 1 : Number(postedOn.match(/(\d+)\+?\s*days?/i)?.[1]);
  if (Number.isNaN(days)) return null;
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

// ---------- one fetcher per careers system ----------

interface GreenhouseJob {
  id: number; title: string; absolute_url: string; first_published?: string; updated_at?: string;
  location?: { name?: string }; departments?: { name: string }[]; content?: string;
}
interface LeverJob {
  id: string; text: string; hostedUrl: string; createdAt?: number; descriptionPlain?: string;
  categories?: { location?: string; team?: string; department?: string; allLocations?: string[] };
}
interface AshbyJob {
  id: string; title: string; location?: string; department?: string; jobUrl: string;
  publishedAt?: string; isListed?: boolean; descriptionPlain?: string;
}
interface WorkdayPosting { title: string; externalPath: string; locationsText?: string; postedOn?: string }
interface WorkdayDetail { jobPostingInfo?: { location?: string; additionalLocations?: string[]; jobDescription?: string } }
interface OracleReq {
  Id: string; Title: string; PrimaryLocation?: string; PostedDate?: string; JobFamily?: string;
  ExternalQualificationsStr?: string; secondaryLocations?: { Name?: string }[];
}

async function fetchGreenhouse(slug: string): Promise<RawJob[]> {
  const data = await getJson<{ jobs: GreenhouseJob[] }>(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`);
  return data.jobs.map((j) => ({
    id: `gh-${slug}-${j.id}`,
    title: j.title.trim(),
    location: j.location?.name ?? '',
    department: (j.departments ?? []).map((d) => d.name).join(', '),
    description: htmlToText(j.content),
    url: j.absolute_url,
    postedAt: j.first_published ?? j.updated_at ?? null,
  }));
}

async function fetchLever(slug: string): Promise<RawJob[]> {
  const data = await getJson<LeverJob[]>(`https://api.lever.co/v0/postings/${slug}?mode=json`);
  return data.map((j) => ({
    id: `lever-${slug}-${j.id}`,
    title: j.text.trim(),
    location: (j.categories?.allLocations?.length ? j.categories.allLocations.join('; ') : j.categories?.location) ?? '',
    department: [j.categories?.department, j.categories?.team].filter(Boolean).join(', '),
    description: (j.descriptionPlain ?? '').slice(0, 8000),
    url: j.hostedUrl,
    postedAt: j.createdAt ? new Date(j.createdAt).toISOString() : null,
  }));
}

async function fetchAshby(slug: string): Promise<RawJob[]> {
  const data = await getJson<{ jobs: AshbyJob[] }>(`https://api.ashbyhq.com/posting-api/job-board/${slug}`);
  return data.jobs.filter((j) => j.isListed !== false).map((j) => ({
    id: `ashby-${slug}-${j.id}`,
    title: j.title.trim(),
    location: j.location ?? '',
    department: j.department ?? '',
    description: (j.descriptionPlain ?? '').slice(0, 8000),
    url: j.jobUrl,
    postedAt: j.publishedAt ?? null,
  }));
}

/** Stable id for a Workday posting, e.g. 'wd-db-R0450010' (the requisition number ends its path). */
const workdayId = (tenant: string, externalPath: string) => `wd-${tenant}-${externalPath.split('_').pop() ?? externalPath}`;

async function fetchWorkday(host: string, tenant: string, site: string, knownLocations?: Map<string, string>): Promise<RawJob[]> {
  const api = `https://${host}/wday/cxs/${tenant}/${site}`;
  const byPath = new Map<string, WorkdayPosting>();
  const search = (searchText: string, offset: number) =>
    getJson<{ total?: number; jobPostings?: WorkdayPosting[] }>(`${api}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ appliedFacets: {}, limit: 20, offset, searchText }),
    });
  const keep = (postings: WorkdayPosting[] | undefined) =>
    (postings ?? []).filter((p) => p.externalPath && p.title).forEach((p) => byPath.set(p.externalPath, p));

  // Workday pages 20 at a time. The first page gives the total; the rest (up to 100 results per
  // term) are fetched in parallel.
  await searchAllTerms(async (searchText) => {
    const first = await search(searchText, 0);
    keep(first.jobPostings);
    const total = Math.min(first.total ?? 0, 100);
    const offsets = [];
    for (let offset = 20; offset < total; offset += 20) offsets.push(offset);
    const pages = await Promise.allSettled(offsets.map((offset) => search(searchText, offset)));
    pages.forEach((p) => { if (p.status === 'fulfilled') keep(p.value.jobPostings); });
  }, host);

  const postings = [...byPath.values()];
  // List results say only "3 Locations" for multi-city roles. Look those up so location filters
  // work, reusing locations already known from earlier refreshes (they don't change).
  const locations = new Map<string, string>();
  const multi = postings.filter((p) => /^\d+ Locations$/i.test(p.locationsText ?? ''));
  const lookups: WorkdayPosting[] = [];
  for (const p of multi) {
    const known = knownLocations?.get(workdayId(tenant, p.externalPath));
    if (known && !/^\d+ Locations$/i.test(known)) locations.set(p.externalPath, known);
    else lookups.push(p);
  }
  await Promise.all(lookups.slice(0, 60).map(async (p) => {
    try {
      const d = await getJson<WorkdayDetail>(`${api}${p.externalPath}`, undefined, 0);
      const info = d.jobPostingInfo;
      if (info?.location) locations.set(p.externalPath, [info.location, ...(info.additionalLocations ?? [])].join('; '));
    } catch {
      // Keep the "N Locations" text if the detail lookup fails.
    }
  }));

  return postings.map((p) => ({
    id: workdayId(tenant, p.externalPath),
    title: p.title.trim(),
    location: locations.get(p.externalPath) ?? p.locationsText ?? '',
    department: '',
    description: '',
    url: `https://${host}/en-US/${site}${p.externalPath}`,
    postedAt: workdayPostedAt(p.postedOn),
  }));
}

async function fetchOracle(host: string, siteNumber: string): Promise<RawJob[]> {
  const byId = new Map<string, OracleReq>();
  await searchAllTerms(async (term) => {
    for (let offset = 0; offset < 200; offset += 100) {
      const url = `https://${host}/hcmRestApi/resources/latest/recruitingCEJobRequisitions?onlyData=true` +
        `&expand=requisitionList.secondaryLocations&finder=findReqs;siteNumber=${siteNumber},` +
        `keyword=${encodeURIComponent(term)},limit=100,offset=${offset},sortBy=POSTING_DATES_DESC`;
      const data = await getJson<{ items?: { requisitionList?: OracleReq[] }[] }>(url);
      const reqs = data.items?.[0]?.requisitionList ?? [];
      reqs.forEach((r) => byId.set(r.Id, r));
      if (reqs.length < 100) break;
    }
  }, host);
  return [...byId.values()].map((r) => ({
    id: `oracle-${siteNumber}-${r.Id}`,
    title: r.Title.trim(),
    location: [r.PrimaryLocation, ...(r.secondaryLocations ?? []).map((l) => l.Name)].filter(Boolean).join('; '),
    department: r.JobFamily ?? '',
    description: (r.ExternalQualificationsStr ?? '').slice(0, 8000),
    url: `https://${host}/hcmUI/CandidateExperience/en/sites/${siteNumber}/job/${r.Id}`,
    postedAt: r.PostedDate ?? null,
  }));
}

function fetchFirm(firm: Firm, knownLocations?: Map<string, string>): Promise<RawJob[]> {
  const s = firm.source;
  switch (s.ats) {
    case 'greenhouse': return fetchGreenhouse(s.slug);
    case 'lever': return fetchLever(s.slug);
    case 'ashby': return fetchAshby(s.slug);
    case 'workday': return fetchWorkday(s.host, s.tenant, s.site, knownLocations);
    case 'oracle': return fetchOracle(s.host, s.siteNumber);
  }
}

// ---------- tagging (keyword rules; to be replaced by an LLM pass once postings are stored) ----------

const NOT_QUANT = new RegExp(
  '(recruit|talent|human resources|\\bhr\\b|people partner|legal|counsel|paralegal|complian|' +
  'accountant|accounting|payroll|tax\\b|audit|treasury|office manager|facilit|receptionist|' +
  'executive assistant|administrative|admin assistant|marketing|communications|events?\\b|' +
  'investor relations|business development|sales|client|customer|procurement|vendor|' +
  'help ?desk|desktop support|it support|service desk|workplace|security officer|chef|' +
  'benefits|operations(?! research)|middle office|back office|settlement|project manager|' +
  'programm?e? manager|coordinator|specialist|connect with us|general application|talent network|' +
  'fund accounting|reconciliation|kyc|aml\\b|relationship manager|wealth|private bank|branch|' +
  'teller|loan|lending|mortgage|underwrit|banker|advis[eo]r|equity research|investment banking|coverage|origination)', 'i');

// Order matters: the first matching rule wins.
const ROLE_RULES: [JobRole, RegExp][] = [
  ['Risk & Model Validation', /(model (risk|validation)|quantitative risk|risk quant|market risk|counterparty (credit )?risk|\bxva\b|credit risk (model|quant|analytics)|risk (analytics|modell?ing|methodology))/i],
  ['Quant Developer', /(quant\w*\s+(developer|engineer|dev)|trading (systems|infrastructure|technology|platform)|low[- ]latency|algo(rithmic)? (trading )?(developer|engineer)|electronic trading|fpga|execution (developer|engineer))/i],
  ['Quant Researcher', /(quant\w*\s+research|research(er)?\b.*quant|alpha|\bresearcher\b|research scientist|(?<!data )scientist|machine learning (intern|researcher|research)|\bai research|statistician|portfolio construction|systematic research|\bqr\b)/i],
  ['Data Science & ML', /(data scien|machine learning|\bml\b|\bai\b (engineer|developer)|data analyst|(data|quantitative|quant|predictive|advanced) analytics|analytics (engineer|scientist))/i],
  ['Quant Trader', /(\btrader\b|trading (analyst|associate|intern)|quantitative trading|portfolio manager|market maker|execution trader|\bqt\b)/i],
  ['Quant Analyst & Strats', /(quantitative analyst|quant analyst|\bstrats?\b|structur(er|ing)|quantitative (associate|finance|modell?ing|strateg)|quant (modell?ing|associate|strateg)|desk quant|front office quant|derivatives? (pricing|modell?ing)|financial engineer|\bquant\b)/i],
  ['Software Engineering', /(software (engineer|developer)|developer|engineer|\bswe\b|programmer|site reliability|infrastructure|platform|hardware|data engineer)/i],
];

// Bank searches also surface general technology and analytics jobs; keep those only when the
// title points at markets, trading, quant or risk work.
const BANK_MARKETS_RX = /(quant|strat|trad|markets?\b|algo|pricing|derivativ|\bstructur|risk|rates|\bfx\b|fixed income|equit|commodit|credit|systematic|portfolio|research|machine learning|valuation)/i;

const LEVEL_RULES: [Exclude<JobLevel, 'Unspecified'>, RegExp][] = [
  ['Intern', /(\bintern(ship)?\b|summer (analyst|associate|program)|co-?op\b|insight (week|program)|placement)/i],
  ['New grad', /(graduate|new grad|campus|entry[- ]level|early career|junior|\bgrad\b|20(26|27|28) start|phd (program|track)|analyst program)/i],
  ['Experienced', /(senior|\bsr\.?\b|lead\b|head of|principal|director|vice president|\bvp\b|\bavp\b|\bed\b|\bmd\b|experienced|staff\b|manager\b)/i],
];
const YEARS_RX = /\b([2-9]|1[0-5])\s*\+?\s*(?:-\s*\d+\s*)?(years|yrs)\b[^.\n]{0,40}(experience|industry|professional)/i;
const STUDENT_RX = /(currently pursuing|graduating (in|between)|recent graduate|expected graduation|final[- ]year|completing (a|your) (degree|phd))/i;

const REGIONS: [string, RegExp][] = [
  ['New York', /new york|nyc|\bny\b|jersey city/i], ['Chicago', /chicago/i], ['Austin', /austin/i], ['Boston', /boston/i],
  ['Miami', /miami/i], ['San Francisco', /san francisco|bay area|berkeley|palo alto/i], ['Greenwich/Stamford', /greenwich|stamford/i],
  ['Charlotte', /charlotte/i], ['Houston', /houston/i], ['Dallas/Plano', /dallas|plano/i], ['Columbus', /columbus/i],
  ['Wilmington', /wilmington/i], ['Seattle', /seattle/i], ['Westport', /westport/i], ['Toronto', /toronto/i], ['Montreal', /montr[eé]al/i],
  ['London', /london|canary wharf/i], ['Glasgow', /glasgow/i], ['Amsterdam', /amsterdam/i], ['Dublin', /dublin/i], ['Paris', /paris/i], ['Frankfurt', /frankfurt/i], ['Berlin', /berlin/i], ['Munich', /munich|m[uü]nchen/i],
  ['Warsaw', /warsaw|warszawa/i], ['Prague', /prague|praha/i], ['Budapest', /budapest/i], ['Denmark', /aarhus|copenhagen/i],
  ['Zug/Zurich', /zug|z[uü]rich/i], ['Geneva', /geneva/i], ['Hong Kong', /hong kong/i], ['Singapore', /singapore/i],
  ['Sydney', /sydney/i], ['India', /mumbai|gurgaon|gurugram|bangalore|bengaluru|pune|hyderabad|chennai|new delhi|gift city/i],
  ['Dubai/Abu Dhabi', /dubai|abu dhabi/i], ['São Paulo', /s[aã]o paulo/i], ['Vietnam', /hanoi|ho chi minh/i],
  ['Taipei', /taipei|taiwan/i], ['Seoul', /seoul/i], ['Manila', /manila/i], ['Hangzhou', /hangzhou/i],
  ['Shanghai', /shanghai/i], ['Tokyo', /tokyo|japan/i], ['Tel Aviv', /tel aviv|ramat gan/i], ['Remote', /remote/i],
];

/** A place we have no rule for: keep a clean city or country name, otherwise file it under Other. */
function fallbackRegion(location: string): string {
  const first = location.split(/[,;]/)[0].trim();
  // Street addresses, "6 Locations", "Hanoi OR ..." and similar can't be shown as a filter option.
  if (!first || /\d|locations?\b|\bor\b|campus|building/i.test(first) || first.length > 24) return 'Other';
  return first === first.toUpperCase() ? first.charAt(0) + first.slice(1).toLowerCase() : first;
}

function tag(raw: RawJob, firm: Firm): TaggedOpening | null {
  const { title, department } = raw;
  if (NOT_QUANT.test(title)) return null;
  // Department names only help at trading firms; at banks they're too broad to trust.
  const role = ROLE_RULES.find(([, rx]) => rx.test(title))?.[0] ??
    (firm.type === TRADING ? ROLE_RULES.find(([, rx]) => rx.test(department))?.[0] : undefined);
  if (!role) return null;
  if (firm.type === BANK && (role === 'Software Engineering' || role === 'Data Science & ML') && !BANK_MARKETS_RX.test(title)) return null;

  let level: JobLevel | undefined = LEVEL_RULES.find(([, rx]) => rx.test(title))?.[0];
  if (!level) level = LEVEL_RULES.slice(0, 2).find(([, rx]) => rx.test(`${title} | ${department}`))?.[0];
  if (!level && firm.type === BANK && /\bassociate\b/i.test(title)) level = 'Experienced';
  if (!level) level = YEARS_RX.test(raw.description) ? 'Experienced' : STUDENT_RX.test(raw.description) ? 'New grad' : 'Unspecified';

  const regions = REGIONS.filter(([, rx]) => rx.test(raw.location)).map(([name]) => name);
  return {
    id: raw.id, firm: firm.name, firmType: firm.type, title, location: raw.location,
    regions: regions.length ? regions : [fallbackRegion(raw.location)],
    role, level, url: raw.url, postedAt: raw.postedAt, epigramLabel: firm.epigramLabel,
    description: raw.description,
  };
}

/** One firm's quant openings with descriptions, fetched fresh (used by the daily refresh).
 *  knownLocations (opening id -> location) skips lookups for openings already stored. */
export async function fetchFirmOpenings(firm: Firm, knownLocations?: Map<string, string>): Promise<TaggedOpening[]> {
  const raws = await fetchFirm(firm, knownLocations);
  return raws.map((raw) => tag(raw, firm)).filter((j): j is TaggedOpening => j !== null);
}

export const JOB_FIRMS: readonly Firm[] = FIRMS;

// Each firm is cached on its own: a feed that fails throws, so nothing is stored and the next
// request retries it, while the other firms keep serving their cached openings.
function getFirmJobs(firm: Firm) {
  return unstable_cache(
    async () => {
      // The page doesn't need descriptions, and leaving them out keeps each cache entry small.
      const jobs: JobOpening[] = (await fetchFirmOpenings(firm)).map((j) => ({
        id: j.id, firm: j.firm, firmType: j.firmType, title: j.title, location: j.location, regions: j.regions,
        role: j.role, level: j.level, url: j.url, postedAt: j.postedAt, epigramLabel: j.epigramLabel,
      }));
      return { fetchedAt: new Date().toISOString(), jobs };
    },
    ['jobs-firm-v8', firm.name],
    { revalidate: REFRESH_SECONDS }
  )();
}

// A firm with nothing cached yet that is slow or down shouldn't hold up the page: answer with the
// firms that are ready, and let the slow fetch finish (and fill the cache) in the background.
// Once a firm has been slow or failed, later requests stop waiting for it for a while (a cache hit
// still answers well inside the short wait), and only one fetch per firm runs at a time.
const FIRM_DEADLINE_MS = 10000;
const SLOW_FIRM_WAIT_MS = 1000;
const SLOW_FIRM_COOLDOWN_MS = 10 * 60 * 1000;

type FirmResult = Awaited<ReturnType<typeof getFirmJobs>>;
const firmState = new Map<string, { inflight?: Promise<FirmResult>; slowUntil?: number }>();

function withDeadline<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`not ready after ${ms / 1000}s`)), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error) => { clearTimeout(timer); reject(error); }
    );
  });
}

function loadFirm(firm: Firm): Promise<FirmResult> {
  const state = firmState.get(firm.name) ?? {};
  firmState.set(firm.name, state);
  if (!state.inflight) {
    const run = getFirmJobs(firm);
    state.inflight = run;
    run.then(
      () => { state.slowUntil = undefined; },
      (error) => {
        state.slowUntil = Date.now() + SLOW_FIRM_COOLDOWN_MS;
        console.error(`Jobs feed error (${firm.name}):`, error instanceof Error ? error.message : error);
      }
    ).finally(() => { if (state.inflight === run) state.inflight = undefined; });
  }
  const isSlow = (state.slowUntil ?? 0) > Date.now();
  const wait = withDeadline(state.inflight, isSlow ? SLOW_FIRM_WAIT_MS : FIRM_DEADLINE_MS);
  wait.catch(() => { state.slowUntil = Math.max(state.slowUntil ?? 0, Date.now() + SLOW_FIRM_COOLDOWN_MS); });
  return wait;
}

/** Today's quant openings, refreshed at most every six hours per firm. */
export async function getJobsFeed(): Promise<JobsFeed> {
  const results = await Promise.allSettled(FIRMS.map(loadFirm));
  const jobs: JobOpening[] = [];
  const fetched: string[] = [];
  results.forEach((r) => {
    if (r.status === 'rejected') return; // logged in loadFirm
    jobs.push(...r.value.jobs);
    fetched.push(r.value.fetchedAt);
  });
  jobs.sort((a, b) => (b.postedAt ?? '').localeCompare(a.postedAt ?? ''));
  return {
    fetchedAt: fetched.sort()[0] ?? new Date().toISOString(),
    firms: FIRMS.map((f, i) => ({ name: f.name, type: f.type, ok: results[i].status === 'fulfilled' })),
    jobs,
  };
}
