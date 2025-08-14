# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Mathpix-powered PDF-to-JSON converter for extracting mathematical problems from exams and assignments. The system processes academic PDFs, extracts problems with LaTeX formatting, and provides a web-based editor for review and enhancement.

## Core Architecture

### Main Components

**PDF Processing Pipeline (`backend/src/converter/pdf_converter.py`)**
- `SinglePDFConverter` class orchestrates PDF to JSON conversion via Mathpix API
- Converts PDF pages to high-resolution images (2x scale) using PyMuPDF
- Submits images to Mathpix text recognition API for mathematical content extraction
- Filters exam metadata (headers, footers, instructions) using pattern matching
- Associates extracted images with problems using boundary detection and proximity analysis

**Local Editor (`editor/problem_editor.html`)**
- Self-contained HTML file with embedded MathJax for LaTeX rendering
- Real-time editing of problem text, answers, solutions, difficulty, and topics
- Local storage persistence with automatic backup
- Completion tracking with visual indicators

**Database Editor (`editor/problem_editor_database.html`)**
- Supabase-connected editor for persistent storage
- Real-time database sync with conflict resolution
- Multi-user editing capabilities
- Structured topic management via topics.json

**Launcher (`editor/open_editor.py`)**
- Convenience script that opens local editor in browser
- Handles file path management for JSON loading

## Development Commands

### Environment Setup
```bash
# Create virtual environment
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure Mathpix API credentials in backend directory
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

### Editor Workflow
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

### Database Management
```bash
# Apply Supabase migrations (if using database)
# Run each migration file in supabase/migrations/ in order:
# - 20250806024840_create_schema.sql
# - 20250806024914_insert_topics.sql
# - 20250806025445_insert_stanford_data.sql
# - 20250806031517_insert_upenn_data.sql
```

## JSON Data Structure

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
      "topics": ["calculus", "derivatives"]
    }
  ]
}
```

## Key Implementation Details

### PDF Processing (`backend/src/converter/pdf_converter.py`)

**Content Detection**
- `_detect_content_start_page()`: Finds first page with math content
- `_filter_page_content()`: Removes headers/footers using regex patterns
- `_is_valid_problem_content()`: Validates problems using math keywords

**Image Association**
- `_find_best_problem_for_image()`: Maps images to problems using boundaries
- Filters header images based on position and size
- Handles both Mathpix-extracted and PDF-embedded images

**Problem Extraction**
- Detects problem numbers (1., 2., etc.) and subproblems (a), b), c))
- Preserves LaTeX formatting for mathematical expressions
- Extracts multiple choice options and identifies answer patterns

### Editor Features (`editor/problem_editor.html`)

**Completion Validation**
- Problem marked complete when: has text, correct answer, solution, difficulty, and topics
- Real-time status updates with visual indicators
- Progress statistics in header

**Data Persistence**
- `saveToStorage()`: Saves to browser localStorage
- `exportJSON()`: Downloads edited data as `problems_edited.json`
- Automatic recovery on page reload

## File Organization

```
mathpix/
├── backend/                 # Backend Python services
│   ├── src/
│   │   └── converter/
│   │       ├── __init__.py
│   │       └── pdf_converter.py
│   ├── requirements.txt
│   └── sql/                # Database schema files
│       └── schema_v2.sql
├── convert.py              # Convenience wrapper for PDF conversion
├── editor/                 # Editing interfaces
│   ├── problem_editor.html          # Local editor
│   ├── problem_editor_database.html # Database-connected editor
│   ├── topics.json                  # Topic reference data
│   ├── open_editor.py              # Editor launcher
│   └── README_editor.md
├── storage/                # File storage
│   ├── processed/          # Converted JSON and extracted images
│   │   └── [prefix]/
│   │       ├── [prefix].json
│   │       └── images/
│   ├── raw/               # Input PDF files
│   │   ├── upenn/         # Institution-specific folders
│   │   ├── mit/
│   │   └── test/
│   └── temp/              # Temporary processing files
├── supabase/              # Database management
│   └── migrations/        # SQL migration files
│       ├── 20250806024840_create_schema.sql
│       ├── 20250806024914_insert_topics.sql
│       └── [other migrations]
└── frontend/              # Future React/web frontend
```

## Processing New Exam Formats

### Adding Institution-Specific Patterns
1. Update `_filter_page_content()` in `backend/src/converter/pdf_converter.py` with new header patterns
2. Add institution-specific problem number formats to regex patterns
3. Test with sample PDFs to verify extraction accuracy

### Prefix Convention
Format: `institution_course_type_term_year`
Examples:
- `upenn_math103_final_fall_2021`
- `mit_18.01_midterm_spring_2022`
- `stanford_tournament_competition_april_2024`

## Common Modifications

### Adjusting Image Processing
- Scale factor: Modify `matrix=fitz.Matrix(2, 2)` in pdf_converter.py:line ~150
- Image filtering: Update size/position thresholds in `_find_best_problem_for_image()`

### Enhancing Problem Validation
- Math keywords: Edit `math_keywords` list in `_is_valid_problem_content()`
- Problem patterns: Modify regex in `_filter_page_content()` for new formats

### Editor Customization
- Validation rules: Update `isProblemComplete()` function
- UI elements: Modify HTML structure and CSS styles
- Storage keys: Change localStorage keys in save/load functions

## Dependencies

**Backend Python Requirements** (`backend/requirements.txt`):
- **requests**: Mathpix API communication
- **python-dotenv**: Environment variable management
- **PyMuPDF (fitz)**: PDF to image conversion and page extraction
- **Pillow**: Image processing and manipulation
- **pytz**: Timezone handling for timestamps in Eastern Time
- **supabase**: Database integration for persistent storage (optional)

**Frontend Dependencies** (CDN-loaded):
- **Supabase JS Client**: Database connectivity for editor
- **MathJax 3**: LaTeX mathematical notation rendering
- **HTML5/CSS3/Vanilla JS**: No build process required

## Database Schema

The project uses Supabase PostgreSQL with the following key tables:

**documents**: Exam metadata (id, school, course, problem_type, term, year)
**problems**: Main problems with LaTeX text, solutions, difficulty, topic arrays
**subproblems**: Normalized sub-questions (a, b, c parts) linked to main problems
**topics**: Reference table with 40 predefined calculus topics

Key features:
- UUID primary keys for subproblems
- Array columns for topics (integer IDs) and images (filenames)
- Full-text search indexes on problem content
- RLS policies for secure multi-user access

## Quality Assurance Checklist

1. Verify PDF conversion captures all problems without content loss
2. Check image associations map correctly to problem boundaries
3. Validate LaTeX rendering in both editor versions
4. Confirm completion indicators work properly across browser sessions
5. Test export/import functionality between local and database editors
6. Verify problem numbering sequence maintains consistency
7. Test database sync functionality if using Supabase editor
8. Validate topic assignment accuracy using topics.json reference

- Don't try to run npm run dev because it will be run manually.
- When you are asked to fix certain issues or features, focus only on the relevant pieces. Don't touch any other code that is not relevant.