# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. Domain-specific guidance lives in subdirectory CLAUDE.md files (`frontend/`, `backend/`, `editor/`).

## Project Overview

A math learning platform: PDF-to-JSON conversion for extracting problems from exams, a Next.js web app for interactive learning with AI tutoring and subscriptions, and standalone HTML editors for problem curation.

## Architecture

1. **Backend** (`backend/`): Python PDF processing pipeline using Mathpix API
2. **Frontend** (`frontend/`): Next.js 15 app with problem viewer, AI chat (Claude via AWS Bedrock), PDF viewer, subscriptions/payments
3. **Editor Tools** (`editor/`): Standalone HTML editors for problem curation

## Environment Variables

### Frontend (`frontend/.env.local`)
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key    # Admin ops (account deletion)
GOOGLE_API_KEY=your_google_ai_key                  # Server-side only
OPENAI_API_KEY=your_openai_key                     # Server-side only
AWS_ACCESS_KEY_ID=your_aws_key                     # Bedrock (Claude)
AWS_SECRET_ACCESS_KEY=your_aws_secret              # Bedrock (Claude)
AWS_REGION=us-east-1                               # Bedrock region
STRIPE_SECRET_KEY=your_stripe_secret               # Payments
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret   # Stripe webhooks
RESEND_API_KEY=your_resend_key                     # Email
NEXT_PUBLIC_APP_URL=https://your-domain.com        # App URL for redirects
```

### Backend (project root `.env`)
```bash
MATHPIX_APP_ID=your_app_id
MATHPIX_APP_KEY=your_app_key
```

## Database Schema (Supabase PostgreSQL)

See `backend/DATABASE_SCHEMA.md` for detailed schema documentation.

### Core tables
**documents**: Exam metadata (id, school, course, problem_type, term, year)
**problems**: LaTeX text, solutions, difficulty, arrays for approaches/reasoning, soft deletion flag, `problem_name`, `problem_labels`, `company_labels`, `location_labels`
**problem_topics**: Junction table (many-to-many between problems and topics)
**problem_quant_topics**: Junction table (many-to-many between problems and quant_topics)
**subproblems**: Sub-questions (a, b, c parts) linked to main problems
**topics**: Reference table with predefined calculus topics
**quant_topics**: Reference table for quantitative interview topics
**solutions**: User-submitted solutions

### User tables
**users**, **user_profiles**, **user_preferences**: Account and settings
**user_answers**, **user_problem_progress**, **user_notes**: Learning progress

### AI/Chat tables
**chat_messages**: Persisted chat history
**tutor_sessions**, **tutor_messages**: AI tutor conversation sessions

### Subscription tables
**subscription_plans**, **user_subscriptions**, **payment_history**, **usage_tracking**: Stripe-based payments

**Key schema features:**
- `math_approach` and `reasoning_type` are TEXT[] arrays
- Topics use many-to-many via `problem_topics` junction table
- `included` BOOLEAN for soft deletion

### Migrations

Apply all files in filename order from `supabase/migrations/` (currently 24 migrations).

## JSON Data Structure

Output format from `backend/src/converter/pdf_converter.py`:

```json
{
  "document": {
    "id": "prefix_identifier",
    "school": "institution_name",
    "course": "course_code",
    "problem_type": "exam_type",
    "term": "semester",
    "year": "academic_year",
    "total_problems": 15,
    "total_images": 2,
    "created_at": "YYYY-MM-DD HH:MM:SS"
  },
  "problems": [
    {
      "id": "unique_problem_id",
      "problem_text": "LaTeX formatted statement",
      "answer_options": null,
      "correct_answer": "A",
      "solution": {
        "text": null,
        "images": []
      },
      "images": ["file1.png"],
      "difficulty": "easy|medium|hard",
      "topics": [1, 2, 3],
      "math_approach": ["algebraic", "geometric"],
      "reasoning_type": ["computational"],
      "hint": null,
      "importance": null,
      "comment": null,
      "version": "raw",
      "included": true,
      "subproblems": {
        "a": {
          "id": "subproblem_uuid",
          "key": "a",
          "problem_text": "subproblem statement",
          "solution_text": "subproblem solution",
          "hint": null,
          "comment": null
        }
      }
    }
  ]
}
```

## Notes for Claude Code

- Don't run `npm run dev` automatically — user runs it manually
- Focus only on relevant code — don't modify unrelated files
- Environment variables without `NEXT_PUBLIC_` prefix are server-side only
- Test builds locally with `npm run build` before deployment
