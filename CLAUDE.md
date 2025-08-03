# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Mathpix PDF-to-JSON converter for math problems with a web-based editor interface. The project processes PDF files containing math exams/problems, extracts problems using the Mathpix API, and provides a comprehensive HTML editor for reviewing and enhancing the extracted content.

## Core Architecture

### Main Components

**PDF Processing Pipeline (`src/converter.py`)**
- `SinglePDFConverter` class handles PDF to JSON conversion using Mathpix API
- Converts PDF pages to images using PyMuPDF (fitz)
- Processes each page with Mathpix text recognition API
- Extracts mathematical problems, images, and metadata
- Applies intelligent filtering to remove headers/footers and exam metadata
- Associates images with specific problems using content analysis

**Web Editor Interface (`problem_editor.html`)**
- Self-contained HTML file with embedded CSS/JavaScript
- MathJax integration for LaTeX rendering
- Editable problem text, answer options, solutions, difficulty levels, and topic tags
- Real-time LaTeX preview and editing capabilities
- Local storage backup and JSON export functionality

**Launcher Script (`open_editor.py`)**
- Copies problems.json to working directory for easy access
- Opens the HTML editor in default browser
- Handles file path management and provides user instructions

### Data Structure

The project uses a standardized JSON format:
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
    "created_at": "timestamp"
  },
  "problems": [
    {
      "id": "unique_problem_id",
      "problem_text": "LaTeX formatted problem statement",
      "answer_options": {"A": "option1", "B": "option2"}, // or null for text answers
      "correct_answer": "A", // or text answer
      "solution": "detailed solution steps",
      "images": ["filename1.png"],
      "difficulty": "easy|medium|hard",
      "topics": ["calculus", "derivatives"]
    }
  ]
}
```

## Development Commands

### Environment Setup
```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies (create requirements.txt as needed)
pip install requests python-dotenv PyMuPDF Pillow
```

### Running the Converter
```bash
# Convert a PDF to JSON format
python src/converter.py --pdf "path/to/exam.pdf" --prefix "school_course_type_term_year" --output "output"

# Example
python src/converter.py --pdf "data/103finalf14.pdf" --prefix "penn_math103_final_fall_2014" --output "output"
```

### Environment Variables Required
Create a `.env` file in the root directory:
```
MATHPIX_APP_ID=your_app_id_here
MATHPIX_APP_KEY=your_app_key_here
```

### Opening the Editor
```bash
# Quick start - copies files and opens browser
python open_editor.py

# Manual approach - open problem_editor.html directly in browser
```

## Key Implementation Details

### PDF Processing Strategy
- Converts PDF to high-resolution images (2x scale) for better OCR accuracy
- Automatically detects content start page by analyzing for math content and problem numbers
- Filters out common exam metadata patterns (headers, instructions, student info)
- Uses content analysis to associate images with specific problems
- Handles multiple problems per page with boundary detection

### Image Association Logic
The converter uses sophisticated logic to associate images with problems:
- Analyzes problem boundaries using regex patterns for problem numbers
- Filters header images based on position and size heuristics
- Associates images with problems based on content proximity and context
- Supports both Mathpix-extracted images and direct PDF image extraction

### Problem Text Processing
- Extracts subproblems (a), b), c) formats) from main problem text
- Validates problem content using math-specific patterns and keywords
- Cleans extracted text by removing exam artifacts and metadata
- Preserves LaTeX formatting for mathematical expressions

### Editor Features
- Click-to-edit LaTeX rendering with real-time preview
- Automatic problem completion validation
- Browser storage backup for work-in-progress
- Statistics tracking (total, completed, incomplete problems)
- Support for both multiple choice and text-based answers

## File Organization

```
mathpix/
├── src/
│   └── converter.py          # Main PDF processing logic
├── data/                     # Input PDF files
├── output/                   # Generated JSON and images
│   └── [prefix]/
│       ├── [prefix].json
│       └── images/
├── problem_editor.html       # Web-based editor
├── open_editor.py           # Launcher script
├── problems.json            # Working copy for editor
└── README_editor.md         # Detailed editor documentation
```

## Working with the Codebase

### Adding New PDF Processing Features
- Extend the `SinglePDFConverter` class in `src/converter.py`
- Modify the `_filter_page_content()` method to handle new exam formats
- Update the `_is_valid_problem_content()` method for new problem types
- Test with various PDF formats to ensure robust extraction

### Customizing the Editor
- Modify the HTML/CSS/JavaScript in `problem_editor.html`
- The editor is self-contained with embedded MathJax
- Uses local storage for backup - data persists between sessions
- Add new validation rules in the `isProblemComplete()` function

### Processing New Exam Formats
- Create new prefix patterns following the convention: `school_course_type_term_year`
- Update filtering patterns in `_filter_page_content()` for institution-specific headers
- Adjust image association logic in `_find_best_problem_for_image()` as needed

## Testing and Quality Assurance

Always verify output quality by:
1. Running the converter on test PDFs
2. Opening the generated JSON in the editor
3. Checking that images are properly associated with problems
4. Verifying LaTeX rendering in the editor
5. Ensuring all problems are correctly extracted and formatted

The editor provides completion indicators to help identify problems that need manual review or correction.