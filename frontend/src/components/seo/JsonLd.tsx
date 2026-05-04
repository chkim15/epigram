/**
 * Renders a JSON-LD <script> tag for structured data.
 *
 * Usage:
 *   <JsonLd data={organizationSchema()} />
 *   <JsonLd data={faqPageSchema(items)} />
 *
 * Place inside <head> (via metadata.other) or at the top of a page body —
 * search engines and answer engines parse either location.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify is safe — no untrusted user input flows in via these helpers.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
