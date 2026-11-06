import type { SkillCategory } from './types';

// One shared vocabulary for CV skills and job descriptions, so "PyTorch" on a CV and
// "experience with deep learning frameworks such as PyTorch" in a posting meet in the middle.
// Patterns run case-insensitively except where noted (single-letter languages).
export const CANONICAL_SKILLS: { name: string; category: SkillCategory; rx: RegExp }[] = [
  { name: 'Python', category: 'programming', rx: /\bpython\b/i },
  { name: 'C++', category: 'programming', rx: /c\+\+/i },
  { name: 'C', category: 'programming', rx: /\bC\b(?![+#])(?=[,/ )]|\s+programming)/ },
  { name: 'Java', category: 'programming', rx: /\bjava\b(?!script)/i },
  { name: 'Rust', category: 'programming', rx: /\brust\b/i },
  { name: 'Go', category: 'programming', rx: /\bgolang\b/i },
  { name: 'OCaml', category: 'programming', rx: /\bocaml\b/i },
  { name: 'R', category: 'programming', rx: /\bR\b(?=[,/ )]|$)/ },
  { name: 'MATLAB', category: 'programming', rx: /\bmatlab\b/i },
  { name: 'SQL', category: 'programming', rx: /\bsql\b/i },
  { name: 'kdb+/q', category: 'programming', rx: /\bkdb\b|\bq\/kdb/i },
  { name: 'Julia', category: 'programming', rx: /\bjulia\b/i },
  { name: 'C#', category: 'programming', rx: /c#|\.net\b/i },
  { name: 'JavaScript/TypeScript', category: 'programming', rx: /javascript|typescript|\breact\b/i },
  { name: 'Linux', category: 'tools', rx: /\blinux\b/i },
  { name: 'FPGA/Verilog', category: 'programming', rx: /\bfpga\b|verilog|vhdl/i },
  { name: 'CUDA/GPU', category: 'tools', rx: /\bcuda\b|\bgpus?\b/i },
  { name: 'pandas/NumPy', category: 'tools', rx: /\bpandas\b|\bnumpy\b|\bscipy\b/i },
  { name: 'PyTorch/TensorFlow', category: 'machine_learning', rx: /pytorch|tensorflow|\bjax\b|\bkeras\b/i },
  { name: 'Distributed systems', category: 'tools', rx: /distributed systems?|low[- ]latency|high[- ]performance computing|\bhpc\b/i },
  { name: 'Probability', category: 'math_stats', rx: /probabilit/i },
  { name: 'Statistics', category: 'math_stats', rx: /\bstatistic/i },
  { name: 'Stochastic calculus', category: 'math_stats', rx: /stochastic (calculus|processes|differential)/i },
  { name: 'Time series', category: 'math_stats', rx: /time[- ]series/i },
  { name: 'Econometrics', category: 'math_stats', rx: /econometric/i },
  { name: 'Optimization', category: 'math_stats', rx: /\boptimi[sz]ation\b|convex/i },
  { name: 'Linear algebra', category: 'math_stats', rx: /linear algebra/i },
  { name: 'Bayesian methods', category: 'math_stats', rx: /bayesian/i },
  { name: 'Causal inference', category: 'math_stats', rx: /causal inference/i },
  { name: 'Numerical methods', category: 'math_stats', rx: /numerical (methods|analysis)|monte carlo|\bpde\b/i },
  { name: 'Machine learning', category: 'machine_learning', rx: /machine learning|\bml\b/i },
  { name: 'Deep learning', category: 'machine_learning', rx: /deep learning|neural net|transformer/i },
  { name: 'LLMs/NLP', category: 'machine_learning', rx: /\bllms?\b|large language model|natural language|\bnlp\b/i },
  { name: 'Reinforcement learning', category: 'machine_learning', rx: /reinforcement learning/i },
  { name: 'Options/derivatives', category: 'finance', rx: /\boptions (trading|pricing|markets?|theory|market[- ]making)|\bderivatives\b|derivative pricing|volatility|greeks/i },
  { name: 'Market making', category: 'finance', rx: /market[- ]making/i },
  { name: 'Alpha research', category: 'finance', rx: /\balpha\b|signal (research|generation)|predictive signals?/i },
  { name: 'Portfolio construction', category: 'finance', rx: /portfolio (construction|optimi)|risk model/i },
  { name: 'Execution/microstructure', category: 'finance', rx: /market microstructure|order books?|trade execution|execution (algorithms?|research|strateg)/i },
  { name: 'Fixed income', category: 'finance', rx: /fixed income|interest rates?|\brates\b/i },
  { name: 'Equities', category: 'finance', rx: /\bequities\b|\bequity (premium|markets?|research|trading|derivatives|options|long|stat)/i },
  { name: 'Futures', category: 'finance', rx: /\bfutures\b/i },
  { name: 'Crypto', category: 'finance', rx: /crypto|digital assets/i },
  { name: 'Risk management', category: 'finance', rx: /risk management|market risk|credit risk|model validation|\bxva\b/i },
];

/** Canonical skills mentioned anywhere in a block of text (e.g. a job posting). */
export function detectSkills(text: string): Set<string> {
  const found = new Set<string>();
  for (const s of CANONICAL_SKILLS) if (s.rx.test(text)) found.add(s.name);
  return found;
}

/** Map one skill name from a CV ("PyTorch", "C++17") onto the shared vocabulary, if it fits. */
export function canonicalSkill(name: string): { name: string; category: SkillCategory } | null {
  const padded = ` ${name} `;
  const hit = CANONICAL_SKILLS.find((s) => s.rx.test(padded));
  return hit ? { name: hit.name, category: hit.category } : null;
}
