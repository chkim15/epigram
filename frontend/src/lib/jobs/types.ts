export const JOB_ROLES = [
  'Quant Researcher',
  'Quant Trader',
  'Quant Developer',
  'Quant Analyst & Strats',
  'Risk & Model Validation',
  'Data Science & ML',
  'Software Engineering',
] as const;
export type JobRole = (typeof JOB_ROLES)[number];

export const JOB_LEVELS = ['Intern', 'New grad', 'Experienced', 'Unspecified'] as const;
export type JobLevel = (typeof JOB_LEVELS)[number];

export const FIRM_TYPES = ['Trading firms & funds', 'Banks & asset managers'] as const;
export type FirmType = (typeof FIRM_TYPES)[number];

export interface JobOpening {
  id: string;
  firm: string;
  firmType: FirmType;
  title: string;
  location: string;
  regions: string[];
  role: JobRole;
  level: JobLevel;
  url: string;
  postedAt: string | null;
  /** Matching value in problems.company_labels, when Epigram has problems for this firm. */
  epigramLabel: string | null;
}

export interface JobsFeed {
  fetchedAt: string;
  firms: { name: string; type: FirmType; ok: boolean }[];
  jobs: JobOpening[];
}

/** Firms and boards we can't read automatically: linked so users can search them directly. */
export const MORE_JOB_LINKS: { label: string; url: string }[] = [
  { label: 'Goldman Sachs', url: 'https://higher.gs.com/results?search=quantitative' },
  { label: 'Citi', url: 'https://jobs.citi.com/search-jobs/quantitative' },
  { label: 'Citadel', url: 'https://www.citadel.com/careers/open-opportunities/' },
  { label: 'Citadel Securities', url: 'https://www.citadelsecurities.com/careers/open-opportunities/' },
  { label: 'Two Sigma', url: 'https://www.twosigma.com/careers/' },
  { label: 'SIG', url: 'https://careers.sig.com/jobs' },
  { label: 'D. E. Shaw', url: 'https://www.deshaw.com/careers' },
  { label: 'Millennium', url: 'https://mlp.eightfold.ai/careers' },
  { label: 'LinkedIn', url: 'https://www.linkedin.com/jobs/search/?keywords=quantitative%20researcher' },
  { label: 'eFinancialCareers', url: 'https://www.efinancialcareers.com/jobs/quantitative' },
];
