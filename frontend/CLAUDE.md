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

**Components should use CSS variables** (`var(--background)`, `var(--foreground)`, etc.) — not hardcoded hex values.

### Color Palette (epigram theme reference)

| Token | CSS Variable | Hex Value | Usage |
|-------|-------------|-----------|-------|
| Background | `var(--background)` | `#faf9f5` | Main content areas |
| Border | `var(--border)` | `rgb(240,238,230)` | All standard borders |
| Text | `var(--foreground)` | `#141310` | Primary foreground |
| Sidebar BG | `var(--sidebar-background)` | `#f5f4ee` | Navigation areas |
| Sidebar Accent | `var(--sidebar-accent)` | `#e9e6dc` | Toggles, highlights |
| Hint/Accent | — | `#a16207` | Hints, warnings, subproblem markers |
| Hover | — | `#f5f4ee` | Button hover states |
| White | — | `#ffffff` | Input fields only |

### Font

Use **Geist** and **Geist Mono** via `next/font/google`. Applied as CSS variables `--font-geist-sans` and `--font-geist-mono` in root `layout.tsx`.

### UI Conventions

- **`cursor-pointer`** on ALL interactive elements (buttons, tabs, links)
- **`custom-scrollbar`** class on all scrollable areas (defined in `globals.css`)
- **Hover states**: consistent `backgroundColor` transitions via `onMouseEnter`/`onMouseLeave`
- **Active tab states**: `bg-[#141310]` with white text
- **White backgrounds**: reserved for input fields only

### Standard Patterns

**Button:**
```tsx
<Button
  className="h-8 px-3 rounded-xl cursor-pointer border"
  style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)', borderColor: 'var(--border)' }}
  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--sidebar-background)'}
  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--background)'}
>
  Button Text
</Button>
```

**Input:**
```tsx
<input
  className="h-[50px] py-2 px-3 rounded-xl bg-white border focus:outline-none"
  style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
/>
```

**Hint/Accent:**
```tsx
<button style={{ borderColor: '#a16207', color: '#a16207' }}>Hint Element</button>
```

### Design Rules for New Components

1. Use CSS variables from theme — don't hardcode colors
2. Use `var(--*)` CSS variables; reference hex values for the epigram theme only
3. Add `cursor-pointer` to all interactive elements
4. Implement hover states with consistent patterns
5. White backgrounds only for input fields
6. Use `var(--border)` for borders
7. Use `#a16207` for hints, warnings, accent markers

## AI Models

### Primary: Claude via AWS Bedrock (`@anthropic-ai/bedrock-sdk`)
- `claude-sonnet` → `us.anthropic.claude-sonnet-4-6` (chat, default in ChatSidebar)
- `claude-haiku` → `anthropic.claude-haiku-4-5-20251001-v1:0` (grading endpoint)

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
