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

/** An opening as fetched and tagged, before the description is dropped for the page. */
export type TaggedOpening = JobOpening & { description: string };

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

// ---------- CV profiles and matches (step B) ----------

export const CAREER_STAGES = ['Student', 'New grad', 'Experienced'] as const;
export type CareerStage = (typeof CAREER_STAGES)[number];

export const DEGREES = ['PhD', "Master's", "Bachelor's", 'Other'] as const;
export type Degree = (typeof DEGREES)[number];

export const SKILL_LEVELS = ['expert', 'proficient', 'familiar'] as const;
export type SkillLevel = (typeof SKILL_LEVELS)[number];

export const SKILL_CATEGORIES = ['programming', 'math_stats', 'machine_learning', 'finance', 'tools'] as const;
export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

export interface CvEducation {
  institution: string;
  degree: Degree;
  field: string | null;
  start: string | null; // YYYY-MM
  end: string | null;   // YYYY-MM, null = ongoing
  gpa?: string | null;
  thesis?: string | null;
}

export interface CvExperience {
  organization: string;
  title: string;
  type: 'full-time' | 'internship' | 'research' | 'teaching' | 'other';
  start: string | null;
  end: string | null;
  location?: string | null;
  highlights: string[];
  skills: string[];
}

export interface CvSkill { name: string; category: SkillCategory; level: SkillLevel }
export interface CvAchievement { title: string; type: 'competition' | 'award' | 'publication' | 'certification' | 'other'; year?: number | null }
export interface CvLanguage { name: string; level: 'native' | 'fluent' | 'professional' | 'basic' }
export interface CvProject { name: string; url?: string | null; description?: string | null; skills: string[] }

export interface CvProfile {
  userId: string;
  cvFileName: string | null;
  cvUploadedAt: string | null;
  cvStoragePath: string | null;
  education: CvEducation[];
  experiences: CvExperience[];
  skills: CvSkill[];
  achievements: CvAchievement[];
  languages: CvLanguage[];
  projects: CvProject[];
  links: { github?: string; linkedin?: string; website?: string; google_scholar?: string };
  summary: string | null;
  highestDegree: Degree | null;
  degreeField: string | null;
  graduationYear: number | null;
  careerStage: CareerStage | null;
  yearsExperience: number | null;
  extractedAt: string | null;
  extractionModel: string | null;
  confirmedAt: string | null;
  workAuthorization: Record<string, string>;
  preferredRoles: string[];
  preferredLevels: string[];
  preferredRegions: string[];
  alertsEnabled: boolean;
  consentAt: string;
}

export interface JobMatch {
  openingId: string;
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  notes: string[];
  computedAt: string;
}

/** A match joined with its opening, as the "For you" view shows it. */
export interface JobMatchView extends JobMatch {
  /** isNew: first found by the daily refresh in the last 24 hours (never on the very first run). */
  opening: JobOpening & { firstSeenAt: string | null; isNew: boolean };
}

/** Locations users can choose as preferences; the same names the server tags openings with. */
export const REGION_NAMES = [
  'New York', 'Chicago', 'London', 'Hong Kong', 'Singapore', 'Amsterdam', 'Austin', 'Boston',
  'Greenwich/Stamford', 'Miami', 'San Francisco', 'Charlotte', 'Houston', 'Toronto', 'Montreal',
  'Dublin', 'Paris', 'Frankfurt', 'Zug/Zurich', 'Geneva', 'Sydney', 'Shanghai', 'Tokyo', 'India', 'Remote',
] as const;
