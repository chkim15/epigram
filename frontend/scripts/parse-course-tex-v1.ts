/**
 * Parse .tex course files into structured JSON.
 * Run: npx tsx scripts/parse-course-tex.ts
 */

import * as fs from "fs";
import * as path from "path";

interface CourseSection {
  title: string;
  blocks: ContentBlock[];
}

type ContentBlock =
  | { type: "text"; content: string }
  | { type: "subsection"; title: string }
  | { type: "conceptbox"; title: string; content: string }
  | { type: "techniquebox"; title: string; content: string }
  | { type: "keyresult"; title: string; content: string }
  | { type: "warningbox"; title: string; content: string }
  | {
      type: "workedproblem";
      number: string;
      difficulty: string;
      tier: "free" | "premium";
      content: string;
      solution: string;
      problemId?: string;
    }
  | {
      type: "freeproblem";
      number: string;
      difficulty: string;
      problemId: string;
      content: string;
      solution: string;
    }
  | {
      type: "premiumproblem";
      number: string;
      difficulty: string;
      problemId: string;
      content: string;
      solution: string;
    }
  | { type: "techniquesummary"; content: string };

interface ProblemIndexEntry {
  number: string;
  name: string;
  problemId: string;
}

interface CourseTopicJSON {
  weekNum: number;
  topicNum: number;
  topicName: string;
  subtopics: string;
  freeProblems: number;
  premiumProblems: number;
  timeEstimate: string;
  prerequisites: string;
  learningObjectives: string[];
  sections: CourseSection[];
  problemIndex: ProblemIndexEntry[];
}

// ── Custom macro expansion ──────────────────────────────────
function expandMacros(text: string): string {
  let out = text;
  // Custom macros
  out = out.replace(/\\E\b(?![a-zA-Z])/g, "\\mathbb{E}");
  out = out.replace(/\\Prob\b/g, "\\mathbb{P}");
  out = out.replace(/\\Var\b/g, "\\text{Var}");
  out = out.replace(/\\Cov\b/g, "\\text{Cov}");
  out = out.replace(/\\Corr\b/g, "\\text{Corr}");
  out = out.replace(/\\indep\b/g, "\\perp\\!\\!\\!\\perp");
  out = out.replace(/\\iid\b/g, "\\text{i.i.d.}");
  out = out.replace(/\\MSE\b/g, "\\text{MSE}");
  out = out.replace(/\\Bias\b/g, "\\text{Bias}");
  out = out.replace(/\\se\b/g, "\\text{SE}");
  out = out.replace(/\\RSS\b/g, "\\text{RSS}");
  out = out.replace(/\\TSS\b/g, "\\text{TSS}");
  // Unescape underscores (LaTeX \_ → _)
  out = out.replace(/\\_/g, "_");
  return out;
}

// ── Strip LaTeX comments ────────────────────────────────────
function stripComments(line: string): string {
  // Don't strip if the % is escaped with backslash
  let result = "";
  for (let i = 0; i < line.length; i++) {
    if (line[i] === "%" && (i === 0 || line[i - 1] !== "\\")) {
      break;
    }
    result += line[i];
  }
  return result;
}

// ── Brace-aware argument extractor ──────────────────────────
function extractBracedArgs(line: string, envNameStr: string): string[] | null {
  const prefix = `\\begin{${envNameStr}}`;
  const idx = line.indexOf(prefix);
  if (idx === -1) return null;

  const args: string[] = [];
  let pos = idx + prefix.length;
  while (pos < line.length && line[pos] === "{") {
    let depth = 0;
    const start = pos + 1;
    for (let i = pos; i < line.length; i++) {
      if (line[i] === "{") depth++;
      else if (line[i] === "}") {
        depth--;
        if (depth === 0) {
          args.push(line.substring(start, i));
          pos = i + 1;
          break;
        }
      }
    }
  }
  return args.length > 0 ? args : null;
}

// ── Extract difficulty from \difficultytitle{...} ───────────
function extractDifficulty(text: string): string {
  const m = text.match(/\\difficultytitle\{(\w+)\}/);
  return m ? m[1] : "medium";
}

// ── Determine tier from labels in env args ──────────────────
function extractTier(text: string): "free" | "premium" {
  if (text.includes("\\premiumlabel")) return "premium";
  return "free";
}

// ── Convert \begin{tabular}...\end{tabular} → HTML table ────
function convertTabular(text: string): string {
  // Use brace-aware matching for column spec (handles nested braces like @{}p{4.4cm}@{})
  const result: string[] = [];
  let pos = 0;
  while (pos < text.length) {
    const beginIdx = text.indexOf("\\begin{tabular}", pos);
    if (beginIdx === -1) {
      result.push(text.slice(pos));
      break;
    }
    result.push(text.slice(pos, beginIdx));
    // Skip past \begin{tabular}
    let cur = beginIdx + "\\begin{tabular}".length;
    // Extract column spec with brace-aware matching
    if (cur < text.length && text[cur] === "{") {
      let depth = 0;
      for (let i = cur; i < text.length; i++) {
        if (text[i] === "{") depth++;
        else if (text[i] === "}") {
          depth--;
          if (depth === 0) { cur = i + 1; break; }
        }
      }
    }
    // Find \end{tabular}
    const endIdx = text.indexOf("\\end{tabular}", cur);
    if (endIdx === -1) {
      result.push(text.slice(beginIdx));
      break;
    }
    const body = text.slice(cur, endIdx);
    result.push(convertTabularBody(body));
    pos = endIdx + "\\end{tabular}".length;
  }
  return result.join("");
}

function convertTabularBody(body: string): string {
  {
      // Strip booktabs rules
      let cleaned = body
        .replace(/\\toprule/g, "")
        .replace(/\\midrule/g, "")
        .replace(/\\bottomrule/g, "")
        .replace(/\\hline/g, "");
      // Split rows by \\ (with optional [Npt] spacing)
      const rows = cleaned
        .split(/\\\\(?:\s*\[\d+(?:pt|mm|em)\])?\s*/)
        .map((r) => r.trim())
        .filter((r) => r.length > 0);
      const htmlRows = rows.map((row, rIdx) => {
        const cells = row.split("&").map((c) => c.trim());
        const isHeader =
          rIdx === 0 && cells.some((c) => c.includes("\\textbf"));
        const tag = isHeader ? "th" : "td";
        const htmlCells = cells
          .map((c) => {
            // Clean cell content
            let cell = c.replace(/\\textbf\{([^}]*)\}/g, "$1");
            cell = cleanContent(cell);
            return `<${tag}>${cell}</${tag}>`;
          })
          .join("");
        return `<tr>${htmlCells}</tr>`;
      });
      return `<table class="course-table">${htmlRows.join("")}</table>`;
  }
}

// ── Replace pattern only outside math environments ──────────
function replaceOutsideMath(text: string, pattern: RegExp, replacement: string): string {
  // Protect content inside \begin{align*}...\end{align*}, $$...$$, \[...\]
  const mathRegions: { start: number; end: number }[] = [];
  const mathPatterns = [
    /\$\$[\s\S]*?\$\$/g,
    /\\\[[\s\S]*?\\\]/g,
    /\\begin\{align\*?\}[\s\S]*?\\end\{align\*?\}/g,
    /\\begin\{equation\*?\}[\s\S]*?\\end\{equation\*?\}/g,
    /\\begin\{gather\*?\}[\s\S]*?\\end\{gather\*?\}/g,
  ];
  for (const mp of mathPatterns) {
    let m;
    while ((m = mp.exec(text)) !== null) {
      mathRegions.push({ start: m.index, end: m.index + m[0].length });
    }
  }
  // Sort by start position
  mathRegions.sort((a, b) => a.start - b.start);

  // Build result, applying replacement only outside math regions
  let result = "";
  let pos = 0;
  for (const region of mathRegions) {
    if (region.start > pos) {
      result += text.slice(pos, region.start).replace(pattern, replacement);
    }
    result += text.slice(Math.max(pos, region.start), region.end);
    pos = region.end;
  }
  if (pos < text.length) {
    result += text.slice(pos).replace(pattern, replacement);
  }
  return result;
}

// ── Clean content: remove some LaTeX cruft ──────────────────
function cleanContent(text: string): string {
  let out = text.trim();
  // Convert tabular environments to HTML tables
  out = convertTabular(out);
  // Remove \vspace commands
  out = out.replace(/\\vspace\{[^}]*\}/g, "");
  // Remove \noindent
  out = out.replace(/\\noindent\s*/g, "");
  // Remove \hfill
  out = out.replace(/\\hfill\b/g, "");
  // Clean up \freelabel and \premiumlabel
  out = out.replace(/\\freelabel/g, "");
  out = out.replace(/\\premiumlabel/g, "");
  // Clean up \difficultytitle{...} → [difficulty]
  out = out.replace(/\\difficultytitle\{(\w+)\}/g, "");
  // Remove leading/trailing \\quad etc
  out = out.replace(/^\\quad\s*/g, "");
  // Remove \checkmark
  out = out.replace(/\\checkmark/g, "✓");
  // Remove \strut
  out = out.replace(/\\strut/g, "");
  // Strip \color{...} commands
  out = out.replace(/\\color\{[^}]+\}/g, "");
  // Strip \begin{center} and \end{center}
  out = out.replace(/\\begin\{center\}/g, "");
  out = out.replace(/\\end\{center\}/g, "");
  // Strip size commands
  out = out.replace(
    /\\(small|large|footnotesize|normalsize|Large|LARGE|huge|Huge)\b/g,
    ""
  );
  // Convert \textbf and \textit to markdown bold/italic
  out = out.replace(/\\textbf\{([^}]*)\}/g, "**$1**");
  out = out.replace(/\\textit\{([^}]*)\}/g, "*$1*");
  // Convert dashes and quotes
  out = out.replace(/---/g, "\u2014"); // em dash
  out = out.replace(/--/g, "\u2013"); // en dash
  out = out.replace(/``/g, "\u201C"); // opening "
  out = out.replace(/''/g, "\u201D"); // closing "
  out = out.replace(/\\ldots/g, "\u2026"); // ellipsis
  // Convert \\[Npt] spacing to <br> — but NOT inside math environments
  out = replaceOutsideMath(out, /\\\\\[\d+pt\]/g, "<br>");
  // Expand macros
  out = expandMacros(out);
  return out.trim();
}

// ── Parse a single .tex file ────────────────────────────────
function parseTex(filePath: string): CourseTopicJSON {
  const raw = fs.readFileSync(filePath, "utf-8");
  const lines = raw.split("\n");

  // ── Metadata extraction ─────────────────────────────────
  let weekNum = 0;
  let topicNum = 0;
  let topicName = "";
  let subtopics = "";
  let freeProblems = 0;
  let premiumProblems = 0;
  let timeEstimate = "";
  let prerequisites = "";
  const learningObjectives: string[] = [];
  const sections: CourseSection[] = [];
  const problemIndex: ProblemIndexEntry[] = [];

  // ── State machine ───────────────────────────────────────
  let currentSection: CourseSection | null = null;
  let envStack: string[] = [];
  let envContent: string[] = [];
  let envName = "";
  let envArgs: string[] = [];
  let inLearningObjectives = false;
  let inIdTable = false;
  let inTechniqueSummary = false;
  let techSummaryContent: string[] = [];
  let inProblemIndex = false; // the tabular in Problem Index section
  let skipUntilEndDocument = false;
  let pendingProblem: ContentBlock | null = null;
  let solutionContent: string[] = [];
  let inSolution = false;
  let inWarningInsideSolution = false;
  let warningInsideSolutionContent: string[] = [];

  // Extract \epigramsetup
  const setupMatch = raw.match(
    /\\epigramsetup\{(\d+)\}\{(\d+)\}\{([^}]+)\}/
  );
  if (setupMatch) {
    weekNum = parseInt(setupMatch[1]);
    topicNum = parseInt(setupMatch[2]);
    topicName = setupMatch[3];
  }

  // Extract \epigramtitle
  const titleMatch = raw.match(
    /\\epigramtitle\s*\n?\s*\{([^}]*)\}\s*\n?\s*\{(\d+)\}\{(\d+)\}\s*\n?\s*\{([^}]*)\}\s*\n?\s*\{([^}]*)\}/
  );
  if (titleMatch) {
    subtopics = cleanContent(titleMatch[1]);
    freeProblems = parseInt(titleMatch[2]);
    premiumProblems = parseInt(titleMatch[3]);
    timeEstimate = titleMatch[4].trim();
    prerequisites = titleMatch[5].trim();
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = stripComments(rawLine).trimEnd();

    if (skipUntilEndDocument) continue;

    // ── ID table parsing ────────────────────────────────
    if (line.match(/\\begin\{idtable\}/)) {
      inIdTable = true;
      continue;
    }
    if (inIdTable) {
      if (line.match(/\\end\{idtable\}/)) {
        inIdTable = false;
        continue;
      }
      const idMatch = line.match(/\\idrow\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}/);
      if (idMatch) {
        problemIndex.push({
          number: idMatch[1],
          name: idMatch[2],
          problemId: expandMacros(idMatch[3]),
        });
      }
      continue;
    }

    // ── Skip document preamble ──────────────────────────
    if (line.match(/\\begin\{document\}/) || line.match(/\\epigramtitle/)) {
      continue;
    }
    if (line.match(/\\epigramfooter/)) {
      continue;
    }
    if (line.match(/\\end\{document\}/)) {
      // Flush any pending problem without solution
      if (pendingProblem && currentSection) {
        if (pendingProblem.type === "workedproblem" && !("problemId" in pendingProblem && pendingProblem.problemId)) {
          const idx = problemIndex.find(
            (p) => p.number === (pendingProblem as { number: string }).number
          );
          if (idx) (pendingProblem as { problemId?: string }).problemId = idx.problemId;
        }
        currentSection.blocks.push(pendingProblem);
        pendingProblem = null;
      }
      skipUntilEndDocument = true;
      continue;
    }
    if (
      line.match(/\\documentclass/) ||
      line.match(/\\usepackage/) ||
      line.match(/\\epigramsetup/) ||
      line.match(/\\showids/)
    ) {
      continue;
    }

    // ── Learning objectives (tcolorbox with "By the end") ─
    if (
      line.includes("\\begin{tcolorbox}") &&
      i + 5 < lines.length &&
      lines.slice(i, i + 10).some((l) => l.includes("By the end"))
    ) {
      inLearningObjectives = true;
      continue;
    }
    if (inLearningObjectives) {
      if (line.includes("\\end{tcolorbox}")) {
        inLearningObjectives = false;
        continue;
      }
      // Extract \item content
      const itemMatch = line.match(/\\item\s+(.*)/);
      if (itemMatch) {
        let obj = cleanContent(itemMatch[1]);
        // Accumulate multiline items
        let j = i + 1;
        while (
          j < lines.length &&
          !stripComments(lines[j]).trimEnd().match(/\\item\s/) &&
          !stripComments(lines[j]).trimEnd().includes("\\end{enumerate}") &&
          !stripComments(lines[j]).trimEnd().includes("\\end{tcolorbox}")
        ) {
          const nextLine = stripComments(lines[j]).trimEnd();
          if (nextLine.trim()) {
            obj += " " + cleanContent(nextLine);
          }
          j++;
        }
        learningObjectives.push(obj);
        i = j - 1; // advance
      }
      continue;
    }

    // ── Technique summary (tcolorbox with "Technique Toolkit" or "Summary") ──
    if (
      line.includes("\\begin{tcolorbox}") &&
      !inLearningObjectives &&
      i + 3 < lines.length
    ) {
      const nextLines = lines.slice(i, i + 5).join(" ");
      if (
        nextLines.includes("Technique Toolkit") ||
        nextLines.includes("Technique Summary") ||
        nextLines.includes("Summary of Key")
      ) {
        inTechniqueSummary = true;
        techSummaryContent = [];
        continue;
      }
    }
    if (inTechniqueSummary) {
      if (line.includes("\\end{tcolorbox}")) {
        inTechniqueSummary = false;
        if (currentSection && techSummaryContent.length > 0) {
          currentSection.blocks.push({
            type: "techniquesummary",
            content: cleanContent(techSummaryContent.join("\n")),
          });
        }
        continue;
      }
      // Skip tcolorbox option lines (e.g. "arc=2mm," or closing "]")
      if (line.match(/^\s*(arc=|colback=|colframe=|fonttitle=|title=|\])/)) {
        continue;
      }
      techSummaryContent.push(line);
      continue;
    }

    // ── Problem Index section (skip the tabular) ────────
    if (line.match(/\\section\{Problem Index\}/)) {
      inProblemIndex = true;
      continue;
    }
    if (inProblemIndex) {
      if (line.match(/\\end\{center\}/)) {
        inProblemIndex = false;
      }
      continue;
    }

    // ── Section headers ─────────────────────────────────
    const sectionMatch = line.match(/\\section\{(.+)\}/);
    if (sectionMatch && pendingProblem && currentSection) {
      // Flush any pending problem without solution before switching sections
      if (pendingProblem.type === "workedproblem" && !("problemId" in pendingProblem && pendingProblem.problemId)) {
        const idx = problemIndex.find(
          (p) => p.number === (pendingProblem as { number: string }).number
        );
        if (idx) (pendingProblem as { problemId?: string }).problemId = idx.problemId;
      }
      currentSection.blocks.push(pendingProblem);
      pendingProblem = null;
    }
    if (sectionMatch) {
      const title = cleanContent(sectionMatch[1]);
      if (
        title === "Problem Index" ||
        title === "Technique Summary" ||
        title === "Additional Exercises"
      ) {
        // Additional Exercises is a real section
        if (title === "Additional Exercises") {
          currentSection = { title, blocks: [] };
          sections.push(currentSection);
        }
        continue;
      }
      currentSection = { title, blocks: [] };
      sections.push(currentSection);
      continue;
    }

    // ── Subsection headers ──────────────────────────────
    const subsectionMatch = line.match(/\\subsection\{(.+)\}/);
    if (subsectionMatch && currentSection) {
      currentSection.blocks.push({
        type: "subsection",
        title: cleanContent(subsectionMatch[1]),
      });
      continue;
    }

    // ── Environment begins ──────────────────────────────
    // conceptbox, techniquebox, keyresult, warningbox
    const boxEnvNames = ["conceptbox", "techniquebox", "keyresult", "warningbox"];
    let boxMatch: string[] | null = null;
    let boxEnvType = "";
    for (const benv of boxEnvNames) {
      if (line.includes(`\\begin{${benv}}`)) {
        const args = extractBracedArgs(line, benv);
        boxMatch = args;
        boxEnvType = benv;
        break;
      }
    }
    if (boxMatch && !inSolution) {
      envName = boxEnvType;
      envArgs = [boxMatch[0] || ""];
      envContent = [];
      envStack.push(envName);
      continue;
    }

    // warningbox inside solution
    if (line.match(/\\begin\{warningbox\}/) && inSolution) {
      inWarningInsideSolution = true;
      warningInsideSolutionContent = [];
      continue;
    }
    if (inWarningInsideSolution) {
      if (line.match(/\\end\{warningbox\}/)) {
        inWarningInsideSolution = false;
        // Append warning to solution content
        solutionContent.push(
          "\n**Warning:** " + cleanContent(warningInsideSolutionContent.join("\n"))
        );
        continue;
      }
      warningInsideSolutionContent.push(line);
      continue;
    }

    // Environment end for boxes
    const boxEndMatch = line.match(
      /\\end\{(conceptbox|techniquebox|keyresult|warningbox)\}/
    );
    if (boxEndMatch && envStack.length > 0 && !inSolution) {
      envStack.pop();
      if (currentSection) {
        currentSection.blocks.push({
          type: envName as
            | "conceptbox"
            | "techniquebox"
            | "keyresult"
            | "warningbox",
          title: envArgs[0] || "",
          content: cleanContent(envContent.join("\n")),
        });
      }
      envName = "";
      envArgs = [];
      envContent = [];
      continue;
    }

    // Accumulate box content (only for non-problem box environments)
    if (
      envStack.length > 0 &&
      !inSolution &&
      ["conceptbox", "techniquebox", "keyresult", "warningbox"].includes(envName)
    ) {
      envContent.push(line);
      continue;
    }

    // ── Problem environments ────────────────────────────
    // Helper: flush pendingProblem (no solutionbox) before new problem or section
    const flushPending = () => {
      if (pendingProblem && currentSection) {
        // Look up problemId from idtable for worked problems
        if (pendingProblem.type === "workedproblem" && !("problemId" in pendingProblem && pendingProblem.problemId)) {
          const idx = problemIndex.find(
            (p) => p.number === (pendingProblem as { number: string }).number
          );
          if (idx) {
            (pendingProblem as { problemId?: string }).problemId = idx.problemId;
          }
        }
        currentSection.blocks.push(pendingProblem);
        pendingProblem = null;
      }
    };

    // workedbox: \begin{workedbox}{number}{label \difficultytitle{...}}
    const workedArgs = line.includes("\\begin{workedbox}")
      ? extractBracedArgs(line, "workedbox")
      : null;
    if (workedArgs) {
      flushPending();
      const number = workedArgs[0];
      const argStr = workedArgs[1] || "";
      const difficulty = extractDifficulty(argStr);
      const tier = extractTier(argStr);
      envContent = [];
      envName = "workedbox";
      envStack.push("workedbox");
      envArgs = [number, difficulty, tier];
      continue;
    }

    if (line.match(/\\end\{workedbox\}/) && envName === "workedbox") {
      envStack.pop();
      pendingProblem = {
        type: "workedproblem",
        number: envArgs[0],
        difficulty: envArgs[1],
        tier: envArgs[2] as "free" | "premium",
        content: cleanContent(envContent.join("\n")),
        solution: "",
      };
      envName = "";
      envContent = [];
      continue;
    }

    // freeproblem: \begin{freeproblem}{number}{label}{difficulty}{problemId}
    const freeArgs = line.includes("\\begin{freeproblem}")
      ? extractBracedArgs(line, "freeproblem")
      : null;
    if (freeArgs) {
      flushPending();
      envContent = [];
      envName = "freeproblem";
      envStack.push("freeproblem");
      envArgs = [
        freeArgs[0],
        extractDifficulty(freeArgs[2] || ""),
        expandMacros(freeArgs[3] || ""),
      ];
      continue;
    }

    if (line.match(/\\end\{freeproblem\}/) && envName === "freeproblem") {
      envStack.pop();
      pendingProblem = {
        type: "freeproblem",
        number: envArgs[0],
        difficulty: envArgs[1],
        problemId: envArgs[2],
        content: cleanContent(envContent.join("\n")),
        solution: "",
      };
      envName = "";
      envContent = [];
      continue;
    }

    // premiumproblem: \begin{premiumproblem}{number}{label}{difficulty}{problemId}
    const premiumArgs = line.includes("\\begin{premiumproblem}")
      ? extractBracedArgs(line, "premiumproblem")
      : null;
    if (premiumArgs) {
      flushPending();
      envContent = [];
      envName = "premiumproblem";
      envStack.push("premiumproblem");
      envArgs = [
        premiumArgs[0],
        extractDifficulty(premiumArgs[2] || ""),
        expandMacros(premiumArgs[3] || ""),
      ];
      continue;
    }

    if (
      line.match(/\\end\{premiumproblem\}/) &&
      envName === "premiumproblem"
    ) {
      envStack.pop();
      pendingProblem = {
        type: "premiumproblem",
        number: envArgs[0],
        difficulty: envArgs[1],
        problemId: envArgs[2],
        content: cleanContent(envContent.join("\n")),
        solution: "",
      };
      envName = "";
      envContent = [];
      continue;
    }

    // Accumulate problem content
    if (
      envStack.length > 0 &&
      ["workedbox", "freeproblem", "premiumproblem"].includes(envName)
    ) {
      envContent.push(line);
      continue;
    }

    // ── Solution box ────────────────────────────────────
    if (line.match(/\\begin\{solutionbox\}/)) {
      inSolution = true;
      solutionContent = [];
      continue;
    }
    if (line.match(/\\end\{solutionbox\}/) && inSolution) {
      inSolution = false;
      if (pendingProblem && currentSection) {
        // Attach solution to pending problem
        const solution = cleanContent(solutionContent.join("\n"));
        if (
          pendingProblem.type === "workedproblem" ||
          pendingProblem.type === "freeproblem" ||
          pendingProblem.type === "premiumproblem"
        ) {
          (pendingProblem as { solution: string }).solution = solution;
        }
        // Look up problemId from idtable for worked problems
        if (pendingProblem.type === "workedproblem") {
          const idx = problemIndex.find(
            (p) => p.number === (pendingProblem as { number: string }).number
          );
          if (idx) {
            (pendingProblem as { problemId?: string }).problemId =
              idx.problemId;
          }
        }
        currentSection.blocks.push(pendingProblem);
        pendingProblem = null;
      }
      continue;
    }
    if (inSolution) {
      solutionContent.push(line);
      continue;
    }

    // ── Regular text content ────────────────────────────
    if (currentSection && line.trim() && !line.match(/^\\(begin|end)\{/)) {
      // Skip certain LaTeX commands
      if (
        line.match(
          /^\\(vspace|hspace|newpage|clearpage|pagebreak|bigskip|medskip|smallskip)\b/
        )
      ) {
        continue;
      }
      const cleaned = cleanContent(line);
      if (cleaned) {
        // Merge with previous text block if possible
        const lastBlock =
          currentSection.blocks[currentSection.blocks.length - 1];
        if (lastBlock && lastBlock.type === "text") {
          lastBlock.content += "\n" + cleaned;
        } else {
          currentSection.blocks.push({ type: "text", content: cleaned });
        }
      }
    }
  }

  // Second pass: assign problemIds from idtable to worked problems that don't have one
  for (const section of sections) {
    for (const block of section.blocks) {
      if (block.type === "workedproblem" && !block.problemId) {
        const idx = problemIndex.find((p) => p.number === block.number);
        if (idx) {
          block.problemId = idx.problemId;
        }
      }
    }
  }

  return {
    weekNum,
    topicNum,
    topicName,
    subtopics,
    freeProblems,
    premiumProblems,
    timeEstimate,
    prerequisites,
    learningObjectives,
    sections,
    problemIndex,
  };
}

// ── Main ──────────────────────────────────────────────────────
const TEX_DIR = path.resolve(__dirname, "../../storage/4-week-course");
const OUT_DIR = path.resolve(__dirname, "../src/data/course");

// Ensure output directory exists
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const texFiles = fs
  .readdirSync(TEX_DIR)
  .filter((f) => f.endsWith(".tex"))
  .sort();

console.log(`Found ${texFiles.length} .tex files`);

for (const file of texFiles) {
  const filePath = path.join(TEX_DIR, file);
  const baseName = file.replace(".tex", "");
  const outPath = path.join(OUT_DIR, `${baseName}.json`);

  try {
    const result = parseTex(filePath);
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
    console.log(
      `✓ ${baseName}: W${result.weekNum}T${result.topicNum} — ${result.topicName} (${result.sections.length} sections, ${result.problemIndex.length} problems)`
    );
  } catch (err) {
    console.error(`✗ ${baseName}: ${err}`);
  }
}

console.log("\nDone! JSON files written to src/data/course/");
