/**
 * Parse .tex course files into structured JSON using unified-latex AST.
 * Run: npx tsx scripts/parse-course-tex-v2.ts
 *
 * Replaces the regex-based v1 parser with proper AST-based parsing via
 * unified-latex (PEG.js grammar). Same output schema, more robust handling
 * of nested braces, multi-line arguments, and edge cases.
 */

import * as fs from "fs";
import * as path from "path";
import { parse as parseLaTeX } from "@unified-latex/unified-latex-util-parse";
import { printRaw } from "@unified-latex/unified-latex-util-print-raw";
import type * as Ast from "@unified-latex/unified-latex-types";

// ── Types (same schema as v1) ────────────────────────────────

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

// ── Helpers ──────────────────────────────────────────────────

/** Get printRaw text from a group node, stripping outer braces */
function groupText(node: Ast.Node): string {
  if (node.type === "group") {
    return printRaw((node as Ast.Group).content);
  }
  return printRaw(node);
}

/** Collect consecutive group nodes starting at index `start` in `nodes` */
function collectGroups(
  nodes: Ast.Node[],
  start: number,
  count: number
): string[] {
  const result: string[] = [];
  for (let i = start; i < nodes.length && result.length < count; i++) {
    if (nodes[i].type === "group") {
      result.push(groupText(nodes[i]));
    } else if (nodes[i].type === "whitespace" || nodes[i].type === "parbreak") {
      continue; // skip whitespace between args
    } else {
      break;
    }
  }
  return result;
}

/** Get the mandatory arg from a known macro (like \section) */
function getMacroArg(node: Ast.Macro): string {
  if (node.args) {
    for (const arg of node.args) {
      if (
        arg.type === "argument" &&
        arg.openMark === "{" &&
        arg.content.length > 0
      ) {
        return printRaw(arg.content);
      }
    }
  }
  return "";
}

/** Check if an env node's content starts with groups (args) and separate them */
function separateEnvArgs(
  env: Ast.Environment,
  expectedArgs: number
): { args: string[]; body: Ast.Node[] } {
  const args: string[] = [];
  let bodyStart = 0;
  for (let i = 0; i < env.content.length && args.length < expectedArgs; i++) {
    const node = env.content[i];
    if (node.type === "group") {
      args.push(groupText(node));
      bodyStart = i + 1;
    } else if (node.type === "whitespace") {
      bodyStart = i + 1;
      continue;
    } else {
      break;
    }
  }
  return { args, body: env.content.slice(bodyStart) };
}

// ── Custom macro expansion ──────────────────────────────────

function expandMacros(text: string): string {
  let out = text;
  out = out.replace(/\\E(?![a-zA-Z])/g, "\\mathbb{E}");
  out = out.replace(/\\Prob(?![a-zA-Z])/g, "\\mathbb{P}");
  out = out.replace(/\\Var(?![a-zA-Z])/g, "\\text{Var}");
  out = out.replace(/\\Cov(?![a-zA-Z])/g, "\\text{Cov}");
  out = out.replace(/\\Corr(?![a-zA-Z])/g, "\\text{Corr}");
  out = out.replace(/\\indep(?![a-zA-Z])/g, "\\perp\\!\\!\\!\\perp");
  out = out.replace(/\\iid(?![a-zA-Z])/g, "\\text{i.i.d.}");
  out = out.replace(/\\MSE(?![a-zA-Z])/g, "\\text{MSE}");
  out = out.replace(/\\Bias(?![a-zA-Z])/g, "\\text{Bias}");
  out = out.replace(/\\se(?![a-zA-Z])/g, "\\text{SE}");
  out = out.replace(/\\RSS(?![a-zA-Z])/g, "\\text{RSS}");
  out = out.replace(/\\TSS(?![a-zA-Z])/g, "\\text{TSS}");
  out = out.replace(/\\_/g, "_");
  return out;
}

// ── Convert tabular → HTML ──────────────────────────────────

function convertTabular(text: string): string {
  const result: string[] = [];
  let pos = 0;
  while (pos < text.length) {
    const beginIdx = text.indexOf("\\begin{tabular}", pos);
    if (beginIdx === -1) {
      result.push(text.slice(pos));
      break;
    }
    result.push(text.slice(pos, beginIdx));
    let cur = beginIdx + "\\begin{tabular}".length;
    // Skip column spec (brace-aware)
    if (cur < text.length && text[cur] === "{") {
      let depth = 0;
      for (let i = cur; i < text.length; i++) {
        if (text[i] === "{") depth++;
        else if (text[i] === "}") {
          depth--;
          if (depth === 0) {
            cur = i + 1;
            break;
          }
        }
      }
    }
    const endIdx = text.indexOf("\\end{tabular}", cur);
    if (endIdx === -1) {
      result.push(text.slice(beginIdx));
      break;
    }
    result.push(convertTabularBody(text.slice(cur, endIdx)));
    pos = endIdx + "\\end{tabular}".length;
  }
  return result.join("");
}

function convertTabularBody(body: string): string {
  let cleaned = body
    .replace(/\\toprule/g, "")
    .replace(/\\midrule/g, "")
    .replace(/\\bottomrule/g, "")
    .replace(/\\hline/g, "");
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
        let cell = c.replace(/\\textbf\{([^}]*)\}/g, "$1");
        cell = cleanContent(cell);
        return `<${tag}>${cell}</${tag}>`;
      })
      .join("");
    return `<tr>${htmlCells}</tr>`;
  });
  return `<table class="course-table">${htmlRows.join("")}</table>`;
}

// ── Replace pattern only outside math environments ──────────

function replaceOutsideMath(
  text: string,
  pattern: RegExp,
  replacement: string
): string {
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
  mathRegions.sort((a, b) => a.start - b.start);
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

// ── Clean content: remove LaTeX cruft ────────────────────────

function cleanContent(text: string): string {
  let out = text.trim();
  out = convertTabular(out);
  out = out.replace(/\\vspace\{[^}]*\}/g, "");
  out = out.replace(/\\noindent\s*/g, "");
  out = out.replace(/\\hfill\b/g, "");
  out = out.replace(/\\freelabel/g, "");
  out = out.replace(/\\premiumlabel/g, "");
  out = out.replace(/\\difficultytitle\{(\w+)\}/g, "");
  out = out.replace(/^\\quad\s*/g, "");
  out = out.replace(/\\checkmark/g, "✓");
  out = out.replace(/\\&/g, "&");
  out = out.replace(/\\strut/g, "");
  out = out.replace(/\\color\{[^}]+\}/g, "");
  out = out.replace(/\\begin\{center\}/g, "");
  out = out.replace(/\\end\{center\}/g, "");
  out = out.replace(
    /\\(small|large|footnotesize|normalsize|Large|LARGE|huge|Huge)\b/g,
    ""
  );
  out = out.replace(/\\textbf\{([^}]*)\}/g, "**$1**");
  out = out.replace(/\\textit\{([^}]*)\}/g, "*$1*");
  out = out.replace(/\\emph\{([^}]*)\}/g, "*$1*");
  out = out.replace(/---/g, "\u2014");
  out = out.replace(/--/g, "\u2013");
  out = out.replace(/``/g, "\u201C");
  out = out.replace(/''/g, "\u201D");
  out = out.replace(/\\ldots/g, "\u2026");
  out = replaceOutsideMath(out, /\\\\\[\d+pt\]/g, "<br>");
  out = expandMacros(out);
  return out.trim();
}

// ── Serialize AST nodes to string ────────────────────────────

function serialize(nodes: Ast.Node[]): string {
  return cleanContent(printRaw(nodes));
}

// ── Extract difficulty from arg string ───────────────────────

function extractDifficulty(text: string): string {
  const m = text.match(/\\difficultytitle\{(\w+)\}/);
  return m ? m[1] : "medium";
}

function extractTier(text: string): "free" | "premium" {
  if (text.includes("\\premiumlabel")) return "premium";
  return "free";
}

// ── Check if a tcolorbox is a learning objectives box ────────

function isTcolorboxLearningObjectives(env: Ast.Environment): boolean {
  const raw = printRaw(env.content);
  return raw.includes("By the end");
}

/** Check if a tcolorbox is a technique summary box */
function isTcolorboxTechniqueSummary(env: Ast.Environment): boolean {
  const raw = printRaw(env.content);
  return (
    raw.includes("Technique Toolkit") ||
    raw.includes("Technique Summary") ||
    raw.includes("Summary of Key")
  );
}

// ── Extract learning objectives from tcolorbox ───────────────

function extractLearningObjectives(env: Ast.Environment): string[] {
  const objectives: string[] = [];
  // Find the enumerate environment inside
  for (const node of env.content) {
    if (node.type === "environment" && (node as Ast.Environment).env === "enumerate") {
      const enumEnv = node as Ast.Environment;
      // \item is a known macro in unified-latex, so its body is captured in args
      for (const child of enumEnv.content) {
        if (child.type === "macro" && (child as Ast.Macro).content === "item") {
          const macro = child as Ast.Macro;
          // The item body is in the last arg with content
          if (macro.args) {
            const bodyArg = macro.args.find(
              (a) => a.content.length > 0
            );
            if (bodyArg) {
              const text = serialize(bodyArg.content);
              if (text) objectives.push(text);
            }
          }
        }
      }
    }
  }
  return objectives;
}

// ── Extract technique summary content ────────────────────────

function extractTechniqueSummaryContent(env: Ast.Environment): string {
  // tcolorbox options appear as inline content: [breakable, colback=...]
  // Skip everything up to and including the closing ]
  let bodyStart = 0;
  let foundBracket = false;
  for (let i = 0; i < env.content.length; i++) {
    const node = env.content[i];
    if (node.type === "string" && (node as Ast.String).content === "[") {
      foundBracket = true;
    }
    if (foundBracket && node.type === "string" && (node as Ast.String).content === "]") {
      bodyStart = i + 1;
      break;
    }
  }
  const body = env.content.slice(bodyStart);
  return serialize(body);
}

// ── Extract problem index from idtable ───────────────────────

function extractProblemIndex(env: Ast.Environment): ProblemIndexEntry[] {
  const entries: ProblemIndexEntry[] = [];
  for (const node of env.content) {
    if (node.type === "macro" && (node as Ast.Macro).content === "idrow") {
      // \idrow{number}{name}{problemId} — args follow as groups in parent
      // Since idrow is not a known macro, we need to find the following groups
    }
  }

  // Alternative approach: use printRaw and regex on the raw content
  const raw = printRaw(env.content);
  const idrowRegex = /\\idrow\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}/g;
  let match;
  while ((match = idrowRegex.exec(raw)) !== null) {
    entries.push({
      number: match[1],
      name: match[2],
      problemId: expandMacros(match[3]),
    });
  }
  return entries;
}

// ── Main AST walker ──────────────────────────────────────────

function parseTex(filePath: string): CourseTopicJSON {
  const raw = fs.readFileSync(filePath, "utf-8");
  const ast = parseLaTeX(raw);

  // ── Extract metadata from preamble ─────────────────────
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
  let problemIndex: ProblemIndexEntry[] = [];

  // Find \epigramsetup and its 3 group args in the top-level content
  for (let i = 0; i < ast.content.length; i++) {
    const node = ast.content[i];
    if (
      node.type === "macro" &&
      (node as Ast.Macro).content === "epigramsetup"
    ) {
      const args = collectGroups(ast.content, i + 1, 3);
      if (args.length === 3) {
        weekNum = parseInt(args[0]);
        topicNum = parseInt(args[1]);
        topicName = args[2];
      }
      break;
    }
  }

  // Find the document environment
  const docEnv = ast.content.find(
    (n) => n.type === "environment" && (n as Ast.Environment).env === "document"
  ) as Ast.Environment | undefined;
  if (!docEnv) {
    throw new Error("No \\begin{document} found");
  }

  const docContent = docEnv.content;

  // Find \epigramtitle and its 5 group args
  for (let i = 0; i < docContent.length; i++) {
    const node = docContent[i];
    if (
      node.type === "macro" &&
      (node as Ast.Macro).content === "epigramtitle"
    ) {
      const args = collectGroups(docContent, i + 1, 5);
      if (args.length >= 5) {
        subtopics = cleanContent(args[0]);
        freeProblems = parseInt(args[1]);
        premiumProblems = parseInt(args[2]);
        timeEstimate = args[3].trim();
        prerequisites = args[4].trim();
      }
      break;
    }
  }

  // ── Walk document content sequentially ─────────────────
  let currentSection: CourseSection | null = null;
  let pendingProblem: ContentBlock | null = null;
  let skipProblemIndex = false;

  // Helper to flush pending problem
  const flushPending = () => {
    if (pendingProblem && currentSection) {
      if (
        pendingProblem.type === "workedproblem" &&
        !pendingProblem.problemId
      ) {
        const idx = problemIndex.find(
          (p) =>
            p.number ===
            (pendingProblem as { number: string }).number
        );
        if (idx)
          (pendingProblem as { problemId?: string }).problemId =
            idx.problemId;
      }
      currentSection.blocks.push(pendingProblem);
      pendingProblem = null;
    }
  };

  // Helper to add text to current section, merging with previous text block
  const addText = (text: string) => {
    if (!currentSection || !text) return;
    const lastBlock = currentSection.blocks[currentSection.blocks.length - 1];
    if (lastBlock && lastBlock.type === "text") {
      lastBlock.content += "\n" + text;
    } else {
      currentSection.blocks.push({ type: "text", content: text });
    }
  };

  // Collect text nodes between structural elements
  let textBuffer: Ast.Node[] = [];

  const flushText = () => {
    if (textBuffer.length > 0) {
      const text = serialize(textBuffer);
      if (text) addText(text);
      textBuffer = [];
    }
  };

  // Check if a node is a skippable command
  const isSkippable = (node: Ast.Node): boolean => {
    if (node.type === "macro") {
      const name = (node as Ast.Macro).content;
      return [
        "vspace",
        "hspace",
        "newpage",
        "clearpage",
        "pagebreak",
        "bigskip",
        "medskip",
        "smallskip",
        "epigramtitle",
        "epigramfooter",
        "showidsfalse",
        "showidstrue",
        "DeclareMathOperator",
        "newcommand",
      ].includes(name);
    }
    return false;
  };

  // Helper: is this node a group that follows a skippable macro (its arg)?
  // We track this during the walk.

  for (let i = 0; i < docContent.length; i++) {
    const node = docContent[i];

    // ── Skip nodes ───────────────────────────────────────
    if (node.type === "comment") continue;
    if (node.type === "parbreak") {
      flushText();
      continue;
    }
    if (node.type === "whitespace") continue;

    // ── Environments ─────────────────────────────────────
    if (node.type === "environment") {
      flushText();
      const env = node as Ast.Environment;
      const envName = env.env;

      // tcolorbox: learning objectives or technique summary
      if (envName === "tcolorbox") {
        if (isTcolorboxLearningObjectives(env)) {
          learningObjectives.push(...extractLearningObjectives(env));
        } else if (isTcolorboxTechniqueSummary(env)) {
          if (currentSection) {
            currentSection.blocks.push({
              type: "techniquesummary",
              content: extractTechniqueSummaryContent(env),
            });
          }
        }
        // Other tcolorboxes are ignored
        continue;
      }

      // idtable: problem index
      if (envName === "idtable") {
        problemIndex = extractProblemIndex(env);
        continue;
      }

      // Box environments: conceptbox, techniquebox, keyresult, warningbox
      if (
        ["conceptbox", "techniquebox", "keyresult", "warningbox"].includes(
          envName
        )
      ) {
        const { args, body } = separateEnvArgs(env, 1);
        if (currentSection) {
          currentSection.blocks.push({
            type: envName as
              | "conceptbox"
              | "techniquebox"
              | "keyresult"
              | "warningbox",
            title: args[0] || "",
            content: serialize(body),
          });
        }
        continue;
      }

      // Problem environments: workedbox
      if (envName === "workedbox") {
        flushPending();
        const { args, body } = separateEnvArgs(env, 2);
        const number = args[0] || "";
        const argStr = args[1] || "";
        const difficulty = extractDifficulty(argStr);
        const tier = extractTier(argStr);
        pendingProblem = {
          type: "workedproblem",
          number,
          difficulty,
          tier,
          content: serialize(body),
          solution: "",
        };
        continue;
      }

      // Problem environments: freeproblem
      if (envName === "freeproblem") {
        flushPending();
        const { args, body } = separateEnvArgs(env, 4);
        pendingProblem = {
          type: "freeproblem",
          number: args[0] || "",
          difficulty: extractDifficulty(args[2] || ""),
          problemId: expandMacros(args[3] || ""),
          content: serialize(body),
          solution: "",
        };
        continue;
      }

      // Problem environments: premiumproblem
      if (envName === "premiumproblem") {
        flushPending();
        const { args, body } = separateEnvArgs(env, 4);
        pendingProblem = {
          type: "premiumproblem",
          number: args[0] || "",
          difficulty: extractDifficulty(args[2] || ""),
          problemId: expandMacros(args[3] || ""),
          content: serialize(body),
          solution: "",
        };
        continue;
      }

      // Solution box
      if (envName === "solutionbox") {
        if (pendingProblem && currentSection) {
          const solution = serializeSolutionBody(env.content);
          if (
            pendingProblem.type === "workedproblem" ||
            pendingProblem.type === "freeproblem" ||
            pendingProblem.type === "premiumproblem"
          ) {
            (pendingProblem as { solution: string }).solution = solution;
          }
          // Assign problemId from idtable for worked problems
          if (
            pendingProblem.type === "workedproblem" &&
            !pendingProblem.problemId
          ) {
            const num = (pendingProblem as { number: string }).number;
            const idx = problemIndex.find((p) => p.number === num);
            if (idx)
              (pendingProblem as { problemId?: string }).problemId =
                idx.problemId;
          }
          currentSection.blocks.push(pendingProblem);
          pendingProblem = null;
        }
        continue;
      }

      // Skip center environment (used in Problem Index section)
      if (envName === "center") continue;

      // Skip tabular at top level (Problem Index table)
      if (envName === "tabular") continue;

      // Other environments: skip enumerate/itemize at top level (already handled inside boxes)
      continue;
    }

    // ── Macros ───────────────────────────────────────────
    if (node.type === "macro") {
      const macro = node as Ast.Macro;
      const name = macro.content;

      // \section{...}
      if (name === "section") {
        flushText();
        flushPending();
        const title = cleanContent(getMacroArg(macro));
        // Skip Problem Index and Technique Summary sections
        if (title === "Problem Index" || title === "Technique Summary") {
          skipProblemIndex = true;
          continue;
        }
        skipProblemIndex = false;
        currentSection = { title, blocks: [] };
        sections.push(currentSection);
        continue;
      }

      // \subsection{...}
      if (name === "subsection") {
        flushText();
        if (currentSection) {
          currentSection.blocks.push({
            type: "subsection",
            title: cleanContent(getMacroArg(macro)),
          });
        }
        continue;
      }

      // Skip known commands and their args
      if (isSkippable(node)) {
        // Skip following groups that are arguments to this macro
        continue;
      }

      if (skipProblemIndex) continue;

      // Regular text-level macro — accumulate
      if (currentSection) {
        textBuffer.push(node);
      }
      continue;
    }

    // ── Groups (often args to custom macros) ─────────────
    if (node.type === "group") {
      // Check if the previous non-whitespace node was a skippable macro
      // If so, skip this group (it's an argument)
      let prevIdx = i - 1;
      while (
        prevIdx >= 0 &&
        (docContent[prevIdx].type === "whitespace" ||
          docContent[prevIdx].type === "parbreak")
      ) {
        prevIdx--;
      }
      if (prevIdx >= 0 && isSkippable(docContent[prevIdx])) {
        continue;
      }

      // Check if prev was epigramtitle - skip its arg groups
      if (
        prevIdx >= 0 &&
        docContent[prevIdx].type === "macro" &&
        (docContent[prevIdx] as Ast.Macro).content === "epigramtitle"
      ) {
        continue;
      }
      // Check if prev was a group that was preceded by epigramtitle
      // (multi-arg chain) - look backwards past groups and whitespace
      let chainIdx = prevIdx;
      while (chainIdx >= 0) {
        const cn = docContent[chainIdx];
        if (cn.type === "group" || cn.type === "whitespace" || cn.type === "parbreak") {
          chainIdx--;
          continue;
        }
        if (
          cn.type === "macro" &&
          ["epigramtitle", "epigramsetup", "epigramfooter", "DeclareMathOperator", "newcommand"].includes(
            (cn as Ast.Macro).content
          )
        ) {
          // This group is an arg to a skippable macro chain
          break;
        }
        // Not part of a macro arg chain
        chainIdx = -1;
        break;
      }
      if (chainIdx >= 0) continue;

      if (skipProblemIndex) continue;

      // Otherwise accumulate as text
      if (currentSection) {
        textBuffer.push(node);
      }
      continue;
    }

    // ── String/other text nodes ──────────────────────────
    if (skipProblemIndex) continue;
    if (currentSection) {
      textBuffer.push(node);
    }
  }

  // Flush remaining
  flushText();
  flushPending();

  // Second pass: assign problemIds from idtable to worked problems
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

// ── Serialize solution body, handling warningbox inside ───────

function serializeSolutionBody(nodes: Ast.Node[]): string {
  const parts: string[] = [];
  const regularNodes: Ast.Node[] = [];

  for (const node of nodes) {
    if (
      node.type === "environment" &&
      (node as Ast.Environment).env === "warningbox"
    ) {
      // Flush regular nodes first
      if (regularNodes.length > 0) {
        parts.push(serialize([...regularNodes]));
        regularNodes.length = 0;
      }
      // Serialize warning
      const warnEnv = node as Ast.Environment;
      const { body } = separateEnvArgs(warnEnv, 0);
      parts.push("\n**Warning:** " + serialize(body));
    } else {
      regularNodes.push(node);
    }
  }

  if (regularNodes.length > 0) {
    parts.push(serialize(regularNodes));
  }

  return parts.join("\n").trim();
}

// ── Main ────────────────────────────────────────────────────

const TEX_DIR = path.resolve(__dirname, "../../storage/4-week-course");
const OUT_DIR = path.resolve(__dirname, "../src/data/course");

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
