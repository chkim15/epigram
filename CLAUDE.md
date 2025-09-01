# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A comprehensive math learning platform that combines PDF-to-JSON conversion for extracting mathematical problems from exams with a modern Next.js web application. The system processes academic PDFs, extracts problems with LaTeX formatting, provides web-based editors for review, and offers an interactive learning environment with AI-powered tutoring.

## Architecture Overview

The project consists of three main parts:
1. **Backend**: Python-based PDF processing pipeline using Mathpix API
2. **Frontend**: Next.js 15 web application with interactive problem viewer and AI chat
3. **Editor Tools**: Standalone HTML editors for problem curation

---

## BACKEND - PDF Processing System

### Core Components

**PDF Processing Pipeline (`backend/src/converter/pdf_converter.py`)**
- `SinglePDFConverter` class orchestrates PDF to JSON conversion via Mathpix API
- Converts PDF pages to high-resolution images (2x scale) using PyMuPDF
- Submits images to Mathpix text recognition API for mathematical content extraction
- Filters exam metadata (headers, footers, instructions) using pattern matching
- Associates extracted images with problems using boundary detection and proximity analysis

### Backend Setup & Commands

```bash
# Environment setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure Mathpix API credentials
echo "MATHPIX_APP_ID=your_app_id" > .env
echo "MATHPIX_APP_KEY=your_app_key" >> .env
```

### PDF Conversion

```bash
# From project root using convenience wrapper
python convert.py --pdf "path/to/exam.pdf" --prefix "school_course_type_term_year" --output "storage/processed"

# Direct backend usage
python backend/src/converter/pdf_converter.py --pdf "path/to/exam.pdf" --prefix "school_course_type_term_year" --output "storage/processed"

# Example with UPenn exam
python convert.py --pdf "storage/raw/upenn/103finalf14.pdf" --prefix "upenn_math103_final_fall_2014" --output "storage/processed"
```

### Backend Dependencies (`backend/requirements.txt`)
- **requests**: Mathpix API communication
- **python-dotenv**: Environment variable management
- **PyMuPDF (fitz)**: PDF to image conversion and page extraction
- **Pillow**: Image processing and manipulation
- **pytz**: Timezone handling for timestamps in Eastern Time
- **supabase**: Database integration for persistent storage (optional)

---

## FRONTEND - Next.js Web Application

### Tech Stack
- **Next.js 15.4.6**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS 4**: Utility-first CSS with Oxide compiler
- **Zustand**: State management for problems and UI state
- **Supabase**: Database and authentication
- **PDF.js**: PDF rendering in browser
- **KaTeX**: LaTeX math rendering
- **Google Generative AI**: Gemini models for AI tutoring
- **OpenAI**: GPT models for alternative AI assistance

### Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Landing page
│   │   ├── layout.tsx          # Root layout
│   │   ├── app/               # Main application
│   │   │   ├── page.tsx       # Problem viewer page
│   │   │   └── layout.tsx     # App layout with panels
│   │   └── api/
│   │       └── chat/          # AI chat endpoint
│   │           └── route.ts   # Streaming chat API
│   ├── components/
│   │   ├── ai/
│   │   │   └── ChatSidebar.tsx     # AI tutor chat interface
│   │   ├── navigation/
│   │   │   └── TopicsSidebar.tsx   # Topic navigation
│   │   ├── pdf/
│   │   │   ├── PDFViewer.tsx       # Main PDF viewer
│   │   │   ├── PDFViewerSimple.tsx # Simplified viewer
│   │   │   ├── PDFWorkerContext.tsx # PDF.js worker setup
│   │   │   └── VirtualPDFPages.tsx # Virtualized PDF rendering
│   │   ├── problems/
│   │   │   └── ProblemViewer.tsx   # Problem display with LaTeX
│   │   ├── layout/
│   │   │   └── UnifiedHeader.tsx   # App header
│   │   └── ui/                     # Shadcn/ui components
│   ├── stores/
│   │   └── problemStore.ts         # Zustand state management
│   ├── types/
│   │   └── database.ts            # TypeScript types
│   └── lib/
│       ├── supabase/
│       │   └── client.ts          # Supabase client config
│       └── utils/
│           ├── katex.tsx          # LaTeX rendering utilities
│           └── pdf.ts             # PDF helper functions
├── public/
│   ├── epigram_logo.svg          # Company logo (32x32 display)
│   ├── demo.png                  # Landing page demo image
│   └── problems.json             # Static problem data
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
└── .env.local                    # Environment variables
```

### Frontend Setup & Commands

```bash
# Install dependencies
cd frontend
npm install

# Development server
npm run dev  # Runs on http://localhost:3000

# Build for production
npm run build

# Start production server
npm start

# Type checking and linting
npm run lint
```

### Environment Variables (`frontend/.env.local`)

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Supabase Service Role Key - Required for admin operations (account deletion)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI API Keys (Server-side only - no NEXT_PUBLIC prefix)
GOOGLE_API_KEY=your_google_ai_key
OPENAI_API_KEY=your_openai_key
```

### Key Frontend Features

**Problem Viewer (`ProblemViewer.tsx`)**
- Displays problems with LaTeX math rendering using KaTeX
- Navigation between problems with Previous/Next buttons
- Shows problem metadata (difficulty, topics, source)
- Integrates with AI chat for problem-specific help
- Responsive layout with tabs for Chat, Notes, Solutions, Comments

**AI Chat System (`ChatSidebar.tsx` + `api/chat/route.ts`)**
- Multiple AI models: Gemini 2.5 Flash, Gemini 2.5 Pro, GPT-5 Mini, GPT-5 Nano
- Streaming responses for real-time interaction
- Problem context awareness (current problem automatically included)
- Image support for visual problem solving
- Preset prompts for common tutoring scenarios

**PDF Viewer (`PDFViewer.tsx`)**
- Virtualized rendering for performance
- Zoom controls and page navigation
- Synchronized with problem selection
- Responsive width options

**State Management (`problemStore.ts`)**
- Centralized problem state using Zustand
- Tracks current problem, document, and navigation
- Manages UI states (hints, solutions, loading)
- Computed properties for navigation controls

### Frontend Dependencies

```json
{
  "dependencies": {
    "@google/generative-ai": "^0.24.1",    // Google AI SDK
    "@radix-ui/*": "UI primitives",
    "@supabase/supabase-js": "^2.55.0",
    "framer-motion": "^12.23.12",          // Animations
    "katex": "^0.16.22",                   // LaTeX rendering
    "lucide-react": "^0.539.0",            // Icons
    "next": "15.4.6",
    "openai": "^5.12.2",                   // OpenAI SDK
    "pdfjs-dist": "^5.4.54",               // PDF rendering
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "tailwind-merge": "^3.3.1",
    "zustand": "^5.0.7"                    // State management
  }
}
```

---

## EDITOR TOOLS

### Local Editor (`editor/problem_editor.html`)
- Self-contained HTML file with embedded MathJax for LaTeX rendering
- Real-time editing of problem text, answers, solutions, difficulty, and topics
- Local storage persistence with automatic backup
- Completion tracking with visual indicators

### Database Editor (`editor/problem_editor_database.html`)
- Supabase-connected editor for persistent storage
- Real-time database sync with conflict resolution
- Multi-user editing capabilities
- Structured topic management via topics.json

### Editor Commands

```bash
# Quick launch - opens browser with local editor
python editor/open_editor.py

# Database-connected editor (requires Supabase setup)
# Open editor/problem_editor_database.html in browser

# Manual local workflow
# 1. Open editor/problem_editor.html in browser
# 2. Load JSON file via interface
# 3. Edit and export as problems_edited.json
```

---

## DATABASE SCHEMA

The project uses Supabase PostgreSQL with the following key tables:

**documents**: Exam metadata (id, school, course, problem_type, term, year)
**problems**: Main problems with LaTeX text, solutions, difficulty, arrays for approaches/reasoning, soft deletion flag
**problem_topics**: Junction table for many-to-many relationship between problems and topics
**subproblems**: Normalized sub-questions (a, b, c parts) linked to main problems
**topics**: Reference table with 40 predefined calculus topics

### Database Management

```bash
# Apply Supabase migrations in order:
supabase/migrations/20250806024840_create_schema.sql
supabase/migrations/20250806024914_insert_topics.sql
supabase/migrations/20250806025445_insert_stanford_data.sql
supabase/migrations/20250806031517_insert_upenn_data.sql
supabase/migrations/20250118_add_problem_topics_junction.sql  # Junction table for topics
```

**Key Schema Features:**
- `math_approach` and `reasoning_type` are TEXT[] arrays (multiple selections)
- Topics use many-to-many relationship via `problem_topics` junction table
- `included` BOOLEAN column for soft deletion (exclude without removing)

---

## JSON DATA STRUCTURE

```json
{
  "doc": {
    "id": "prefix_identifier",
    "school": "institution_name",
    "course": "course_code",
    "problem_type": "exam_type",
    "term": "semester",
    "year": "academic_year",
    "total_problems": 15,
    "total_images": 2,
    "created_at": "YYYY-MM-DD HH:MM:SS"  // Eastern Time
  },
  "problems": [
    {
      "id": "unique_problem_id",
      "problem_text": "LaTeX formatted statement",
      "answer_options": {"A": "opt1", "B": "opt2"},  // null for text answers
      "correct_answer": "A",
      "solution": "detailed steps",
      "images": ["file1.png"],
      "difficulty": "easy|medium|hard",
      "topics": [1, 2, 3],  // Topic IDs (many-to-many via junction table)
      "math_approach": ["algebraic", "geometric"],  // Array of approaches
      "reasoning_type": ["computational"],  // Array of reasoning types
      "included": true,  // Soft deletion flag
      "subproblems": [
        {
          "id": "subproblem_uuid",
          "key": "a",
          "problem_text": "subproblem statement",
          "solution_text": "subproblem solution"
        }
      ]
    }
  ]
}
```

---

## RECENT FRONTEND CHANGES (January 2025)

### Authentication & User Management (January 2025)

**Settings Modal Implementation (`src/components/settings/SettingsModal.tsx`)**
- Complete settings modal with three tabs: Account, Personalization, Account Management
- Account tab displays user information (Name, Email, Date Created, School, Courses)
- Account Management tab includes account deletion functionality
- Blur background overlay (`bg-gray-900/50 backdrop-blur-lg`) for modal backdrop
- Always opens to Account tab regardless of previous state

**Account Deletion System**
- Server-side API endpoint (`src/app/api/delete-account/route.ts`) using Supabase admin API
- Client-side deletion functions in auth store and auth client
- Confirmation dialog with proper blur background styling
- Requires `SUPABASE_SERVICE_ROLE_KEY` environment variable for admin operations
- **IMPORTANT**: Must add `SUPABASE_SERVICE_ROLE_KEY` to both local `.env.local` and Vercel environment variables

**Email Verification Flow Updates**
- Removed auto-polling for email confirmation in verify-email page
- Fixed redirect flow: signup → email verification → confirmation → signin
- Added email conflict prevention to prevent duplicate accounts between Google OAuth and email signup
- Removed password confirmation field from signup for improved UX
- Changed sign-out redirect from signin page to app page

**Authentication UI Improvements**
- Fixed Suspense boundary issues with `useSearchParams()` in signin page
- Proper TypeScript types replacing `any` with `AuthError`, `User`, `Session`
- Enhanced error handling with helpful user messages
- User profile dropdown connected to settings modal

### TypeScript Type Updates (`src/types/database.ts`)
- Removed `topic_id` from problems table type (no longer exists)
- Changed `math_approach` from `string | null` to `string[] | null` (now an array)
- Changed `reasoning_type` from `string | null` to `string[] | null` (now an array)
- Added `included: boolean` field for soft deletion support
- Added `problem_topics` junction table type for many-to-many topic relationships

### ProblemViewer Component Updates (`src/components/problems/ProblemViewer.tsx`)
- Removed `topic_id` from database queries (column no longer exists)
- Added filter for `included = true` to exclude soft-deleted problems
- Simplified query to avoid complex nested joins with topics
- Topics can be fetched separately from `problem_topics` junction table if needed
- **Answer section removed** - No longer displays correct answers
- **Difficulty badge repositioned** - Now appears next to problem number instead of at bottom
- **Document ID moved** - Now positioned to the far right using `ml-auto`
- **Solution moved to Solutions tab** - Solutions no longer shown inline, accessed via dedicated tab

### ChatSidebar Component Updates (`src/components/ai/ChatSidebar.tsx`)
- **Solutions tab now functional** - Displays main problem solutions and subproblem solutions
- **Comments tab connected** - Shows comments from problems table `comment` column
- **Improved empty states** - Better messaging and icons for empty content
- **Icon updates**:
  - Chat tab: Uses `MessagesSquare` (AI Tutor icon)
  - Comments tab: Uses `MessageSquare` (more relevant than FileSearch)
- **Consistent scrollbar styling** - All tabs use `custom-scrollbar` class for uniform appearance

### Landing Page Redirect (`src/app/page.tsx`)
- Temporarily redirects from `/` to `/app` using Next.js `redirect()`
- Original landing page code preserved in comments for future use
- To restore: Remove redirect code and uncomment the original component

### Store Updates (`src/stores/problemStore.ts`)
- No changes needed - uses updated Problem type automatically
- Handles arrays for `math_approach` and `reasoning_type` through type system
- Removed unused `showSolution` and `toggleSolution` states (solutions now in tab)

### UI/UX Improvements & Design Principles

#### Scrollbar Design Consistency
- **Always use `custom-scrollbar` class** for any scrollable areas to maintain consistency
- **Current implementation** - Applied to:
  - ProblemViewer main content area
  - TopicsSidebar (left navigation)
  - All ChatSidebar tabs (Chat, Notes, Solutions, Comments)
  - TopicNotesViewer horizontal tab scrolling
- **Scrollbar specifications**:
  - Width/Height: 8px (thin design)
  - Color: rgba(156, 163, 175, 0.5) with 50% opacity
  - Hover: rgba(156, 163, 175, 0.7) with 70% opacity
  - Border radius: 4px for rounded corners
  - Track: Transparent background
- **Implementation**: Before adding any new scrollable area, check `globals.css` for the `custom-scrollbar` class definition and apply it consistently

#### Interactive Element Guidelines
- **Cursor behavior** - ALL interactive elements must show pointer cursor on hover:
  - Always add `cursor-pointer` class to clickable elements (buttons, tabs, links, etc.)
  - Check existing implementations for reference before adding new interactive elements
  - Never leave clickable elements with default cursor
- **Hover effects** - Maintain consistent hover states:
  - Buttons: Use existing hover classes with opacity or color changes
  - Tabs: Follow the pattern of border/text color changes on hover
  - Links: Apply consistent underline or color transitions
- **Active states**:
  - Solution navigation tabs use black activation color (`bg-black`) instead of blue
  - Maintain consistent active indicator styles across all tab interfaces

#### Other UI Standards
- **Logo and Branding** - Added Epigram logo (32x32 SVG) next to company name in:
  - TopicsSidebar header
  - Mobile header
  - UnifiedHeader (when sidebar is collapsed)
- **Favicon** - SVG logo configured as favicon via metadata
- **Dark mode support** - Fixed white backgrounds in ProblemViewer and toggle switch
- **Proper overflow handling** - Fixed scrolling issues in Solutions and Comments tabs

## COMMON ISSUES & SOLUTIONS

### Build & Deployment Issues

**TypeScript/ESLint Errors**
- Issue: `@typescript-eslint/no-explicit-any` errors blocking build
- Solution: Import proper types from packages (e.g., `GenerationConfig` from `@google/generative-ai`)
- Never use `any` type; always find and import the correct type definitions

**Package Confusion**
- Issue: Confusion between `@google/generative-ai` and `@google/genai` packages
- Solution: Use `@google/generative-ai` for the Google AI SDK with `GoogleGenerativeAI` class
- The APIs are different; ensure using `getGenerativeModel()` method pattern

**Next.js Module Not Found Errors**
- Issue: "Cannot find module './[hash].js'" after changes
- Solution: 
  ```bash
  rm -rf .next
  rm -rf node_modules/.cache
  # Kill existing dev server
  lsof -ti:3000 | xargs kill -9
  # Restart dev server
  npm run dev
  ```

**Vercel Deployment**
- Ensure GitHub repository is connected in Vercel dashboard
- Check build logs for TypeScript errors (warnings won't block deployment)
- Environment variables must be added in Vercel dashboard settings
- **Critical**: Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel environment variables for account deletion to work in production

### Development Tips

**Running Multiple Services**
```bash
# Terminal 1: Frontend dev server
cd frontend && npm run dev

# Terminal 2: Backend for PDF processing (when needed)
cd backend && source venv/bin/activate
python convert.py --pdf "exam.pdf" --prefix "test" --output "storage/processed"
```

**Debugging AI Chat**
- Check browser console for streaming errors
- Verify API keys in `.env.local`
- Monitor Network tab for `/api/chat` responses
- Test with shorter prompts first

**Performance Optimization**
- PDF viewer uses virtualization for large documents
- Problem data loads from static JSON for speed
- AI responses stream for better UX
- Images lazy-load as needed

---

## FILE ORGANIZATION

```
epigram/
├── backend/                 # Python PDF processing
│   ├── src/
│   │   └── converter/
│   │       └── pdf_converter.py
│   ├── requirements.txt
│   └── sql/                # Database schemas
├── frontend/               # Next.js web app
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env.local
├── editor/                 # Problem editing tools
│   ├── problem_editor.html
│   ├── problem_editor_database.html
│   └── topics.json
├── storage/                # Data storage
│   ├── processed/          # Converted JSON/images
│   ├── raw/               # Source PDFs
│   └── temp/              # Temporary files
├── supabase/              # Database migrations
│   └── migrations/
├── convert.py             # PDF conversion wrapper
└── CLAUDE.md             # This file
```

---

## QUALITY ASSURANCE CHECKLIST

### Backend/PDF Processing
1. ✓ PDF conversion captures all problems without content loss
2. ✓ Image associations map correctly to problem boundaries
3. ✓ LaTeX formatting preserved in JSON output
4. ✓ Problem numbering sequence maintains consistency

### Frontend Application
1. ✓ Problems load and display correctly from static JSON
2. ✓ LaTeX renders properly with KaTeX
3. ✓ AI chat responds with streaming content
4. ✓ PDF viewer synchronizes with problem selection
5. ✓ Navigation (Previous/Next) works correctly
6. ✓ Responsive design works on mobile/tablet/desktop

### Build & Deployment
1. ✓ `npm run build` completes without errors
2. ✓ TypeScript types are properly defined (no `any`)
3. ✓ Environment variables configured for production
4. ✓ Vercel deployment succeeds with GitHub integration

### Editor Tools
1. ✓ Local editor saves/loads from localStorage
2. ✓ Database editor syncs with Supabase
3. ✓ Export produces valid JSON format
4. ✓ Completion tracking works accurately

---

## COMMON ESLINT BUILD ERRORS & FIXES

### TypeScript Type Errors

**Problem**: `@typescript-eslint/no-explicit-any` errors prevent builds when using `any` type.

**Solution**: Import and use proper types from installed packages:
```typescript
// ❌ BAD - Using any type
interface AuthState {
  signIn: (email: string, password: string) => Promise<{ error: any }>;
}

// ✅ GOOD - Using proper Supabase types
import { AuthError } from '@supabase/supabase-js';
interface AuthState {
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
}
```

**Common Supabase Types to Import**:
- `User`, `Session`, `AuthError` from `@supabase/supabase-js`
- `AuthChangeEvent` for auth state change listeners

### React Unescaped Entities

**Problem**: Apostrophes and quotes in JSX text need proper escaping.

**Solution**: Use HTML entities:
```tsx
// ❌ BAD
<p>Don't have an account?</p>

// ✅ GOOD
<p>Don&apos;t have an account?</p>
```

### Unused Variables & Imports

**Problem**: ESLint flags unused imports and variables as errors.

**Solution**: Remove unused imports and variables, or add missing dependencies:
```typescript
// Remove unused imports
// ❌ import { Button } from '@/components/ui/button';  // Never used

// Add missing useEffect dependencies
useEffect(() => {
  checkAuth();
}, [checkAuth]);  // ✅ Include all dependencies
```

---

## IMPORTANT NOTES FOR CLAUDE CODE

- Don't run `npm run dev` automatically - it will be run manually by the user
- When fixing issues, focus only on the relevant code - don't modify unrelated files
- Always check for existing types before using `any` in TypeScript
- Use proper imports: `@google/generative-ai` not `@google/genai`
- Clear Next.js cache (`.next` folder) when encountering module errors
- Environment variables without `NEXT_PUBLIC_` prefix are server-side only
- Test builds locally with `npm run build` before deployment
- **ALWAYS fix TypeScript type errors properly** - never use `any` when proper types exist