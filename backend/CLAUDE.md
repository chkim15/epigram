# Backend — CLAUDE.md

## Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Configure Mathpix credentials in **project root** `.env`:
```bash
MATHPIX_APP_ID=your_app_id
MATHPIX_APP_KEY=your_app_key
```

## PDF Conversion

```bash
# From project root
python convert.py --pdf "path/to/exam.pdf" --prefix "school_course_type_term_year" --output "storage/processed"

# Short flags
python convert.py -p "path/to/exam.pdf" -i "school_course_type_term_year" -o "storage/processed"

# Direct backend usage
python backend/src/converter/pdf_converter.py --pdf "path/to/exam.pdf" --prefix "school_course_type_term_year" --output "storage/processed"

# Example
python convert.py --pdf "storage/raw/upenn/103finalf14.pdf" --prefix "upenn_math103_final_fall_2014" --output "storage/processed"
```

## Reference

- `backend/DATABASE_SCHEMA.md` — detailed database schema documentation
- `backend/sql/` — versioned SQL schema files
