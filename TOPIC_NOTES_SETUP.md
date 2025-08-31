# Topic Notes Setup Instructions

This guide will help you set up the topic notes feature in your Epigram application.

## Overview
The topic notes feature displays PDF notes relevant to each problem based on its associated topics. Problems with multiple topics will show sub-tabs to switch between different topic notes.

## Setup Steps

### 1. Apply Database Migration

First, apply the migration to create the `topic_notes` table:

```bash
# Apply the migration through Supabase dashboard or CLI
supabase migration up 20250131_create_topic_notes_table
```

Or manually run the SQL in your Supabase SQL editor:
- Navigate to Supabase Dashboard > SQL Editor
- Copy contents of `supabase/migrations/20250131_create_topic_notes_table.sql`
- Execute the SQL

### 2. Upload PDFs to Supabase Storage

#### Prerequisites
- Ensure you have Python 3.x installed
- Install required Python packages:
  ```bash
  pip install supabase
  ```

#### Environment Setup
Create a `.env` file in the project root (or update existing) with:
```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Note: Use the SERVICE_ROLE_KEY (not the anon key) for uploading files.

#### Run Upload Script

```bash
# From project root
python scripts/upload_topic_notes.py --notes-dir /path/to/your/pdf/folder

# Example (assuming PDFs are in a folder called 'topic_notes'):
python scripts/upload_topic_notes.py --notes-dir ./topic_notes

# Dry run first to verify:
python scripts/upload_topic_notes.py --notes-dir ./topic_notes --dry-run
```

The script will:
1. Upload all PDFs to the `pdf-notes` bucket in path `topics/`
2. Update the `topic_notes` table with the public URLs
3. Display progress and a summary

### 3. Verify Setup

#### Check Database
Run this SQL in Supabase to verify the notes are registered:
```sql
SELECT topic_id, file_name, file_url 
FROM topic_notes 
ORDER BY topic_id 
LIMIT 5;
```

#### Check Storage
1. Go to Supabase Dashboard > Storage
2. Navigate to `pdf-notes` bucket
3. Check that `topics/` folder contains all 35 PDFs

### 4. Test in Application

1. Start your development server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Navigate to a problem in the app
3. Click on the "Notes" tab in the right sidebar
4. You should see:
   - For single-topic problems: PDF displays directly
   - For multi-topic problems: Sub-tabs for each topic

## File Structure

After setup, your storage structure will be:
```
pdf-notes/ (bucket)
  └── topics/
      ├── 1_limits_continuity_and_ivt.pdf
      ├── 2_limits_indeterminate_forms_limits_via_algebraic_manipulation.pdf
      ├── 3_limits_limits_at_infinity_and_asymptotes.pdf
      └── ... (35 PDFs total)
```

## Troubleshooting

### PDFs not showing
1. Check browser console for errors
2. Verify URLs are correct in `topic_notes` table
3. Ensure `pdf-notes` bucket is public (check bucket settings)

### Upload script fails
1. Verify your service role key is correct
2. Check that PDF files exist in the specified directory
3. Ensure file names match expected pattern: `{id}_{topic_name}.pdf`

### Database migration fails
1. Check if `topics` table exists (required foreign key)
2. Ensure you have proper database permissions
3. Check if `topic_notes` table already exists

## Notes

- Topics 36-41 are special topics without notes (can be added later)
- The system handles missing PDFs gracefully with a message
- PDFs are served directly from Supabase storage (no backend proxy needed)
- The `pdf-notes` bucket must be public for PDFs to be accessible

## Components Modified

- `frontend/src/components/notes/TopicNotesViewer.tsx` - New component for displaying topic PDFs
- `frontend/src/components/ai/ChatSidebar.tsx` - Updated Notes tab to use TopicNotesViewer
- `frontend/src/stores/problemStore.ts` - Added state for tracking current problem's topics
- `supabase/migrations/20250131_create_topic_notes_table.sql` - Database schema for topic notes
- `scripts/upload_topic_notes.py` - Python script for uploading PDFs