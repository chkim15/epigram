export const JOB_ROLES = ['Quant Researcher', 'Quant Trader', 'Quant Developer', 'Data Scientist'] as const;
export type JobRole = (typeof JOB_ROLES)[number];

export const JOB_LEVELS = ['Intern', 'New grad', 'Experienced', 'Unspecified'] as const;
export type JobLevel = (typeof JOB_LEVELS)[number];

export interface JobOpening {
  id: string;
  firm: string;
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
  firms: { name: string; ok: boolean }[];
  jobs: JobOpening[];
}
