# Frontend — CLAUDE.md

## Commands

```bash
cd frontend
npm install        # Install dependencies
npm run dev        # Dev server on http://localhost:3000
npm run build      # Production build
npm run lint       # Type checking and linting
```

## Design System

### Theme System

Three themes defined in `globals.css`:
- **`epigram`** — warm palette, applied as `:root` default and `[data-theme="epigram"]`
- **`claude-light`** — light Claude theme
- **`claude-dark`** — dark Claude theme

User-selectable themes are `claude-light` and `claude-dark` (via `next-themes`). Use the `useAppTheme()` hook from `src/lib/utils/theme.ts`.

### Color Palette (epigram theme reference)

| Token | CSS Variable | Hex Value | Usage |
|-------|-------------|-----------|-------|
| Background | `var(--background)` | `#faf9f5` | Main content areas |
| Border | `var(--border)` | `rgb(240,238,230)` | All standard borders |
| Text | `var(--foreground)` | `#141310` | Primary foreground |
| Sidebar BG | `var(--sidebar-background)` | `#f5f4ee` | Navigation areas |
| Sidebar Accent | `var(--sidebar-accent)` | `#e9e6dc` | Toggles, highlights |
| Hint/Accent | — | `#a16207` | Hints, warnings, subproblem markers |
| White | — | `#ffffff` | Input fields only |

### Font

Use **Geist** and **Geist Mono** via `next/font/google`. Applied as CSS variables `--font-geist-sans` and `--font-geist-mono` in root `layout.tsx`.

### UI Conventions

- **Components must use CSS variables** (`var(--background)`, etc.) — not hardcoded hex values
- **`cursor-pointer`** on ALL interactive elements (buttons, tabs, links)
- **`custom-scrollbar`** class on all scrollable areas (defined in `globals.css`)
- **Hover states**: consistent `backgroundColor` transitions via `onMouseEnter`/`onMouseLeave`
- **Active tab states**: `bg-[#141310]` with white text
- **White backgrounds**: reserved for input fields only
- **Borders**: use `var(--border)`
- **Hints/warnings/accents**: use `#a16207`

## AI Models

### Primary: GPT-5 via Azure OpenAI (`openai` SDK)
- `gpt-5` → deployment `gpt-5-chat` (chat, default in ChatSidebar and AITutorPage)
- `gpt-5-mini` → deployment `gpt-5-mini` (chat alternative)
- `gpt-5-nano` → deployment `gpt-5-nano` (grading endpoint)
- Recommendations endpoint uses Azure OpenAI REST API directly (GPT-5-chat deployment)

### Secondary: Gemini (`@google/generative-ai`)
- `gemini-2.5-flash`, `gemini-2.5-pro` — supported in API route but not used by UI

Use `@google/generative-ai` (NOT `@google/genai`). Use the `GoogleGenerativeAI` class with `getGenerativeModel()`.

## Coding Conventions

### TypeScript — No `any`

Always import proper types. Common Supabase types: `User`, `Session`, `AuthError`, `AuthChangeEvent`.

```typescript
// BAD
signIn: (email: string, password: string) => Promise<{ error: any }>;

// GOOD
import { AuthError } from '@supabase/supabase-js';
signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
```

### ESLint Rules

- **Unescaped entities**: Use `&apos;` not `'` in JSX text
- **Unused vars/imports**: Remove them; include all `useEffect` dependencies

## Common Pitfalls

### Next.js cache errors ("Cannot find module './[hash].js'")
```bash
rm -rf .next && rm -rf node_modules/.cache
lsof -ti:3000 | xargs kill -9
npm run dev
```

### Vercel deployment
- Add env vars in Vercel dashboard: Supabase keys, AWS keys (Bedrock), Stripe keys, Resend key, `NEXT_PUBLIC_APP_URL`
- Check build logs for TypeScript errors — warnings won't block deployment

## Course Content Pipeline

### Source Files
- LaTeX sources live in `/storage/4-week-course/`
- Topic metadata mapping in `src/data/course/course-structure.ts` (29 topics across 4 weeks, maps slugs → filenames)

### Two Conversion Paths

1. **JSON path**: `scripts/parse-course-tex.ts` (unified-latex AST parser) → `src/data/course/*.json`
2. **MDX path**: `npm run build:mdx` runs Pandoc + `scripts/epigram.lua` filter + `--wrap=none` → `src/data/course-mdx/*.mdx`

MDX is primary (used if file exists); JSON is fallback.

### Custom LaTeX Environments → Components

| LaTeX Environment | Component | Attributes |
|---|---|---|
| `conceptbox` | `ConceptBox` | title |
| `techniquebox` | `TechniqueBox` | title |
| `keyresult` | `KeyResult` | title |
| `warningbox` | `WarningBox` | title |
| `workedbox` | `WorkedBox` | number, difficulty |
| `freeproblem` / `premiumproblem` | `FreeProblem` / `PremiumProblem` | number, problemId, difficulty |
| `solutionbox` | `SolutionBox` | — |
| `tcolorbox` "By the end..." | `LearningObjectives` | title (optional; coding topics have distinct titles) |
| `tcolorbox` "Technique Toolkit/Summary" | `TechniqueSummary` | title (pipe table inside) |

### MDX Rendering Pipeline

`preprocessMdx()` in `src/app/course/[weekId]/[topicId]/page.tsx` applies these transforms in order:

1. **`convertIndentedCodeBlocks()`** — converts 4-space indented code → fenced ` ```python ` blocks (MDX doesn't support indented code blocks)
2. **Pandoc cleanup** — removes `{=html}`, `{=latex}` raw attributes and HTML comments
3. **`joinMultiLineInlineMath()`** — joins inline `$...$` spanning multiple lines onto one line
4. **`escapeContentOutsideMath()`** — escapes `{`, `}`, `<`, `>` outside protected regions (math, inline code, fenced code blocks)
5. **Display math separation** — ensures `$$` delimiters are on their own lines
6. **Dash conversion** — ` --- ` → em-dash, `--` → en-dash
7. **Pipe table math fix** — replaces `|` with `\vert` inside `$...$` within table rows
8. **Fenced div → JSX** — converts Pandoc `::: {.class attrs}` to `<Component attrs>`

Rendering stack: `next-mdx-remote` + `remarkMath` + `remarkGfm` + `rehypeKatex` + `rehype-pretty-code` (theme: `github-light`)

`MdxTopicHeader` renders topic metadata from JSON. `convertDashes()` handles `---`→em-dash, `--`→en-dash, and `\&`→`&` in topicName, timeEstimate, prerequisites.

### Post-Processing After `build:mdx`

After regenerating MDX from LaTeX, these manual fixes are needed:

1. **ASCII-art tables → pipe tables**: Pandoc converts `tabular` to ASCII-art. Technique summary and coding pattern tables need pipe table format.
2. **Dropped `center`/`tabular` content**: The Lua filter drops `center` divs. Tables inside conceptboxes must be manually restored as pipe tables.
3. **`\bordermatrix`**: Not supported by KaTeX. Convert to `\begin{array}` with `\hline` (see T8).
4. **`tcolorbox` → proper directives**: Pandoc outputs `::: tcolorbox` which is not in the component map. Convert to `::: {.techniquesummary title="..."}`, `::: {.techniquebox title="..."}`, or `::: {.learningobjectives title="..."}` as appropriate. Remove the bold title line (move to `title=` attr).
5. **`| ::: |` in tables**: Pandoc sometimes places closing `:::` inside a table row. Remove the malformed row and add a proper `:::` on its own line.
6. **Double blank lines after `:::`**: Technique summary tables need exactly one blank line between `:::` opening and the pipe table (preprocessMdx adds another). Two blank lines breaks GFM table parsing.
7. **`\&` in JSON**: Clean `\&` → `&` in `src/data/course/*.json` (topicName, prerequisites fields).
8. **`multline*`**: Not supported by KaTeX. Convert to `aligned` environment.

### Directory Structure Reference

```
frontend/src/data/
  course/*.json              # Parsed topic data
  course/course-structure.ts # Topic metadata + slug mapping
  course/load-topic.ts       # JSON loader
  course-mdx/*.mdx           # Pandoc MDX output
frontend/src/components/course/
  mdx-components.tsx         # MDX custom components
  CourseContent.tsx           # JSON fallback renderer
  MdxTopicHeader.tsx         # Topic header
  blocks/                    # Individual block components
frontend/scripts/
  parse-course-tex.ts        # JSON parser (AST-based)
  epigram.lua                # Pandoc Lua filter
```
