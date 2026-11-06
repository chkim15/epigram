import { AnthropicBedrock } from '@anthropic-ai/bedrock-sdk';
import { redactContactDetails } from './cv-text';
import { CANONICAL_SKILLS, canonicalSkill } from './skills';
import {
  CAREER_STAGES, DEGREES, SKILL_CATEGORIES, SKILL_LEVELS,
  type CareerStage, type CvAchievement, type CvEducation, type CvExperience, type CvLanguage,
  type CvProfile, type CvProject, type CvSkill, type Degree,
} from './types';

/** The part of a profile that comes from the CV (as opposed to preferences and bookkeeping). */
export type ExtractedSections = Pick<
  CvProfile,
  'education' | 'experiences' | 'skills' | 'achievements' | 'languages' | 'projects' | 'links' | 'summary'
>;

// ---------- validation: everything from the model or the browser passes through here ----------

const str = (v: unknown, max = 300): string | null =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;
const month = (v: unknown): string | null => {
  const s = str(v, 10);
  if (!s) return null;
  const m = s.match(/^(\d{4})(?:-(\d{1,2}))?/);
  return m ? `${m[1]}-${(m[2] ?? '01').padStart(2, '0')}` : null;
};
const oneOf = <T extends string>(v: unknown, options: readonly T[], fallback: T): T =>
  typeof v === 'string' && (options as readonly string[]).includes(v) ? (v as T) : fallback;
const list = (v: unknown, max: number): unknown[] => (Array.isArray(v) ? v.slice(0, max) : []);
const strings = (v: unknown, max = 12, len = 120): string[] =>
  list(v, max).map((x) => str(x, len)).filter((x): x is string => x !== null);
const url = (v: unknown): string | undefined => {
  const s = str(v, 300);
  return s && /^https?:\/\/[^\s]+$/i.test(s) ? s : undefined;
};

export function sanitizeSections(input: unknown): ExtractedSections {
  const o = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const education: CvEducation[] = list(o.education, 8).flatMap((e) => {
    const r = (e ?? {}) as Record<string, unknown>;
    const institution = str(r.institution, 150);
    if (!institution) return [];
    return [{
      institution,
      degree: oneOf<Degree>(r.degree, DEGREES, 'Other'),
      field: str(r.field, 120),
      start: month(r.start),
      end: month(r.end),
      gpa: str(r.gpa, 30),
      thesis: str(r.thesis, 300),
    }];
  });
  const experiences: CvExperience[] = list(o.experiences, 15).flatMap((e) => {
    const r = (e ?? {}) as Record<string, unknown>;
    const organization = str(r.organization, 150);
    const title = str(r.title, 150);
    if (!organization || !title) return [];
    return [{
      organization,
      title,
      type: oneOf(r.type, ['full-time', 'internship', 'research', 'teaching', 'other'] as const, 'other'),
      start: month(r.start),
      end: month(r.end),
      location: str(r.location, 100),
      highlights: strings(r.highlights, 6, 300),
      skills: strings(r.skills, 12, 60),
    }];
  });
  const seen = new Set<string>();
  const skills: CvSkill[] = list(o.skills, 60).flatMap((s) => {
    const r = (s ?? {}) as Record<string, unknown>;
    const name = str(r.name, 60);
    if (!name || seen.has(name.toLowerCase())) return [];
    seen.add(name.toLowerCase());
    return [{
      name,
      category: oneOf(r.category, SKILL_CATEGORIES, canonicalSkill(name)?.category ?? 'tools'),
      level: oneOf(r.level, SKILL_LEVELS, 'proficient'),
    }];
  });
  const achievements: CvAchievement[] = list(o.achievements, 20).flatMap((a) => {
    const r = (a ?? {}) as Record<string, unknown>;
    const title = str(r.title, 200);
    if (!title) return [];
    const year = Number(r.year);
    return [{
      title,
      type: oneOf(r.type, ['competition', 'award', 'publication', 'certification', 'other'] as const, 'other'),
      year: Number.isInteger(year) && year > 1950 && year < 2100 ? year : null,
    }];
  });
  const languages: CvLanguage[] = list(o.languages, 10).flatMap((l) => {
    const r = (l ?? {}) as Record<string, unknown>;
    const name = str(r.name, 40);
    return name ? [{ name, level: oneOf(r.level, ['native', 'fluent', 'professional', 'basic'] as const, 'professional') }] : [];
  });
  const projects: CvProject[] = list(o.projects, 12).flatMap((p) => {
    const r = (p ?? {}) as Record<string, unknown>;
    const name = str(r.name, 120);
    return name ? [{ name, url: url(r.url) ?? null, description: str(r.description, 300), skills: strings(r.skills, 10, 60) }] : [];
  });
  const l = (o.links && typeof o.links === 'object' ? o.links : {}) as Record<string, unknown>;
  const links: CvProfile['links'] = {};
  for (const key of ['github', 'linkedin', 'website', 'google_scholar'] as const) {
    const v = url(l[key]);
    if (v) links[key] = v;
  }
  return { education, experiences, skills, achievements, languages, projects, links, summary: str(o.summary, 600) };
}

// ---------- derived fields ----------

const DEGREE_RANK: Record<Degree, number> = { PhD: 3, "Master's": 2, "Bachelor's": 1, Other: 0 };

function monthsBetween(start: string, end: string | null): number {
  const [sy, sm] = start.split('-').map(Number);
  const now = new Date();
  const [ey, em] = end ? end.split('-').map(Number) : [now.getUTCFullYear(), now.getUTCMonth() + 1];
  return Math.max(0, (ey - sy) * 12 + (em - sm) + 1);
}

export function deriveFields(sections: ExtractedSections, stageOverride?: CareerStage | null) {
  const top = [...sections.education].sort((a, b) => DEGREE_RANK[b.degree] - DEGREE_RANK[a.degree])[0];
  const thisYear = new Date().getUTCFullYear();
  const gradYear = top?.end ? Number(top.end.slice(0, 4)) : null;
  const studying = sections.education.some((e) => e.start && !e.end) || (gradYear !== null && gradYear > thisYear);
  // Full-time jobs count, and so do research posts (e.g. postdocs) that start after the highest degree.
  const gradMonth = top?.end ?? null;
  const fullTimeMonths = sections.experiences
    .filter((e) => e.start && (e.type === 'full-time' || (e.type === 'research' && gradMonth !== null && e.start >= gradMonth)))
    .reduce((sum, e) => sum + monthsBetween(e.start as string, e.end), 0);
  const yearsExperience = Math.round((fullTimeMonths / 12) * 10) / 10;

  let careerStage: CareerStage | null = null;
  if (studying) careerStage = 'Student';
  else if (top || sections.experiences.length) {
    const sinceGrad = gradYear ? thisYear - gradYear : null;
    careerStage = yearsExperience >= 1.5 || (sinceGrad !== null && sinceGrad >= 2) ? 'Experienced' : 'New grad';
  }
  return {
    highestDegree: top?.degree ?? null,
    degreeField: top?.field ?? null,
    graduationYear: gradYear,
    careerStage: stageOverride && (CAREER_STAGES as readonly string[]).includes(stageOverride) ? stageOverride : careerStage,
    yearsExperience,
  };
}

// ---------- extraction ----------

const EXTRACTION_PROMPT = `You read a CV for a quantitative finance job board and return ONLY a JSON object with this shape:
{
  "education":   [{"institution": str, "degree": "PhD"|"Master's"|"Bachelor's"|"Other", "field": str|null, "start": "YYYY-MM"|null, "end": "YYYY-MM"|null, "gpa": str|null, "thesis": str|null}],
  "experiences": [{"organization": str, "title": str, "type": "full-time"|"internship"|"research"|"teaching"|"other", "start": "YYYY-MM"|null, "end": "YYYY-MM"|null, "location": str|null, "highlights": [str, ...up to 4, each one short sentence], "skills": [str]}],
  "skills":      [{"name": str, "category": "programming"|"math_stats"|"machine_learning"|"finance"|"tools", "level": "expert"|"proficient"|"familiar"}],
  "achievements":[{"title": str, "type": "competition"|"award"|"publication"|"certification"|"other", "year": int|null}],
  "languages":   [{"name": str, "level": "native"|"fluent"|"professional"|"basic"}],
  "projects":    [{"name": str, "url": str|null, "description": str|null, "skills": [str]}],
  "links":       {"github": url?, "linkedin": url?, "website": url?, "google_scholar": url?},
  "summary":     "two sentences describing the candidate's profile for quant roles"
}
Rules:
- Use only facts stated in the CV. Never invent dates, employers, scores or skills.
- "end": null means the role or degree is ongoing ("Present"). Postdocs and research fellowships are "research"; lecturer and TA roles are "teaching".
- Language level only if the CV states it (e.g. "native", "fluent", "conversational" -> professional, "basic"); if it just lists the language, use "professional".
- Skill level comes from the CV's own wording: "proficient in" -> proficient, "familiar with" / "basic" -> familiar, "expert" or years of daily professional use -> expert. If unstated, use proficient.
- Include programming languages, maths/statistics methods, ML methods and finance knowledge the CV shows evidence of (max 40 skills).
- Publications: list at most 8 of the most relevant as achievements.
- Return JSON only, no prose and no code fences.`;

function extractJson(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('No JSON in model response');
  return JSON.parse(text.slice(start, end + 1));
}

async function extractWithModel(cvText: string): Promise<{ sections: ExtractedSections; model: string }> {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) throw new Error('Bedrock not configured');
  const client = new AnthropicBedrock({
    awsRegion: process.env.AWS_REGION || 'us-east-1',
    awsAccessKey: process.env.AWS_ACCESS_KEY_ID,
    awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY,
  });
  const model = process.env.BEDROCK_GRADING_MODEL || 'global.anthropic.claude-sonnet-4-6';
  const completion = await client.messages.create({
    model,
    max_tokens: 6000,
    temperature: 0,
    system: EXTRACTION_PROMPT,
    messages: [{ role: 'user', content: `CV text:\n\n${redactContactDetails(cvText).slice(0, 40000)}` }],
  });
  const text = completion.content.map((b) => (b.type === 'text' ? b.text : '')).join('').trim();
  return { sections: sanitizeSections(extractJson(text)), model };
}

/** Keyword fallback when the model is unavailable: skills plus the highest degree, nothing else. */
function extractWithRules(cvText: string): ExtractedSections {
  const lines = cvText.split('\n');
  const skills: CvSkill[] = [];
  for (const s of CANONICAL_SKILLS) {
    const line = lines.find((l) => s.rx.test(l));
    if (!line) continue;
    skills.push({ name: s.name, category: s.category, level: /familiar|basic/i.test(line) ? 'familiar' : 'proficient' });
  }
  const education: CvEducation[] = [];
  const degreeRx: [Degree, RegExp][] = [
    ['PhD', /\bph\.?\s?d\b|doctor of philosophy/i],
    ["Master's", /\bm\.?\s?sc?\b|\bm\.?a\.? in\b|\bmaster|\bmfe\b|\bmba\b/i],
    ["Bachelor's", /\bb\.?\s?sc?\b|\bb\.?a\.? in\b|\bbachelor/i],
  ];
  for (const [degree, rx] of degreeRx) {
    const i = lines.findIndex((l) => rx.test(l));
    if (i < 0) continue;
    const window = lines.slice(i, i + 2).join(' ');
    const years = [...window.matchAll(/\b(19|20)\d{2}\b/g)].map((m) => Number(m[0]));
    const ongoing = /present|expected|current/i.test(window);
    const field = lines[i].match(/(mathematics|statistics|physics|computer science|financial engineering|economics|engineering|operations research|finance)/i);
    education.push({
      institution: 'From CV',
      degree,
      field: field ? field[1].replace(/\b\w/g, (c) => c.toUpperCase()) : null,
      start: years.length ? `${Math.min(...years)}-01` : null,
      end: ongoing || !years.length ? null : `${Math.max(...years)}-06`,
    });
    break; // highest degree only
  }
  return { education, experiences: [], skills, achievements: [], languages: [], projects: [], links: {}, summary: null };
}

export async function extractProfileSections(cvText: string): Promise<{ sections: ExtractedSections; model: string }> {
  try {
    return await extractWithModel(cvText);
  } catch (error) {
    console.error('CV extraction with the model failed, using keyword rules:', error instanceof Error ? error.message : error);
    return { sections: extractWithRules(cvText), model: 'keyword-rules' };
  }
}
