/**
 * Strip LaTeX delimiters and commands from a string, leaving a human-readable
 * plain-text version. Useful for page titles, OpenGraph titles, and JSON-LD
 * `name` fields where LaTeX source like `$HH$` would render literally.
 *
 * Mirrors the LaTeX-stripping rules in slugify(), but preserves case and
 * spacing — i.e. produces a title-cased phrase rather than a URL slug.
 *
 * Example:
 *   stripLatexForPlainText("First Occurrence of $HH$ vs. $TH$ in Coin Tossing")
 *   → "First Occurrence of HH vs. TH in Coin Tossing"
 */
export function stripLatexForPlainText(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/\$([^$]*)\$/g, "$1")
    .replace(/\\\(([^)]*)\\\)/g, "$1")
    .replace(/\\\[([^\]]*)\\\]/g, "$1")
    .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, "$1")
    .replace(/\\[a-zA-Z]+/g, "")
    .replace(/[{}^_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
