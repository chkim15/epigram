# Implementation Guide - Math Learning Platform

## Tech Stack Decision

### Recommended Stack ✅
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Database:** Supabase (existing)
- **Math Rendering:** KaTeX (faster than MathJax)
- **State Management:** Zustand
- **AI Integration:** OpenAI API / Anthropic Claude API
- **Deployment:** Vercel

### Stack Rationale
- **Next.js App Router:** Server components for better performance, built-in routing, API routes
- **TypeScript:** Type safety crucial for complex educational app
- **Tailwind + shadcn:** Rapid UI development with consistent design system
- **KaTeX:** 100x faster than MathJax for LaTeX rendering
- **Zustand:** Simpler than Redux for our state management needs

---

## Project Structure

```
frontend/
├── app/
│   ├── (marketing)/
│   │   ├── page.tsx                 # Landing page
│   │   └── layout.tsx
│   ├── (app)/
│   │   ├── layout.tsx               # App layout with sidebar
│   │   ├── courses/
│   │   │   ├── page.tsx            # Course selection
│   │   │   └── [courseId]/
│   │   │       ├── page.tsx        # Topics view
│   │   │       └── [topicId]/
│   │   │           ├── page.tsx    # Subtopics view
│   │   │           └── [subtopicId]/
│   │   │               └── page.tsx # Problem viewer
│   │   └── api/
│   │       ├── problems/
│   │       ├── topics/
│   │       └── ai/
│   ├── layout.tsx                   # Root layout
│   └── globals.css
├── components/
│   ├── ui/                          # shadcn components
│   ├── landing/
│   │   ├── Hero.tsx
│   │   └── Features.tsx
│   ├── problems/
│   │   ├── ProblemViewer.tsx
│   │   ├── ProblemNavigation.tsx
│   │   ├── HintSolution.tsx
│   │   └── MathRenderer.tsx
│   ├── ai/
│   │   ├── AISidebar.tsx
│   │   ├── ChatInterface.tsx
│   │   └── DragDropHandler.tsx
│   └── navigation/
│       ├── CourseSelector.tsx
│       ├── TopicGrid.tsx
│       └── Breadcrumbs.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── queries.ts
│   ├── ai/
│   │   └── assistant.ts
│   └── utils/
│       ├── katex.ts
│       └── problem-parser.ts
├── hooks/
│   ├── useProblems.ts
│   ├── useAIChat.ts
│   └── useProgress.ts
├── stores/
│   ├── problemStore.ts
│   └── userStore.ts
└── types/
    ├── database.ts
    └── problem.ts
```

---

## Core Components Implementation

### 1. Landing Page (`app/(marketing)/page.tsx`)

```typescript
// Key features to implement:
- Hero with value proposition
- Interactive problem demo
- Benefits grid
- CTA to open app
- Smooth scroll animations with Framer Motion
```

### 2. Course Selector (`components/navigation/CourseSelector.tsx`)

```typescript
interface Course {
  id: string;
  name: 'Calculus I' | 'Calculus II';
  description: string;
  topicCount: number;
  icon: string;
}

// Features:
- Card-based selection
- Progress indicators (future)
- Hover animations
- Mobile responsive grid
```

### 3. Problem Viewer (`components/problems/ProblemViewer.tsx`)

```typescript
interface Problem {
  id: string;
  problem_id: string;
  problem_text: string;
  correct_answer: string;
  hint: string | null;
  solution_text: string | null;
  difficulty: 'easy' | 'medium' | 'hard' | 'very_hard';
  topic_id: number;
  subproblems?: Subproblem[];
}

// Core functionality:
- LaTeX rendering with KaTeX
- Problem navigation (prev/next)
- Expandable hints/solutions
- Progress tracking
- Keyboard shortcuts (arrow keys)
```

### 4. AI Sidebar (`components/ai/AISidebar.tsx`)

```typescript
interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  context?: {
    problemId: string;
    selectedText?: string;
  };
}

// Features:
- Collapsible sidebar (desktop)
- Bottom sheet (mobile)
- Drag-and-drop text selection
- Context-aware responses
- Message history
- Quick action buttons
```

---

## Database Integration

### Supabase Client Setup (`lib/supabase/client.ts`)

```typescript
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### Key Queries (`lib/supabase/queries.ts`)

```typescript
// Get problems by subtopic
export async function getProblemsBySubtopic(subtopicId: number) {
  const { data, error } = await supabase
    .from('problems')
    .select(`
      *,
      subproblems (*),
      topics (*)
    `)
    .eq('topic_id', subtopicId)
    .order('problem_id')
  
  return { data, error }
}

// Get topics by course
export async function getTopicsByCourse(course: 'Calculus I' | 'Calculus II') {
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('course', course)
    .order('id')
  
  return { data, error }
}
```

---

## LaTeX Rendering Setup

### KaTeX Configuration (`lib/utils/katex.ts`)

```typescript
import katex from 'katex'
import 'katex/dist/katex.min.css'

export function renderMath(text: string): string {
  // Replace $...$ with rendered math
  return text.replace(/\$([^$]+)\$/g, (match, math) => {
    try {
      return katex.renderToString(math, {
        throwOnError: false,
        displayMode: false
      })
    } catch {
      return match
    }
  })
  
  // Replace $$...$$ with display math
  .replace(/\$\$([^$]+)\$\$/g, (match, math) => {
    try {
      return katex.renderToString(math, {
        throwOnError: false,
        displayMode: true
      })
    } catch {
      return match
    }
  })
}
```

### Math Renderer Component (`components/problems/MathRenderer.tsx`)

```typescript
'use client'

import { useEffect, useRef } from 'react'
import { renderMath } from '@/lib/utils/katex'

export function MathRenderer({ content }: { content: string }) {
  const ref = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = renderMath(content)
    }
  }, [content])
  
  return <div ref={ref} className="math-content" />
}
```

---

## State Management

### Problem Store (`stores/problemStore.ts`)

```typescript
import { create } from 'zustand'

interface ProblemStore {
  currentProblem: Problem | null
  problemList: Problem[]
  currentIndex: number
  setCurrentProblem: (problem: Problem) => void
  nextProblem: () => void
  previousProblem: () => void
  showHint: boolean
  showSolution: boolean
  toggleHint: () => void
  toggleSolution: () => void
}

export const useProblemStore = create<ProblemStore>((set, get) => ({
  // Implementation
}))
```

---

## API Routes

### Problems API (`app/api/problems/route.ts`)

```typescript
import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const topicId = searchParams.get('topicId')
  
  if (!topicId) {
    return Response.json({ error: 'Topic ID required' }, { status: 400 })
  }
  
  const { data, error } = await supabase
    .from('problems')
    .select('*')
    .eq('topic_id', topicId)
  
  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
  
  return Response.json(data)
}
```

### AI Assistant API (`app/api/ai/chat/route.ts`)

```typescript
import { OpenAI } from 'openai'
import { NextRequest } from 'next/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  const { messages, context } = await request.json()
  
  // Include problem context in system message
  const systemMessage = {
    role: 'system',
    content: `You are a calculus tutor helping with problem: ${context.problemText}`
  }
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [systemMessage, ...messages],
    temperature: 0.7,
    max_tokens: 500
  })
  
  return Response.json(completion.choices[0].message)
}
```

---

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key

# Optional
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

---

## Development Commands

```bash
# Initial setup
npx create-next-app@latest frontend --typescript --tailwind --app
cd frontend
npm install @supabase/supabase-js zustand katex framer-motion
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card dialog sheet tabs

# Development
npm run dev

# Type generation from Supabase
npx supabase gen types typescript --project-id your_project_id > types/database.ts

# Build
npm run build

# Deploy to Vercel
vercel
```

---

## Mobile Responsiveness Strategy

### Breakpoints
```typescript
// tailwind.config.ts
const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
}
```

### Component Adaptations
- **AI Sidebar:** Desktop → Right sidebar | Mobile → Bottom sheet
- **Problem Navigation:** Desktop → Inline buttons | Mobile → Swipe gestures
- **Course Selection:** Desktop → Grid | Mobile → Stack
- **Hints/Solutions:** Desktop → Inline expand | Mobile → Full screen modal

---

## Performance Optimizations

1. **Server Components:** Use for static content (landing, course lists)
2. **Dynamic Imports:** Lazy load heavy components (AI sidebar, KaTeX)
3. **Image Optimization:** Use Next.js Image component
4. **Font Loading:** Optimize math fonts with next/font
5. **Caching:** Implement SWR for problem fetching
6. **Bundle Splitting:** Separate vendor chunks

---

## Testing Strategy

```bash
# Unit tests
npm install --save-dev @testing-library/react jest

# E2E tests
npm install --save-dev playwright

# Test structure
__tests__/
├── components/
├── hooks/
└── e2e/
```

---

## Deployment Checklist

- [ ] Environment variables configured in Vercel
- [ ] Database migrations run on Supabase
- [ ] RLS policies configured
- [ ] Error tracking (Sentry) configured
- [ ] Analytics (PostHog/Vercel) configured
- [ ] Performance monitoring enabled
- [ ] SEO meta tags added
- [ ] Accessibility audit passed
- [ ] Mobile responsiveness tested
- [ ] Browser compatibility verified

---

## Common Pitfalls to Avoid

1. **LaTeX Rendering:** Don't use MathJax (too slow), use KaTeX
2. **State Management:** Don't overcomplicate with Redux, Zustand is sufficient
3. **Database Queries:** Use select() to limit fields, avoid N+1 queries
4. **AI Context:** Always include problem context in AI requests
5. **Mobile UX:** Test drag-and-drop on touch devices
6. **Type Safety:** Generate types from Supabase schema
7. **Performance:** Use React.memo() for expensive components
8. **SEO:** Server-render landing pages for better SEO