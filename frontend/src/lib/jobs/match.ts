import { canonicalSkill, detectSkills } from './skills';
import type { CareerStage, CvProfile, JobLevel, JobMatch, JobRole, TaggedOpening } from './types';

// Rules-based scoring, explainable line by line. Weights add up to 1.
const WEIGHTS = { skills: 0.35, text: 0.2, level: 0.2, role: 0.15, location: 0.1 };
const MAX_MATCHES = 60;
const PHD_RX = /\bph\.?\s?d(s|'s)?\b|doctoral|postdoc/i;
const SKILL_PRIOR = 2; // pseudo-skills at 50% added to every posting's skill count

// How well a job's level suits the candidate's stage. Missing pairs are excluded outright.
const LEVEL_FIT: Record<CareerStage, Partial<Record<JobLevel, number>>> = {
  Experienced: { Experienced: 1, Unspecified: 0.8, 'New grad': 0.5 },
  'New grad': { 'New grad': 1, Unspecified: 0.8, Intern: 0.5, Experienced: 0.4 },
  Student: { Intern: 1, 'New grad': 1, Unspecified: 0.6, Experienced: 0.2 },
};

const LEAN_WORDS: Record<JobRole, RegExp> = {
  'Quant Researcher': /research|thesis|publication|statistic|econometric|model|phd|scientist/gi,
  'Quant Trader': /trad(er|ing)|market making|pnl|p&l|options|portfolio manager/gi,
  'Quant Developer': /low[- ]latency|c\+\+|trading system|quant(itative)? developer|fpga/gi,
  'Quant Analyst & Strats': /strat|structur|pricing|derivativ|quantitative analyst/gi,
  'Risk & Model Validation': /risk|model validation|xva|stress test/gi,
  'Data Science & ML': /machine learning|data scien|deep learning|\bml\b|\bai\b/gi,
  'Software Engineering': /software|engineer|developer|backend|infrastructure/gi,
};

const STOP = new Set(('a an the and or of to in for on with by at from as is are be will you your our we this that ' +
  'it its role team work working experience strong ability skills including such other more years plus ' +
  'equal opportunity employer benefits salary candidates job position apply').split(' '));

function tokens(text: string): string[] {
  return text.toLowerCase().match(/[a-z][a-z+#]{1,24}/g)?.filter((t) => !STOP.has(t)) ?? [];
}

/** Everything in the profile that describes the person, as one text for similarity. */
export function profileText(p: CvProfile): string {
  return [
    p.summary,
    ...p.education.map((e) => `${e.degree} ${e.field ?? ''} ${e.thesis ?? ''}`),
    ...p.experiences.map((e) => `${e.title} ${e.organization} ${e.highlights.join(' ')} ${e.skills.join(' ')}`),
    ...p.skills.map((s) => s.name),
    ...p.projects.map((pr) => `${pr.name} ${pr.description ?? ''} ${pr.skills.join(' ')}`),
  ].filter(Boolean).join('\n');
}

/** TF-IDF cosine between the profile and each job, scaled so the best job scores 1. */
function textSimilarity(profile: string, jobs: TaggedOpening[]): number[] {
  const docs = jobs.map((j) => tokens(`${j.title} ${j.title} ${j.description}`));
  const df = new Map<string, number>();
  docs.forEach((d) => new Set(d).forEach((t) => df.set(t, (df.get(t) ?? 0) + 1)));
  const idf = (t: string) => Math.log((jobs.length + 1) / ((df.get(t) ?? 0) + 1)) + 1;
  const vec = (toks: string[]) => {
    const tf = new Map<string, number>();
    toks.forEach((t) => tf.set(t, (tf.get(t) ?? 0) + 1));
    const v = new Map<string, number>();
    let norm = 0;
    tf.forEach((n, t) => { const w = (1 + Math.log(n)) * idf(t); v.set(t, w); norm += w * w; });
    return { v, norm: Math.sqrt(norm) || 1 };
  };
  const p = vec(tokens(profile));
  const sims = docs.map((d) => {
    const j = vec(d);
    let dot = 0;
    j.v.forEach((w, t) => { dot += w * (p.v.get(t) ?? 0); });
    return dot / (j.norm * p.norm);
  });
  const top = Math.max(...sims, 1e-9);
  return sims.map((s) => s / top);
}

export function scoreMatches(profile: CvProfile, openings: TaggedOpening[], now = new Date()): JobMatch[] {
  const stage = profile.careerStage ?? 'Experienced';
  const levelFit = LEVEL_FIT[stage];

  // Candidate skills on the shared vocabulary; "familiar" counts half.
  const skillWeight = new Map<string, number>();
  for (const s of profile.skills) {
    const c = canonicalSkill(s.name);
    if (!c) continue;
    const w = s.level === 'familiar' ? 0.5 : 1;
    skillWeight.set(c.name, Math.max(skillWeight.get(c.name) ?? 0, w));
  }
  for (const e of profile.experiences) for (const sk of e.skills) {
    const c = canonicalSkill(sk);
    if (c && !skillWeight.has(c.name)) skillWeight.set(c.name, 1);
  }

  // Role leaning from the CV, used only when the user hasn't picked roles.
  const text = profileText(profile);
  const lean = Object.fromEntries(Object.entries(LEAN_WORDS).map(([role, rx]) => [role, text.match(rx)?.length ?? 0])) as Record<JobRole, number>;
  const topLean = Math.max(...Object.values(lean), 1);

  const candidates = openings.filter((o) =>
    levelFit[o.level] !== undefined &&
    (!profile.preferredRoles.length || profile.preferredRoles.includes(o.role)) &&
    (!profile.preferredLevels.length || profile.preferredLevels.includes(o.level)) &&
    (!profile.preferredRegions.length || o.regions.some((r) => profile.preferredRegions.includes(r)))
  );
  if (!candidates.length) return [];
  const sims = textSimilarity(text, candidates);
  const computedAt = now.toISOString();

  return candidates.map((o, i) => {
    const wants = detectSkills(`${o.title}\n${o.description}`);
    const matched = [...wants].filter((s) => skillWeight.has(s));
    const missing = [...wants].filter((s) => !skillWeight.has(s));
    // Shrink toward 0.5 when a posting names few skills, so "3 of 3" doesn't beat "7 of 8".
    const have = matched.reduce((sum, s) => sum + (skillWeight.get(s) ?? 0), 0);
    const skillScore = (have + 0.5 * SKILL_PRIOR) / (wants.size + SKILL_PRIOR);
    const roleScore = profile.preferredRoles.length ? 1 : lean[o.role] / topLean;
    const locationScore = profile.preferredRegions.length ? 1 : 0.7;
    let score =
      WEIGHTS.skills * skillScore + WEIGHTS.text * sims[i] + WEIGHTS.level * (levelFit[o.level] ?? 0) +
      WEIGHTS.role * roleScore + WEIGHTS.location * locationScore;

    const notes: string[] = [];
    const hasOrDoingPhd = profile.highestDegree === 'PhD' || profile.education.some((e) => e.degree === 'PhD');
    if (PHD_RX.test(o.title)) {
      // Roles for PhDs say so in the title ("Graduate QR, PhD", "PhD/Postdoc").
      if (hasOrDoingPhd) { score += 0.05; notes.push('For PhD candidates (you have one)'); }
      else { score -= 0.3; notes.push('For PhD candidates'); }
    } else if (PHD_RX.test(o.description)) {
      if (hasOrDoingPhd) { score += 0.05; notes.push('Mentions a PhD (you have one)'); }
      else if (/ph\.?\s?d\.?\s+(is\s+)?required/i.test(o.description)) { score -= 0.1; notes.push('Appears to require a PhD'); }
    }
    const familiar = matched.filter((s) => skillWeight.get(s) === 0.5);
    if (familiar.length) notes.push(`Asks for ${familiar.join(', ')}, which your CV lists as "familiar"`);
    if (o.level === 'New grad' && stage === 'Experienced') notes.push('Graduate-level role');
    if (!o.description) notes.push('Scored from the title only (no description available)');

    return {
      openingId: o.id,
      score: Math.max(0, Math.min(100, Math.round(score * 100))),
      matchedSkills: matched.sort(),
      missingSkills: missing.sort(),
      notes,
      computedAt,
    };
  }).sort((a, b) => b.score - a.score).slice(0, MAX_MATCHES);
}
