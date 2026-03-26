import fs from "fs";
import path from "path";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode from "rehype-pretty-code";
import "katex/dist/katex.min.css";
import UnifiedHeader from "@/components/layout/UnifiedHeader";
import CourseSidebar from "@/components/course/CourseSidebar";
import CourseContent from "@/components/course/CourseContent";
import { getTopicBySlug } from "@/data/course/course-structure";
import { loadTopicData } from "@/data/course/load-topic";
import { LC_SLUGS } from "@/data/course/lc-slugs";
import {
  ConceptBox,
  TechniqueBox,
  KeyResult,
  WarningBox,
  WorkedBox,
  SolutionBox,
  FreeProblem,
  PremiumProblem,
  TechniqueSummary,
  LearningObjectives,
} from "@/components/course/mdx-components";
import MdxTopicHeader from "@/components/course/MdxTopicHeader";

const mdxComponents = {
  ConceptBox,
  TechniqueBox,
  KeyResult,
  WarningBox,
  WorkedBox,
  SolutionBox,
  FreeProblem,
  PremiumProblem,
  TechniqueSummary,
  LearningObjectives,
};

const DIRECTIVE_TO_COMPONENT: Record<string, string> = {
  conceptbox: "ConceptBox",
  techniquebox: "TechniqueBox",
  keyresult: "KeyResult",
  warningbox: "WarningBox",
  workedbox: "WorkedBox",
  solutionbox: "SolutionBox",
  freeproblem: "FreeProblem",
  premiumproblem: "PremiumProblem",
  techniquesummary: "TechniqueSummary",
  learningobjectives: "LearningObjectives",
};

/**
 * Join inline math ($...$) that spans multiple lines onto a single line.
 * remarkMath only supports single-line inline math; multi-line causes
 * unescaped braces to be interpreted as JSX expressions.
 * Display math ($$...$$) is left unchanged.
 */
function joinMultiLineInlineMath(content: string): string {
  const result: string[] = [];
  const lines = content.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Count single $ signs (exclude \$ escaped dollars and $$ display math)
    const stripped = line.replace(/\\\$/g, "").replace(/\$\$/g, "");
    const dollarCount = (stripped.match(/\$/g) || []).length;

    if (dollarCount % 2 === 1) {
      // Unclosed inline math — join subsequent lines until closed
      let joined = line;
      let j = i + 1;
      while (j < lines.length) {
        joined += " " + lines[j].trimStart();
        const jStripped = joined.replace(/\\\$/g, "").replace(/\$\$/g, "");
        const jCount = (jStripped.match(/\$/g) || []).length;
        if (jCount % 2 === 0) {
          break;
        }
        j++;
      }
      result.push(joined);
      i = j + 1;
    } else {
      result.push(line);
      i++;
    }
  }

  return result.join("\n");
}

/**
 * Escape a non-math text segment: replace stray <, >, {, } with HTML entities.
 * Preserves valid HTML/JSX tags (e.g. <br />, <Component>).
 * Skips fenced-div marker lines (^:{3,}) which contain syntactic {}.
 */
function escapeNonMathSegment(text: string): string {
  // Process line by line so we can skip fenced-div markers
  return text
    .split("\n")
    .map((line) => {
      if (/^:{3,}/.test(line)) return line;
      // Escape < not followed by a letter, /, or ! (not a valid tag start)
      let out = line.replace(/<(?![A-Za-z\/!])/g, "&lt;");
      // Escape > that isn't closing an HTML tag
      out = out.replace(/>/g, (_match, offset, str) => {
        const before = str.slice(0, offset);
        if (/<[A-Za-z\/!][^>]*$/.test(before)) return ">";
        return "&gt;";
      });
      // Escape { and }
      out = out.replace(/\{/g, "&#123;");
      out = out.replace(/\}/g, "&#125;");
      return out;
    })
    .join("\n");
}

/**
 * Escape stray <, >, {, } in the full content string, protecting math regions.
 * Uses a multi-line-aware regex so $$...$$ blocks spanning multiple lines are preserved.
 */
function escapeContentOutsideMath(content: string): string {
  const segments: string[] = [];
  let lastIdx = 0;
  // Protected regions: fenced code blocks, inline code, display math, inline math
  const protectedRe = /`{3,}[^\n]*\n[\s\S]*?\n`{3,}|`[^`\n]+`|\$\$[\s\S]*?\$\$|\$(?!\s)(?:[^$\\]|\\.)+?(?<!\s)\$/g;
  let m;
  while ((m = protectedRe.exec(content)) !== null) {
    if (m.index > lastIdx) {
      segments.push(escapeNonMathSegment(content.slice(lastIdx, m.index)));
    }
    segments.push(m[0]); // math — keep unchanged
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < content.length) {
    segments.push(escapeNonMathSegment(content.slice(lastIdx)));
  }
  return segments.join("");
}

/**
 * Convert Pandoc fenced divs (:::) to JSX component tags for MDX.
 * Handles nesting and preserves markdown content with blank line separators.
 */
/**
 * Convert indented code blocks (4-space) to fenced code blocks.
 * MDX does not support indented code blocks; only fenced (```) works.
 * Requires at least 2 consecutive indented lines to avoid false positives.
 */
function convertIndentedCodeBlocks(content: string): string {
  const lines = content.split("\n");
  const result: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const prevBlank =
      result.length === 0 || result[result.length - 1].trim() === "";
    if (prevBlank && /^    \S/.test(lines[i])) {
      // Collect all consecutive indented (or blank-between-indented) lines
      const block: string[] = [];
      const start = i;
      while (
        i < lines.length &&
        (/^    /.test(lines[i]) || lines[i].trim() === "")
      ) {
        if (
          lines[i].trim() === "" &&
          (i + 1 >= lines.length || !/^    /.test(lines[i + 1]))
        ) {
          break;
        }
        block.push(lines[i].slice(4));
        i++;
      }
      // Trim trailing blank lines
      while (block.length > 0 && block[block.length - 1].trim() === "") {
        block.pop();
      }
      // Only convert if 2+ indented lines (avoids false positives)
      if (block.filter((l) => l.trim() !== "").length >= 2) {
        result.push("```python");
        result.push(...block);
        result.push("```");
      } else {
        // Not enough lines — put them back as-is
        for (let j = start; j < i; j++) {
          result.push(lines[j]);
        }
      }
    } else {
      result.push(lines[i]);
      i++;
    }
  }
  return result.join("\n");
}

function preprocessMdx(content: string): string {
  let processed = content;

  // Normalize non-breaking spaces from Pandoc output
  processed = processed.replace(/\u00a0/g, " ");

  // Convert indented code blocks to fenced (must run before other processing)
  processed = convertIndentedCodeBlocks(processed);

  // Add python language to bare fenced code blocks from Pandoc (e.g. ``` {numbers="none"})
  processed = processed.replace(/^```\s*\{[^}]*\}\s*$/gm, "```python");

  // Remove Pandoc raw inline attributes: `<!-- -->`{=html} → empty
  processed = processed.replace(/`<!--\s*-->`\{=html\}/g, "");
  // Remove any remaining {=html} or {=latex} raw attributes
  processed = processed.replace(/\{=\w+\}/g, "");
  // Remove HTML comments
  processed = processed.replace(/<!--[\s\S]*?-->/g, "");

  // Join multi-line inline math onto single lines (remarkMath requires this)
  processed = joinMultiLineInlineMath(processed);

  // Escape stray Pandoc artifacts (<, >, {, }) outside math regions
  processed = escapeContentOutsideMath(processed);

  // Replace \$ inside math with \DOLLAR macro (remarkMath treats $ in \$ as a delimiter)
  const mathRe =
    /\$\$[\s\S]*?\$\$|\$(?!\s)(?:[^$\\]|\\.)+?(?<!\s)\$/g;
  processed = processed.replace(mathRe, (match) =>
    match.replace(/\\\$/g, "\\DOLLAR ")
  );

  // Ensure display math $$ is on its own line (remark-math requires this).
  // Note: In JS replacement strings, $$ is an escaped literal $, so use $$$$ for $$
  // Split adjacent display math blocks: "$$ $$" → "$$\n\n$$"
  processed = processed.replace(/\$\$[ \t]+\$\$/g, "$$$$\n\n$$$$");
  // If $$ has non-$ non-whitespace before it, add line break before.
  processed = processed.replace(/([^\s$])[ \t]*\$\$/g, "$1\n\n$$$$");
  // If $$ has non-$ non-whitespace after it, add line break after.
  processed = processed.replace(/\$\$[ \t]*([^\s$])/g, "$$$$\n\n$1");
  // If $$ has spaces then inline math $ (not $$), add line break after.
  processed = processed.replace(/\$\$[ \t]+(\$(?!\$))/g, "$$$$\n\n$1");

  // Convert spaced triple-dashes to em-dash ( --- → —)
  processed = processed.replace(/ --- /g, " \u2014 ");
  // Convert word-bounded double-dashes to en-dash (5--10 → 5–10)
  processed = processed.replace(/(\w)--(\w)/g, "$1\u2013$2");

  // Remove empty parentheses placeholders from learning objectives
  processed = processed.replace(/ \(\)/g, "");

  // Auto-link inline LC references to LeetCode (e.g., "LC 75" → markdown link)
  // Skip JSX tag lines and fenced code blocks
  {
    const outLines = processed.split("\n");
    let inCodeBlock = false;
    for (let i = 0; i < outLines.length; i++) {
      if (outLines[i].startsWith("```")) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      if (inCodeBlock) continue;
      if (outLines[i].trimStart().startsWith("<")) continue;
      // Skip lines that are pipe table separator rows (|---|---|)
      if (/^\|[\s-:|]+\|$/.test(outLines[i].trim())) continue;
      outLines[i] = outLines[i].replace(
        /\bLC\s+(\d+)\b/g,
        (_match, num) => {
          const slug = LC_SLUGS[parseInt(num, 10)];
          if (!slug) return _match;
          return `[LC ${num}](https://leetcode.com/problems/${slug}/)`;
        }
      );
    }
    processed = outLines.join("\n");
  }

  // In pipe-table rows, replace | inside inline math with \vert
  // (GFM parser treats | as cell delimiter even inside $...$)
  processed = processed
    .split("\n")
    .map((ln) => {
      if (!ln.trimStart().startsWith("|")) return ln;
      return ln.replace(/\$(?!\$)([^$]+?)\$/g, (match, inner) => {
        if (!inner.includes("|")) return match;
        const fixed = inner.replace(/\|/g, "\\vert ");
        return "$" + fixed.trimEnd() + "$";
      });
    })
    .join("\n");

  const lines = processed.split("\n");
  const result: string[] = [];
  const stack: string[] = []; // stack of directive names

  for (const line of lines) {
    // Match opening directive: `::: {.name attrs}` or `:::: {.name attrs}` or `::: name` or `:::name{attrs}`
    const openMatch =
      line.match(/^:{3,}\s*\{\s*\.(\w+)\s*(.*?)\}\s*$/) ||
      line.match(/^:{3,}\s+(\w+)\s*$/) ||
      line.match(/^:{3,}(\w+)(?:\{(.*?)\})?\s*$/);

    if (openMatch) {
      const directiveName = openMatch[1];
      const attrs = (openMatch[2] || "").trim();
      const component = DIRECTIVE_TO_COMPONENT[directiveName];

      if (component) {
        stack.push(directiveName);
        const attrStr = attrs ? ` ${attrs}` : "";
        result.push(`<${component}${attrStr}>`);
        result.push(""); // blank line so MDX parses children as markdown
        continue;
      }
    }

    // Match closing directive: `:::` or `::::` (bare colons, no name)
    const closeMatch = line.match(/^:{3,}\s*$/);
    if (closeMatch && stack.length > 0) {
      const directiveName = stack.pop()!;
      const component = DIRECTIVE_TO_COMPONENT[directiveName];
      result.push(""); // blank line before closing tag
      result.push(`</${component}>`);
      continue;
    }

    result.push(line);
  }

  return result.join("\n");
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ weekId: string; topicId: string }>;
}) {
  const { weekId, topicId } = await params;
  const result = getTopicBySlug(weekId, topicId);

  if (!result) {
    return (
      <div
        className="h-screen flex flex-col"
        style={{ backgroundColor: "var(--background)" }}
      >
        <UnifiedHeader />
        <div className="flex-1 flex items-center justify-center">
          <p style={{ color: "var(--muted-foreground)" }}>Topic not found</p>
        </div>
      </div>
    );
  }

  const { topic } = result;
  const topicData = loadTopicData(topic.fileName);

  // Try to load MDX file
  let mdxContent: string | null = null;
  try {
    const mdxPath = path.join(
      process.cwd(),
      "src/data/course-mdx",
      `${topic.fileName}.mdx`
    );
    mdxContent = fs.readFileSync(mdxPath, "utf-8");
  } catch {
    // No MDX file available, fall back to JSON
  }

  if (!topicData && !mdxContent) {
    return (
      <div
        className="h-screen flex flex-col"
        style={{ backgroundColor: "var(--background)" }}
      >
        <UnifiedHeader />
        <div className="flex-1 flex items-center justify-center">
          <p style={{ color: "var(--muted-foreground)" }}>
            Could not load topic data
          </p>
        </div>
      </div>
    );
  }

  // MDX rendering path
  if (mdxContent) {
    const processedMdx = preprocessMdx(mdxContent);


    return (
      <div
        className="h-screen flex flex-col"
        style={{ backgroundColor: "var(--background)" }}
      >
        <UnifiedHeader />
        <div className="flex-1 flex overflow-hidden">
          <CourseSidebar currentWeekSlug={weekId} currentTopicSlug={topicId} />
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* TopicNavBar hidden for now */}
            <div
              className="flex-1 overflow-y-auto custom-scrollbar"
              style={{ backgroundColor: "#ffffff" }}
            >
              <div className="max-w-4xl mx-auto px-8 py-8 text-base leading-relaxed course-mdx-content">
                {topicData && <MdxTopicHeader topicData={topicData} hideLearningObjectives />}

                <div className="mdx-content-body">
                  <MDXRemote
                    source={processedMdx}
                    components={mdxComponents}
                    options={{
                      mdxOptions: {
                        remarkPlugins: [remarkMath, remarkGfm],
                        rehypePlugins: [
                          [
                            rehypeKatex,
                            {
                              macros: { "\\DOLLAR": "\\$" },
                            },
                          ],
                          [
                            rehypePrettyCode,
                            {
                              theme: "github-light",
                              keepBackground: false,
                            },
                          ],
                        ],
                      },
                    }}
                  />
                </div>


              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // JSON rendering path (fallback)
  return (
    <div
      className="h-screen flex flex-col"
      style={{ backgroundColor: "var(--background)" }}
    >
      <UnifiedHeader />
      <div className="flex-1 flex overflow-hidden">
        <CourseSidebar currentWeekSlug={weekId} currentTopicSlug={topicId} />
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* TopicNavBar hidden for now */}
          <CourseContent topicData={topicData!} />
        </div>
      </div>
    </div>
  );
}
