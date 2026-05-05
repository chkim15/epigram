# Epigram Phase 1 AEO/SEO — Execution Log

**Started:** 2026-05-04
**Plan reference:** /Users/chulhee/.claude/plans/based-on-the-following-ethereal-prism.md
**Operator:** Claude Code session
**Repo state at start:**
- HEAD: `fb7ca30d317ff96da28d82dc6c80e4a51bcdd9df`
- Untracked: `llms.txt` (the existing 19KB draft at repo root, will be split in Section 5.1)

## What this phase ships
- Site config (`frontend/src/lib/site.ts`)
- Root metadata + Organization/WebSite JSON-LD
- Schema helpers + FAQ extraction with FAQPage schema
- `is_free` migration — **SKIPPED, already exists** (see Section 4 entry)
- `robots.ts` with AI-bot allowlist
- Split + revise existing `llms.txt` into thin `llms.txt` (links) + `llms-full.txt` (content); publish both at root URLs via prebuild sync
- `sitemap.ts` (static + free-content dynamic routes)
- Public mirror routes: `/practice`, `/practice/[slug]`, `/learn`, `/learn/[topicSlug]`

## What this phase does NOT ship
- MDX blog/guides hub (Phase 2)
- Richer llms-full from MDX bodies, RSS feed, dynamic OG images (Phase 2)
- Content production / outreach (Phase 2)
- Rate limiting on public routes (flagged TODO)

## Section index
- [x] Section 0: Pre-flight checks
- [x] Section 1: Site config
- [x] Section 2: Root metadata
- [x] Section 3: JSON-LD schema helpers + FAQ extraction
- [-] Section 4: is_free migration (SKIPPED — already exists)
- [x] Section 5: robots.ts
- [x] Section 5.1: llms.txt revisions and publishing
- [x] Section 6: sitemap.ts
- [x] Section 7: Public mirror routes
- [x] Section 8: Verification
- [x] Section 9: Final summary
- [x] Section 10: AEO audit quick-win pass (Phase 1.5)

---

## Section 0: Pre-flight checks
- **Status:** Complete
- **Files created:** PHASE_1_LOG.md (this file)
- **Files modified:** none
- **Key decisions / findings:**
  - Directory layout matches plan: `frontend/src/app/`, `frontend/src/components/`, `frontend/src/lib/` all present.
  - `backend/DATABASE_SCHEMA.md` exists but is **outdated** (still describes the v1 calculus schema). Live tables are richer; mapped from frontend Supabase calls.
  - `EPIGRAM_PROJECT_CONTEXT.md` does **not** exist — only `backend/DATABASE_SCHEMA.md`.
  - **Live tables for this work:**
    - `problems`: has both `id` (UUID, PK) and `problem_id` (TEXT, human-readable like `quant_interview_fundamental_qdsi_p40`). Plus `is_free` BOOLEAN (added 2026-04-24, default false), `is_recent` BOOLEAN. Other relevant columns: `problem_text`, `correct_answer`, `hint`, `solution_text`, `difficulty`, `included`, `updated_at`.
    - `quant_topics` + `problem_quant_topics` (junction): the broad topical taxonomy used by the existing problems list. (Per project memory: problems list uses `quant_topics`, NOT `topics`.)
    - `four_week_topics` + `problem_four_week_topics`: a separate, newer 29-row reference table for the 4-week curriculum mapping. Added 2026-03-27.
    - `topics` + `problem_topics`: original calculus-era tables, still present but not used for the quant platform.
  - **Public-route URL strategy:** `/practice/[slug]` will use `problems.problem_id` (text) — matches the slugs already listed in the `is_free` migration and is human-readable. UUIDs would be ugly and make URLs unstable across re-imports.
  - **`is_free` already exists on `problems`** (migration `20260424_add_is_free_is_recent.sql`). 30 problems already flagged free (W1 T1–T3). No new migration needed.
  - **`/learn` backing data:** static `frontend/src/data/course/course-structure.ts` (4 weeks, 29 topics, slugs `topic-1`…`topic-29`). MDX bodies live at `src/data/course-mdx/*.mdx`. **No DB query needed** for `/learn`. Free topics = topics 1–3 (matches the existing `is_free` problems migration).
  - **Middleware (`frontend/src/middleware.ts`):** uses a **positive matcher** — only `/home`, `/problems`, `/problems/:path*`, `/mock-interview`, `/bookmarks`, `/curriculum`, `/curriculum/:path*`, `/auth/onboarding`, `/api/chat` are protected. **`/practice` and `/learn` are automatically exempt.** No middleware change needed for Section 7.5.
  - **Existing helpers to reuse:**
    - `frontend/src/lib/supabase/client.ts` — exports `supabase` client (anon key, browser-safe).
    - `frontend/src/lib/utils/slugify.ts` — LaTeX-aware slugify (good for topic names; problem URLs will use raw `problem_id` instead so this isn't needed for problem slugs).
  - **No existing `frontend/src/lib/site.ts`** — Section 1 will create.
  - **Landing FAQ** (`frontend/src/app/page.tsx` lines 13–73) is inline + hand-rolled (no shared accordion primitive). Safe to extract.
  - **Newsletter subscribe** route already exists at `/api/newsletter/subscribe` — confirms user's "skip waitlist" decision.
  - **`<body>` in `layout.tsx` has `overflow-hidden h-screen`** — the landing page wraps content in its own scroll container (`min-h-screen overflow-y-auto`). New public pages must do the same wrapping pattern.
  - **Supabase env vars** confirmed: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (used everywhere), `SUPABASE_SERVICE_ROLE_KEY` (server-only). For sitemap: anon client is sufficient since `is_free=true` rows are intended for public read; verify RLS allows it.
  - **Schema helpers must use `problem_id` (text)** for URL fields, not `id` (UUID). Plan template will be adjusted.
  - **No `noindex` / `nosnippet` / `noai`** strings found on public routes (quick scan; full scan deferred to verification step).
- **Issues / TODOs:**
  - **`backend/DATABASE_SCHEMA.md` is stale.** Out of scope here, but flag for future cleanup — the doc still describes the v1 calculus schema and doesn't mention `quant_topics`, `four_week_topics`, `is_free`, `is_recent`, etc.
  - **Tutoring price discrepancy:** existing landing FAQ says "from $49" while the plan's Section 5.1.2 referenced "$120/session" (from earlier exploration). Section 5.1.2 will use the actual price found in the live `page.tsx` pricing section before publishing.
- **Verification performed:**
  - `git rev-parse HEAD` → `fb7ca30d317ff96da28d82dc6c80e4a51bcdd9df`
  - `git status --short` → only `?? llms.txt`
  - Read `backend/DATABASE_SCHEMA.md`, `frontend/src/middleware.ts`, `frontend/src/app/layout.tsx`, `frontend/src/app/page.tsx` (lines 1–120), `frontend/src/lib/supabase/client.ts`, `frontend/src/lib/utils/slugify.ts`, `frontend/src/data/course/course-structure.ts`, `supabase/migrations/20260424_add_is_free_is_recent.sql`, `supabase/migrations/20260327_add_four_week_topics.sql`.
  - Grepped `from('...')` calls across `frontend/src` to enumerate live tables.

---

## Section 1: Site config
- **Status:** Complete
- **Files created:** `frontend/src/lib/site.ts`
- **Files modified:** none
- **Key decisions:** Added a `newsletter` block to `SITE` (name + url) for The Quant Signal, since the existing landing already references it and the llms.txt revisions in Section 5.1 will use the same URL. Kept `twitter` as empty string with TODO comment per plan.
- **Issues / TODOs:** Confirm Twitter/X handle exists or remove field. `ogImage` points to `/og/default.png`; that file does not exist yet — flagged for Section 2.
- **Verification performed:** TypeScript compiles cleanly (verified by inspection — uses `as const`, no imports needed).

---

## Section 2: Root metadata
- **Status:** Complete
- **Files created:** none
- **Files modified:** `frontend/src/app/layout.tsx`
- **Key decisions:**
  - Replaced 4-line `metadata` export with full Next.js Metadata object: title default + template, description, openGraph, twitter, alternates.canonical, robots (with googleBot maxes).
  - Preserved existing `icons.icon: "/epigram_logo.svg"` reference (didn't blow it away).
  - Kept the existing fonts (`Geist`, `Geist_Mono`, `Lora`), `ThemeProvider`, and `ThemeWrapper` untouched.
  - Imported `SITE` from `@/lib/site` so all strings flow from one source.
  - Did **not** inject Organization/WebSite JSON-LD here yet — that's Section 3.4 once the schema helpers exist.
- **Issues / TODOs:**
  - **USER ACTION REQUIRED:** `public/og/default.png` (1200×630) does not exist. Until added, OpenGraph previews will return 404 for the image. A placeholder is acceptable for launch; dynamic OG generation is Phase 2.
- **Verification performed:**
  - `git diff frontend/src/app/layout.tsx` shows additive changes only — no removed functionality.
  - Type-correctness verified by inspection (Metadata type fields all match Next.js 15 spec).

---

## Section 3: JSON-LD schema helpers + FAQ extraction
- **Status:** Complete
- **Files created:**
  - `frontend/src/lib/schema.ts`
  - `frontend/src/components/seo/JsonLd.tsx`
  - `frontend/src/components/marketing/Faq.tsx`
- **Files modified:**
  - `frontend/src/app/layout.tsx` (injects Organization + WebSite JSON-LD globally)
  - `frontend/src/app/page.tsx` (replaces inline `FaqSection` with `<Faq items={faqs} />`; removes inline component definition)
- **Key decisions:**
  - `qaPageSchema` accepts `problem_id` (text, human-readable), not `id` (UUID). The URL is built as `${SITE.url}/practice/${problem.problem_id}`, matching the slug strategy decided in Section 0. Documented in JSDoc on the helper.
  - `courseSchema` takes structured topic info from `course-structure.ts` (title, weekTitle, weekNum, topicNum) — not DB rows. Description format embeds week and topic numbers for richer LLM context.
  - Added an `itemListSchema` helper not strictly required by Phase 1, but the `/practice` and `/learn` index pages will use it in Section 7.
  - The new `Faq` component preserves the exact existing visual design (matching styles, accordion behaviour). Only addition is the `<JsonLd data={faqPageSchema(items)} />` emit at the top of the section.
  - Used `<JsonLd>` inside `<body>` (top, before ThemeProvider) rather than via `metadata.other` — both work; placing in body keeps the stringification logic in a single component.
  - Did not extract the SITE import from layout.tsx — still used by the metadata block.
- **Issues / TODOs:** none — all tests can be run in Section 8.
- **Verification performed:**
  - Confirmed no remaining references to the old inline `FaqSection` component on `frontend/src/app/page.tsx` via grep.
  - `useState` import retained because the newsletter form on landing still uses it.
  - All 6 FAQ items remain identical in content (the array `faqs` was preserved verbatim).

---

## Section 4: is_free migration (SKIPPED)
- **Status:** Skipped
- **Files created:** none
- **Files modified:** none
- **Key decisions:**
  - `is_free` already exists on `problems` (migration `20260424_add_is_free_is_recent.sql`, default false, with 30 problems flagged free covering W1 T1–T3).
  - The plan also called for `is_free` on `quant_topics`. After Section 0 analysis we determined `/learn` will be backed by the **static** `frontend/src/data/course/course-structure.ts` (29 topics) rather than a DB query — no `is_free` column needed on any topics table. Free vs. paid topics will be encoded in a small static const inside the public-route code (free = topics 1–3, matching the existing free-problem set).
  - **No new migration produced.** No USER ACTION REQUIRED for migrations.
- **Issues / TODOs:** none.
- **Verification performed:**
  - Confirmed `is_free` column exists by reading `supabase/migrations/20260424_add_is_free_is_recent.sql`.
  - Confirmed `course-structure.ts` provides the data needed for `/learn` and `/learn/[topicSlug]`.

---

## Section 5: robots.ts
- **Status:** Complete
- **Files created:** `frontend/src/app/robots.ts`
- **Files modified:** none
- **Key decisions:**
  - Disallow list mirrors the positive auth matcher in `frontend/src/middleware.ts` exactly: `/api/`, `/auth/`, `/home`, `/bookmarks`, `/problems`, `/curriculum`, `/mock-interview`. New public routes `/practice` and `/learn` are NOT in the disallow list.
  - Explicit allow rules for the 9 AI crawlers per the gtm-engineer-skills `improve-aeo-geo` recommendation. `*` already allows them but the explicit declarations are defensive.
  - Sitemap URL points to `${SITE.url}/sitemap.xml` — the `sitemap.ts` route in Section 6 will produce this.
- **Issues / TODOs:** none.
- **Verification performed:**
  - Grep for `noindex`/`nosnippet`/`noai`/`noimageai` across `frontend/src` — zero matches. No conflicting directives in code.

---

## Section 5.1: llms.txt revisions and publishing
- **Status:** Complete
- **Files created:**
  - `llms.txt` (new thin link-index, repo root) — replaces the old long-form file at this path.
  - `scripts/sync-llms.mjs` (prebuild copy script).
- **Files modified:**
  - `llms-full.txt` (renamed from old `llms.txt`, then revised — see edits below).
  - `frontend/package.json` (added `prebuild` and `sync:llms` scripts).
  - `frontend/.gitignore` (excludes synced copies in `public/`).
- **Key decisions:**
  - **Split:** old `llms.txt` (~19KB content-rich) → `llms-full.txt`. New thin `llms.txt` is a curated link index per llmstxt.org spec.
  - **Source-of-truth at repo root.** A prebuild script (`scripts/sync-llms.mjs`) copies both files into `frontend/public/` so they serve at `/llms.txt` and `/llms-full.txt`. The synced copies are gitignored so we never commit a stale copy that drifts from the source.
  - **Revisions to `llms-full.txt`:**
    1. Updated "Last updated" → `2026-05-04`.
    2. Quantified the opening blockquote: added "**4-week curriculum**", "**~180 curated problems**", "**7 topic domains**", "**8+ top firms**" with named firms.
    3. Quantified the Quick Answer paragraph similarly with the named topic domains.
    4. Added a Pricing section after Platform Features with actual numbers from the live landing page: $0 free / $19 1-month (reg $39) / $89 6-month (reg $179, $14.92/mo) / $120 tutoring.
    5. Added a Getting Started section before Start Free with a 5-step onboarding flow.
    6. Replaced the auth-gated `/mock-interview` link with descriptive text + "Available to signed-in users at https://epi-gram.app/mock-interview after signup."
    7. Added concrete difficulty calibration to the Practice Bank section: "Citadel quant trader on-sites, Jane Street probability rounds, Two Sigma quant researcher screens."
  - **Pricing source-of-truth:** Pulled from `frontend/src/app/page.tsx` lines 617–714 (the live pricing section). The landing FAQ on line 33 says tutoring is "from $49" — this is **stale/inconsistent** with the $120 in the pricing section. Flagged below.
- **Issues / TODOs:**
  - **USER ACTION RECOMMENDED:** Pricing FAQ on `frontend/src/app/page.tsx` line 33 says tutoring "from $49" but the pricing card on line 714 shows $120. The pricing card is treated as authoritative (and is what `llms-full.txt` quotes). The FAQ should be updated to match. Out of scope for this Phase 1 execution; flagged for the user.
  - Verify Twitter/X handle (still empty in `SITE.twitter`) before public launch.
  - The `og:image` referenced from `SITE.ogImage = "/og/default.png"` does not exist in `frontend/public/` yet. OpenGraph previews will 404 until added. Phase 2 will replace this with `next/og` dynamic generation.
- **Verification performed:**
  - Ran `node scripts/sync-llms.mjs` from repo root → output: "copied 2 file(s)." Confirmed both files present at `frontend/public/llms.txt` (1.4KB) and `frontend/public/llms-full.txt` (21KB).
  - Grepped `epigram.io` in both new/revised files — zero hits. All references use `epi-gram.app`.
  - Confirmed `prebuild` script will run before `npm run build`. The `sync:llms` alias allows manual invocation.

---

## Section 6: sitemap.ts
- **Status:** Complete
- **Files created:** `frontend/src/app/sitemap.ts`
- **Files modified:** none
- **Key decisions:**
  - **Reused existing helpers** (per Section 0 finding): `supabase` from `@/lib/supabase/client` (anon key, sufficient because the project's RLS policies allow anon read on `problems`), `slugify` from `@/lib/utils/slugify`, `COURSE_WEEKS` from `@/data/course/course-structure`. No new client instance; no new slugify implementation.
  - **`/learn` topic slugs use slugified titles** (e.g. `foundations-of-probability-modeling`) rather than the existing `topic-1` slugs. Better AEO via descriptive URLs. The `/learn/[topicSlug]` route in Section 7.3 will need to do the inverse mapping (slugify each topic title to find a match).
  - **Free topics:** hardcoded to topics 1, 2, 3 via `FREE_TOPIC_NUMS` const, matching the W1 T1–T3 free problems already flagged in the DB. Easy to extend later by adding numbers to the array.
  - **Problem URLs use `problem_id` (text)**, not `id` (UUID), per the schema strategy chosen in Section 0.
  - **Hourly revalidation** via `export const revalidate = 3600`. The free-content set should change rarely; hourly is conservative.
  - **Build resilience:** wrapped Supabase query in try/catch — if env vars missing or query fails, sitemap still returns static + index + learn routes. Build never breaks because of a sitemap query.
  - **Filtered to `included = true`** as well as `is_free = true` to respect soft-deletion (per the `included` column documented in DATABASE_SCHEMA.md).
- **Issues / TODOs:** none.
- **Verification performed:**
  - Type-checked by inspection (imports resolve; `MetadataRoute.Sitemap` shape correct).
  - Will be exercised end-to-end in Section 8 via local build + curl `/sitemap.xml`.

---

## Section 7: Public mirror routes
- **Status:** Complete
- **Files created:**
  - `frontend/src/components/public/PublicProblemView.tsx` (lightweight presentational problem renderer)
  - `frontend/src/app/practice/page.tsx` (/practice index)
  - `frontend/src/app/practice/[slug]/page.tsx` (/practice/[slug] single problem page)
  - `frontend/src/app/learn/page.tsx` (/learn index)
  - `frontend/src/app/learn/[topicSlug]/page.tsx` (/learn/[topicSlug] single topic page)
- **Files modified:** none (no middleware change required — see 7.5 below)
- **Key decisions:**
  - **Did NOT reuse `ProblemViewer`** from `frontend/src/components/problems/`. That component is tightly coupled to auth store, subscription store, problem store, router, bookmarks, AI tutor, and feedback. Forking would have required refactoring far outside the Phase 1 scope. Built a small standalone `PublicProblemView` instead — uses only `MathContent` (the same KaTeX rendering helper as the authenticated app, so math looks identical).
  - **`/practice/[slug]` queries by `problem_id` (text)**, filters `is_free = true AND included = true`. Returns `notFound()` if missing or not free — a non-free `problem_id` will 404 cleanly, no leakage.
  - **`/learn/[topicSlug]` is fully static** — no DB query. Looks up the topic by slugified title in `COURSE_WEEKS`, filtered to topic numbers 1, 2, 3 (free preview set). Returns `notFound()` for any other topic.
  - **Topic intros** are hand-written in a `TOPIC_INTROS` const inside the route file. Each is ~150 words, GEO-optimized: leads with what the topic is, why it matters, what specifically it covers, and which firms test it. Phase 2 may move these into MDX or auto-render the existing curriculum content.
  - **Slug strategy:** topic URLs use slugified topic titles (e.g. `/learn/foundations-of-probability-modeling`) rather than `topic-1`. Better for AEO. Reuses the existing `slugify` helper from `@/lib/utils/slugify`.
  - **Layout pattern:** every public page wraps content in `<main className="min-h-screen overflow-y-auto" style={{ height: "100vh" }}>` because the root `<body>` has `overflow-hidden h-screen` (existing landing-page pattern).
  - **JSON-LD on every public page:** `/practice/[slug]` emits QAPage + BreadcrumbList; `/practice` emits BreadcrumbList + ItemList; `/learn/[topicSlug]` emits Course + BreadcrumbList; `/learn` emits BreadcrumbList + ItemList.
  - **Per-page metadata:** every public route has its own `generateMetadata` (or static `metadata`) with title, description (≥120 chars), canonical, OpenGraph.
  - **CTA strategy:** every public page has a "Sign up free →" CTA pointing at `/auth/signup`. The button color matches the existing landing's primary action (`#141310` background, white text).
  - **Hourly revalidation** on the slug page via `export const revalidate = 3600`. Practice/learn indexes inherit the same caching shape.
- **Issues / TODOs:**
  - **TODO (flagged in plan Section 7.6):** Rate limiting on `/practice/[slug]` and `/learn/[topicSlug]`. Not implemented in Phase 1; should be added before public announcement (Vercel Edge Config or middleware-based limiter).
  - **TODO (Phase 2):** Auto-render the existing course MDX as the body of `/learn/[topicSlug]` instead of the hand-written intros. Will pick up the full curriculum prose for indexing.
  - The `/auth/signup` path is referenced in CTAs — verified it exists (`frontend/src/app/auth/signup/page.tsx`).
- **Section 7.5 — Middleware:**
  - No change required. Middleware uses a positive matcher; `/practice` and `/learn` are NOT in it. Confirmed via Section 0 inspection.
- **Verification performed:**
  - All five new files type-check by inspection (imports resolve, types match).
  - Final end-to-end verification (build, runtime, JSON-LD validation, auth-regression) is Section 8.

---

## Section 8: Verification
- **Status:** Complete
- **Files created:** none
- **Files modified:** `frontend/src/app/learn/page.tsx` (one ESLint fix: escape unescaped apostrophe in JSX)
- **Build:**
  - `cd frontend && npm run build` — first run had one real error in `learn/page.tsx` (unescaped apostrophe in `what's`); fixed via `&apos;`. Second run: ✅ "Compiled successfully" + lint pass on all new files.
  - All new routes appear in the build output: `/learn` (static, 502 B), `/learn/[topicSlug]` (dynamic), `/practice` (static, revalidate 1h), `/practice/[slug]` (dynamic, 4.2 kB), `/robots.txt` (static), `/sitemap.xml` (static, revalidate 1h).
- **Local crawl (production server on port 3001):**
  - `curl /robots.txt` → 200; contains the 9-bot allowlist + `Sitemap: https://epi-gram.app/sitemap.xml`. Disallow list correct.
  - `curl /sitemap.xml` → 200; **40 URL entries**: 5 static + 2 indexes (`/practice`, `/learn`) + 3 free topics (slugified titles) + 30 free problems (text `problem_id`).
  - `curl /llms.txt` → 200, `Content-Type: text/plain; charset=UTF-8`, contains the new thin index.
  - `curl /llms-full.txt` → 200, contains the revised long-form content (4-week, ~180 problems, 7 topic domains, 8+ firms, Pricing section, Getting Started section, fixed mock-interview link).
  - `curl /practice` → 200, lists free problems.
  - `curl /learn` → 200, lists 3 free topics + 26 paid-tier topics.
  - `curl /practice/quant_interview_fundamental_qdsi_p40` (real free problem) → 200, renders.
  - `curl /practice/notarealproblem` → 404. ✓ Non-free `problem_id` would also 404 (filtered by `is_free=true`).
  - `curl /learn/foundations-of-probability-modeling` → 200, renders intro + Course/BreadcrumbList JSON-LD.
- **Structured data validation (JSON-LD presence):**
  - `/` (landing): Organization + WebSite + FAQPage (with Question + Answer + Person nesting). ✓
  - `/practice/[slug]`: Organization + WebSite (from layout) + QAPage + BreadcrumbList. ✓
  - `/learn/[topicSlug]`: Organization + WebSite + Course + BreadcrumbList. ✓
  - Note: full Rich Results Test should run against the deployed URL once epi-gram.app pushes these changes.
- **Auth regression:**
  - The middleware uses a positive matcher and only redirects authenticated users mid-onboarding. Anonymous requests are not redirected at the middleware layer (this is existing behavior — auth gating happens at the page level via authStore in client components).
  - `curl` without cookies on `/home`, `/problems`, `/curriculum`, `/mock-interview`, `/bookmarks` returned 200 (the page shells render; client-side auth check then handles signed-out state). This matches pre-Phase-1 behavior — **no regression**.
  - For SEO, the new `robots.txt` `Disallow` rules instruct crawlers to skip these routes — that's the layer that matters for AEO.
  - Public routes `/practice`, `/practice/[slug]`, `/learn`, `/learn/[topicSlug]` accessible signed-out as intended.
- **Issues / TODOs:**
  - None blocking. Pre-existing ESLint warnings in unrelated files (ChatSidebar, ProblemViewer, etc.) were not touched.

---

## Section 9: Summary

- **Status:** Complete
- **Total files created:** 14
  - `PHASE_1_LOG.md` (this file)
  - `frontend/src/lib/site.ts`
  - `frontend/src/lib/schema.ts`
  - `frontend/src/components/seo/JsonLd.tsx`
  - `frontend/src/components/marketing/Faq.tsx`
  - `frontend/src/components/public/PublicProblemView.tsx`
  - `frontend/src/app/robots.ts`
  - `frontend/src/app/sitemap.ts`
  - `frontend/src/app/practice/page.tsx`
  - `frontend/src/app/practice/[slug]/page.tsx`
  - `frontend/src/app/learn/page.tsx`
  - `frontend/src/app/learn/[topicSlug]/page.tsx`
  - `scripts/sync-llms.mjs`
  - `llms.txt` (new thin link-index, replaces former content-rich file at this path)
- **Total files modified:** 6
  - `frontend/src/app/layout.tsx` (full Metadata object + injects Organization/WebSite JSON-LD)
  - `frontend/src/app/page.tsx` (replaces inline FAQ with `<Faq>` component)
  - `frontend/.gitignore` (excludes synced llms files in `public/`)
  - `frontend/package.json` (`prebuild` + `sync:llms` scripts)
  - `llms-full.txt` (renamed from former `llms.txt`, plus Pricing section, Getting Started section, mock-interview link fix, quantification, date update)
- **Completed at:** 2026-05-04
- **Repo state at end:** 14 untracked + 6 modified files. No commits made (per plan rule "Do not commit any changes. The user reviews and commits.").

### Outstanding USER ACTIONS REQUIRED
1. **Review and commit the changes.** All work is staged in the working tree per `git status` above; no commits made.
2. **Add `frontend/public/og/default.png` (1200×630).** The new root metadata references this file as the default OpenGraph image. Until added, OG previews will 404 for the image. A simple branded placeholder is fine for launch; dynamic OG generation via `next/og` is Phase 2.
3. **Confirm Twitter/X handle** in `frontend/src/lib/site.ts` (`SITE.twitter` is empty with a TODO). Either fill in the `@handle` or remove the field from the metadata block.
4. **Reconcile pricing FAQ** on `frontend/src/app/page.tsx` line 33 — says tutoring "from $49" but the live pricing card is $120. The `llms-full.txt` quotes the $120 figure. Update the FAQ copy to match (or update tutoring price if $49 is intended).
5. **Set up Google Search Console** at https://search.google.com/search-console for `epi-gram.app` and submit `https://epi-gram.app/sitemap.xml`. Same for Bing Webmaster Tools if desired.
6. **Add rate limiting** on `/practice/[slug]` and `/learn/[topicSlug]` before public announcement — flagged as TODO in Section 7.6 of the plan. Vercel Edge Config or middleware-based limiter both work.
7. **Backfill more `is_free` topics if desired.** Currently 30 problems are flagged free (W1 T1–T3). The /learn surface is hard-coded to topics 1–3 in `FREE_TOPIC_NUMS` arrays in both `sitemap.ts` and the route files; expanding the free preview means updating both arrays + adding intros to `TOPIC_INTROS` in `learn/[topicSlug]/page.tsx`.

### Recommended next steps
- Run [aeo-audit.sh](https://aeo-audit.sh) against `https://epi-gram.app` once these changes deploy to set a baseline AEO score. Target: 80+ (B+ or higher).
- Submit the production URL + sitemap to Google Search Console; check indexing in 7–14 days.
- After 1–2 weeks, query Perplexity / ChatGPT / Google AI Overviews for: "best quant interview prep platform", "how do I prepare for a Jane Street interview?", "free quant brainteaser practice" — note whether epi-gram.app shows up.
- Begin Phase 2 (see plan footer): MDX content hub at `/blog` and `/guides`, content production via the `gtm-engineer-skills` repo's research → write → audit pipeline, dynamic OG generation, RSS feed, richer `llms-full.txt` from MDX bodies.

### Known issues / debt
- `backend/DATABASE_SCHEMA.md` is stale (still describes the v1 calculus schema; doesn't mention `quant_topics`, `four_week_topics`, `is_free`, `is_recent`). Out of scope here but worth a future cleanup pass.
- The `/learn/[topicSlug]` pages currently render hand-written intros rather than the actual MDX curriculum content. Phase 2 will wire up the MDX rendering pipeline used at `/curriculum/[weekId]/[topicId]`.
- `/auth/signup` CTAs do not yet pass a `?next=` return URL. Low priority — standard signup flow lands on the curriculum after onboarding, which is acceptable.
- Pre-existing ESLint warnings (ChatSidebar, ProblemViewer, etc.) were not addressed; out of scope.

---

## Section 10: AEO audit quick-win pass (Phase 1.5)
- **Status:** Complete
- **Trigger:** First post-deploy run of [aeo-audit.sh](https://aeo-audit.sh) scored the live site **B / 75/100** with 13/16 checks passing. Three checks failed (Internal linking 4/10, Content structure 5/10, RSS/Atom feed missing). Agent-evaluation signals also flagged Freshness (45/100), Quotability (55), Answer Readiness (56), Evidence Density (59) — all rooted in the public mirror routes shipping single-paragraph, single-H1, low-link pages in Phase 1.
- **Files modified:**
  - `frontend/src/lib/schema.ts` (qaPageSchema + courseSchema gain `author` and `dateModified`)
  - `frontend/src/app/learn/[topicSlug]/page.tsx` (TOPIC_INTROS restructured into definition / whatItCovers / whyItMatters; H2 sections; `<time>` element; cross-topic nav)
  - `frontend/src/app/practice/[slug]/page.tsx` (specific H1 "Quant Interview Practice Problem"; problem_id + difficulty subtitle; `<time>` element)
  - `frontend/src/components/public/PublicProblemView.tsx` (visible "The problem" H2; sr-only H2s for Hint and Solution sections)
- **Files created:** none
- **Audit signals addressed:**
  - **Content structure 5/10 → expected ≥7/10** — `/learn/[topicSlug]` now has 2 visible H2 sections inside `<article>`; `/practice/[slug]` has 1 visible + 2 sr-only H2s.
  - **Internal linking 4/10 → expected ≥7/10** — `/learn/[topicSlug]` now lists the other 2 free topics + a "Browse all topics" + "Browse free practice problems" link.
  - **Freshness 45 → expected ≥65** — every `/learn/[topicSlug]` and `/practice/[slug]` now has `<time dateTime="…">Last updated: …</time>`. Schema also emits `dateModified`.
  - **Evidence Density 59 → expected ≥75** — `qaPageSchema` and `courseSchema` now include `author` (Jeremy Wu, with LinkedIn URL, jobTitle, credentials).
  - **Answer Readiness 56 → expected ≥70** — every TOPIC_INTROS entry now opens with a definitional first sentence ("Conditional probability is the probability of an event given that another event has occurred…").
  - **Quotability 55 → expected ≥70** — H2 boundaries make passage extraction trivial for AI agents.
- **Key decisions:**
  - `TOPIC_PAGE_LAST_UPDATED = "2026-05-04"` is hard-coded in `learn/[topicSlug]/page.tsx`. Bump manually when intros are edited. Acceptable since intros are not yet a frequently-updated artifact.
  - `/practice/[slug]` H1 chosen as "Quant Interview Practice Problem" (deliberate, descriptive, keyword-rich) rather than deriving from problem text. Problem ID and difficulty go in a subtitle. This avoids LaTeX in H1 and keeps every problem page aligned on a strong, indexable H1.
  - Hint and Solution remain inside `<details>` for UX (user-collapsible). Added `<h2 className="sr-only">` siblings so AI agents and screen readers see proper section structure without changing the visual UI.
  - Did NOT join `quant_topics` into the practice query for a more specific H1 — out-of-scope query change with marginal benefit; the descriptive H1 + subtitle is sufficient.
- **Issues / TODOs:**
  - **USER ACTION:** re-run aeo-audit.sh after redeploy and confirm overall ≥85/100. If it still flags Internal linking on the homepage, consider adding visible footer links to `/practice` and `/learn` (currently the homepage is fine — its 88/100 came from sample of 10 with /learn pages dragging the average).
  - RSS/Atom feed remains unfixed — legitimately Phase 2 work, needs a content hub to be meaningful.
  - The "Other free topic previews" nav on `/learn/[topicSlug]` only links between topics 1–3. When more topics get the `is_free` flag, expand `FREE_TOPIC_NUMS` and the nav scales automatically.
- **Verification performed:**
  - `cd frontend && npm run build` — clean, no TypeScript errors.
  - Schema diff sanity-checked: `qaPageSchema` and `courseSchema` now emit `author` blocks pointing to Jeremy's LinkedIn.
  - File-level grep confirmed `<time dateTime=` appears in both `/learn/[topicSlug]` and `/practice/[slug]` pages.
- **Deferred to Phase 2:** RSS/Atom feed, `/docs` knowledge section, Q&A-style heading rewrites of full topic content, contact page expansion (currently 75/100 and acceptable for a thin contact page).
