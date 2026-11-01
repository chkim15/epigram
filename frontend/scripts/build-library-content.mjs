// Converts private notebooks and project briefs into one JSON file of rendered HTML.
// The output goes to .protected-content/, which is gitignored. Never commit it.
//
// Usage: node scripts/build-library-content.mjs <notebooksDir> <executedNotebooksDir> <projectsDir>
import fs from "fs";
import path from "path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";
import { codeToHtml } from "shiki";

const [notebooksDir, executedDir, projectsDir] = process.argv.slice(2);
if (!notebooksDir || !executedDir || !projectsDir) {
  console.error("Usage: node scripts/build-library-content.mjs <notebooksDir> <executedNotebooksDir> <projectsDir>");
  process.exit(1);
}

const NOTEBOOKS = [
  ["01_Pairs_Trading_GLD_GDX", "pairs-trading-gld-gdx", "Cointegration, hedge ratios and train/test splits, on a pair whose relationship later breaks down.", true],
  ["02_Daily_Reversal_and_Trading_Costs", "daily-reversal-trading-costs", "Avoid look-ahead, measure turnover, and find the cost at which a real edge disappears."],
  ["03_GARP_Stock_Screen_from_SEC_Filings", "garp-screen-sec-filings", "Build point-in-time fundamentals from SEC filings and test a growth-at-a-reasonable-price screen."],
  ["04_Seven_Factor_Growth_Quality_Trend_Model", "seven-factor-model", "Combine seven factors into one model, then remove each in turn to see what really helps."],
  ["05_52_Week_High_Anomaly", "52-week-high", "Replicate a published anomaly, measure rank IC, and choose the right benchmark."],
  ["06_Earnings_Announcement_Reversal", "earnings-announcement-reversal", "Run an event study with a placebo test, and report a negative result honestly."],
  ["07_Steady_Growth_Screen", "steady-growth-screen", "Compare hard rules with rankings, and use a funnel to diagnose why a screen finds nothing."],
  ["08_Portfolio_Risk_and_Stress_Testing", "portfolio-risk-stress-testing", "Measure factor exposures and tail betas, and build stress tests that could actually happen."],
];

const COMING_SOON_PROJECTS = [
  ["portfolio-risk-report", "Project 2: Risk Report on a Real Portfolio", "Measure factor exposures and tail betas, run stress scenarios, and write a two-page risk memo."],
  ["point-in-time-factor-study", "Project 3: Point-in-Time Factor Study", "Build a clean fundamentals dataset from SEC filings and test one factor without look-ahead."],
  ["alpha-research-pipeline", "Project 4: Alpha Research Pipeline", "Inherit 100 candidate signals, audit them, build a portfolio, and decide what deserves capital."],
];

// The repo resolves unified@10 but remark-parse@11 and rehype-stringify@10 expect the unified@11
// parser and compiler fields, so these adapters connect them without changing dependencies.
function parseAdapter() {
  remarkParse.call(this);
  this.Parser = (doc, file) => this.parser(doc, file);
}
function stringifyAdapter() {
  rehypeStringify.call(this);
  this.Compiler = (tree, file) => this.compiler(tree, file);
}

const markdown = unified()
  .use(parseAdapter)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkRehype)
  .use(rehypeKatex, { throwOnError: false })
  .use(stringifyAdapter);

const renderMarkdown = async (source) => String(await markdown.process(source));
const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const joined = (value) => (Array.isArray(value) ? value.join("") : value ?? "");
const stripAnsi = (s) => s.replace(/\u001b\[[0-9;]*m/g, "");
const cleanTable = (html) =>
  html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\s(id|class|scoped|border)="[^"]*"/gi, "");

function renderOutput(output) {
  if (output.output_type === "stream") {
    if (output.name === "stderr") return "";
    const text = stripAnsi(joined(output.text))
      .split("\n")
      .filter((line) => !line.includes("[notice]"))
      .join("\n")
      .trim();
    return text ? `<pre class="library-output">${escapeHtml(text)}</pre>` : "";
  }
  const data = output.data ?? {};
  if (data["image/png"]) {
    const png = joined(data["image/png"]).replace(/\s/g, "");
    return `<img class="library-chart" alt="Chart" draggable="false" src="data:image/png;base64,${png}">`;
  }
  if (data["text/html"]) return `<div class="library-table">${cleanTable(joined(data["text/html"]))}</div>`;
  if (data["text/plain"]) return `<pre class="library-output">${escapeHtml(joined(data["text/plain"]))}</pre>`;
  return "";
}

function assertClean(label, html) {
  const text = html.replace(/base64,[A-Za-z0-9+/=]+/g, "");
  const problems = [/\/private\/tmp/, /\/Users\//, /[\w.+-]+@[\w-]+\.[a-z]{2,}/i].filter((p) => p.test(text));
  if (problems.length) throw new Error(`${label}: output contains a local path or email: ${problems}`);
}

async function buildNotebook([file, slug, summary, isFreeSample], index) {
  const notebook = JSON.parse(fs.readFileSync(path.join(notebooksDir, `${file}.ipynb`), "utf8"));
  const executed = JSON.parse(fs.readFileSync(path.join(executedDir, `${file}.ipynb`), "utf8"));
  if (notebook.cells.length !== executed.cells.length) throw new Error(`${file}: cell counts differ`);

  // An optional private labs/<file>.json hides all code and adds in-browser practice cells.
  const labsPath = path.join(notebooksDir, "labs", `${file}.json`);
  const labConfig = fs.existsSync(labsPath) ? JSON.parse(fs.readFileSync(labsPath, "utf8")) : null;
  const unusedReplacements = new Set(labConfig?.replacements.map(([from]) => from));
  const applyReplacements = (text) =>
    (labConfig?.replacements ?? []).reduce((out, [from, to]) => {
      if (!out.includes(from)) return out;
      unusedReplacements.delete(from);
      return out.replace(from, to);
    }, text);
  const labPlaceholders = (i) =>
    (labConfig?.labs ?? []).filter((lab) => lab.after_cell === i).map((lab) => `<div data-lab="${lab.id}"></div>`);

  const parts = [];
  for (const [i, cell] of notebook.cells.entries()) {
    const source = joined(cell.source);
    if (cell.cell_type === "markdown") {
      parts.push(await renderMarkdown(applyReplacements(source).replace(/\s*Choose \*Run all\* in Google Colab or Jupyter\./g, "")));
      parts.push(...labPlaceholders(i));
      continue;
    }
    if (joined(executed.cells[i].source) !== source) throw new Error(`${file}: code differs at cell ${i}`);
    if (!labConfig) {
      parts.push(`<div class="library-code">${await codeToHtml(source, { lang: "python", theme: "github-light" })}</div>`);
    }
    parts.push(...(executed.cells[i].outputs ?? []).map(renderOutput));
    parts.push(...labPlaceholders(i));
  }
  if (unusedReplacements.size) throw new Error(`${file}: unused replacements: ${[...unusedReplacements]}`);
  const html = parts.join("\n");
  assertClean(file, html);
  const title = joined(notebook.cells[0].source).split("\n")[0].replace(/^#\s*/, "");
  return { section: "notebooks", slug, title, summary, status: "published", is_free_sample: Boolean(isFreeSample), sort_order: index + 1, html, labs: (labConfig?.labs ?? []).map(({ id, title, instructions, starter }) => ({ id, title, instructions, starter })) };
}

async function buildProjectOne() {
  const source = fs.readFileSync(path.join(projectsDir, "Project_1_Audit_a_Published_Anomaly.md"), "utf8");
  const linked = source
    .replace(/\.\.\/Quant%20Notebooks\/05_52_Week_High_Anomaly\.ipynb/g, "/notebooks/52-week-high")
    .replace(/\.\.\/Quant%20Notebooks\/06_Earnings_Announcement_Reversal\.ipynb/g, "/notebooks/earnings-announcement-reversal");
  if (linked.includes(".ipynb")) throw new Error("Project 1 still links to a notebook file");
  const html = await renderMarkdown(linked);
  return {
    section: "projects",
    slug: "audit-a-published-anomaly",
    title: "Project 1: Audit a Published Anomaly",
    summary: "Test whether a famous market anomaly is still real and tradable, then defend your verdict in a research note.",
    status: "published",
    is_free_sample: false,
    sort_order: 1,
    html,
  };
}

const items = [
  ...(await Promise.all(NOTEBOOKS.map(buildNotebook))),
  await buildProjectOne(),
  ...COMING_SOON_PROJECTS.map(([slug, title, summary], i) => ({
    section: "projects", slug, title, summary, status: "coming_soon", is_free_sample: false, sort_order: i + 2, html: null,
  })),
];

const outDir = path.join(process.cwd(), ".protected-content");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "library.json"), JSON.stringify(items));
for (const item of items) console.log(`${item.section}/${item.slug}: ${Math.round((item.html?.length ?? 0) / 1000)} KB`);
