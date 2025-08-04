# Uploading to Supabase

This guide will help you upload the Stanford tournament data to your Supabase project.

## Prerequisites

1. **Supabase Account**: You need a Supabase account at https://supabase.com
2. **Python Dependencies**: Make sure you have the required packages installed:
   ```bash
   pip install -r requirements.txt
   ```

## Step 1: Set Up Supabase Project

1. Go to https://supabase.com and sign in
2. Create a new project named "math-problems" (or use existing)
3. Wait for the project to be ready

## Step 2: Configure Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy and paste the contents of `supabase_schema.sql`
3. Click **Run** to create the required tables

## Step 3: Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings** > **API**
2. Copy the **Project URL** (looks like `https://xyz.supabase.co`)
3. Copy the **anon public** key

## Step 4: Configure Environment Variables

Run the setup script:
```bash
python setup_supabase.py
```

This will prompt you for your Supabase credentials and create a `.env` file.

Alternatively, create a `.env` file manually:
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 5: Upload the Data

Run the upload script:
```bash
python upload_to_supabase.py data/upload/stanford_tournament_competition_april_2024.json
```

## Step 6: Verify the Upload

1. Go to your Supabase dashboard
2. Navigate to **Table Editor**
3. Check the `documents` and `problems` tables
4. You should see:
   - 1 document record for the Stanford tournament
   - 10 problem records

## Troubleshooting

### Common Issues

1. **"Supabase credentials not found"**
   - Make sure your `.env` file exists and has the correct credentials
   - Check that the file is in the project root directory

2. **"Table does not exist"**
   - Run the SQL schema script in Supabase SQL Editor
   - Make sure the table names are exactly `documents` and `problems`

3. **"Permission denied"**
   - Check that your Supabase anon key is correct
   - Ensure Row Level Security (RLS) is disabled or proper policies are set

4. **"Payload too large"**
   - The script automatically batches uploads in groups of 50
   - If you still get this error, reduce the batch size in the script

### Data Structure

The uploaded data will have this structure:

**Documents Table:**
- `id`: Unique document identifier
- `school`: Institution name (e.g., "stanford")
- `course`: Course code (e.g., "tournament")
- `problem_type`: Type of problems (e.g., "competition")
- `term`: Academic term (e.g., "april")
- `year`: Academic year (e.g., "2024")
- `total_problems`: Number of problems in the document
- `total_images`: Number of images in the document
- `created_at`: Timestamp when document was created
- `version`: Data version (e.g., "raw")

**Problems Table:**
- `id`: Unique problem identifier
- `doc_id`: Reference to the parent document
- `problem_text`: LaTeX-formatted problem statement
- `solution`: JSON object containing solution text and images
- `images`: Array of image filenames
- `difficulty`: Problem difficulty level (if assigned)
- `topics`: Array of topic tags
- `domain`: Array of domain tags
- `math_approach`: Array of mathematical approaches
- `reasoning_type`: Array of reasoning types

## Next Steps

After successful upload, you can:

1. **Query the data** using Supabase's SQL interface
2. **Build applications** using the Supabase client libraries
3. **Set up authentication** for user access control
4. **Create APIs** using Supabase's auto-generated REST API

## Example Queries

```sql
-- Get all problems from Stanford
SELECT * FROM problems 
WHERE doc_id IN (SELECT id FROM documents WHERE school = 'stanford');

-- Get problems by difficulty
SELECT * FROM problems WHERE difficulty = 'medium';

-- Search problems by topic
SELECT * FROM problems WHERE 'calculus' = ANY(topics);
``` 