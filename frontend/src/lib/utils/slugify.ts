/**
 * Convert a problem name (possibly containing LaTeX) into a URL-safe slug.
 * Strips LaTeX commands/delimiters, lowercases, replaces non-alphanumeric with hyphens.
 */
export function slugify(name: string): string {
  return name
    // Remove LaTeX delimiters: $...$, \(...\), \[...\]
    .replace(/\$([^$]*)\$/g, '$1')
    .replace(/\\\(([^)]*)\\\)/g, '$1')
    .replace(/\\\[([^\]]*)\\\]/g, '$1')
    // Remove LaTeX commands like \frac{}{}, \text{}, etc. — keep content inside braces
    .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, '$1')
    // Remove remaining backslashes
    .replace(/\\/g, '')
    // Remove braces, carets, underscores, and other LaTeX artifacts
    .replace(/[{}^_~]/g, '')
    // Lowercase
    .toLowerCase()
    // Replace non-alphanumeric characters with hyphens
    .replace(/[^a-z0-9]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Collapse multiple hyphens
    .replace(/-{2,}/g, '-');
}
