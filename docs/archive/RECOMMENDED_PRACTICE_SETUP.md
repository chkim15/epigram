# Recommended Practice Feature Setup Guide

## Overview
The Recommended Practice feature allows users to upload their lecture notes or handouts (PDF/images) to receive personalized practice problem recommendations based on semantic similarity. The system uses pure embedding-based matching to find the 3 most similar problems from easy and medium difficulty levels.

## Technical Architecture
- **Vector Search**: PostgreSQL with pgvector extension
- **Embeddings**: Azure OpenAI text-embedding-3-large model (1536 dimensions, reduced from 3072)
- **Text Extraction**: Mathpix API for PDF and image OCR
- **Similarity Metric**: Cosine similarity
- **Frontend**: React component with file upload interface
- **Backend**: Next.js API route for processing uploads

## Setup Steps

### 1. Database Setup (Already Completed)
The pgvector extension and database functions have been created via migration:
- `vector(1536)` column added to problems table (uses Azure OpenAI text-embedding-3-large at reduced dimensions)
- Similarity search function `find_similar_problems` created
- IVFFlat index for fast vector search

### 2. Environment Variables
Add the following to your `.env.local` file:

```bash
# Mathpix API Credentials (required for PDF/image text extraction)
MATHPIX_APP_ID=your_mathpix_app_id_here
MATHPIX_APP_KEY=your_mathpix_app_key_here
```

To get Mathpix credentials:
1. Sign up at https://mathpix.com/ocr
2. Create a new API key
3. Copy the App ID and App Key

### 3. Generate Embeddings for Existing Problems

Run the embedding generation script to create embeddings for all existing problems:

```bash
cd frontend
npm run generate-embeddings
```

This script will:
- Fetch all problems without embeddings
- Combine problem text with subproblem text for comprehensive embeddings
- Generate embeddings using Azure OpenAI text-embedding-3-large (1536 dimensions)
- Store embeddings in the database
- Process in batches to avoid rate limits

**Note**: This may take 10-20 minutes depending on the number of problems.

### 4. Testing the Feature

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Navigate to the app**:
   - Go to http://localhost:3000/home
   - Switch to Practice mode (toggle in sidebar)
   - Click "Recommended Practice" in the sidebar

3. **Test file upload**:
   - Upload a PDF or image containing math problems or concepts
   - System will extract text using Mathpix
   - Generate embedding for uploaded content
   - Find and display 3 most similar problems

## How It Works

### Upload Processing Flow
1. User uploads PDF/image file
2. File sent to `/api/recommendations/upload`
3. Mathpix API extracts mathematical text
4. Gemini generates embedding for extracted text
5. pgvector finds 3 most similar problems (easy/medium only)
6. Results displayed with similarity percentages

### Key Features
- **Pure Embedding Similarity**: No complex scoring, just cosine similarity
- **Subproblem Handling**: Problems with parts (a,b,c) treated as single unit
- **User Exclusion**: Completed problems excluded from recommendations
- **Difficulty Focus**: Only easy/medium problems recommended for learning
- **Similarity Display**: Shows match percentage for transparency

## File Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── recommendations/
│   │   │       └── upload/
│   │   │           └── route.ts         # Upload API endpoint
│   │   └── home/
│   │       └── page.tsx                 # Main app with routing
│   ├── components/
│   │   ├── practice/
│   │   │   └── RecommendedPractice.tsx # UI component
│   │   └── navigation/
│   │       └── TopicsSidebar.tsx       # Updated with menu item
│   └── scripts/
│       └── generate-embeddings.ts      # Embedding generation script
└── .env.local                           # Environment variables
```

## Troubleshooting

### Issue: "Failed to extract text from file"
- **Cause**: Mathpix API credentials missing or invalid
- **Solution**: Check MATHPIX_APP_ID and MATHPIX_APP_KEY in .env.local

### Issue: "No similar problems found"
- **Cause**: Embeddings not generated for existing problems
- **Solution**: Run `npm run generate-embeddings`

### Issue: Upload fails with 500 error
- **Cause**: Google API key missing or invalid
- **Solution**: Verify GOOGLE_API_KEY in .env.local

### Issue: Slow similarity search
- **Cause**: Missing database index
- **Solution**: Verify IVFFlat index exists on problems.embedding column

## Performance Considerations

- **Embedding Generation**: Batch process to avoid rate limits
- **Search Performance**: ~5-10ms for similarity search with index
- **File Size Limit**: 10MB max for uploads
- **Caching**: Consider caching embeddings for frequently uploaded content

## Future Enhancements

1. **Multi-file Upload**: Support batch uploads
2. **Recommendation History**: Track what was recommended when
3. **Feedback Loop**: Allow users to rate recommendation quality
4. **Advanced Filtering**: Add topic/source filters to recommendations
5. **Semantic Caching**: Cache embeddings for common lecture materials

## API Documentation

### POST `/api/recommendations/upload`

**Request**:
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body:
  - `file`: PDF or image file (required)
  - `userId`: User ID for excluding completed problems (optional)

**Response**:
```json
{
  "success": true,
  "recommendations": [
    {
      "id": "uuid",
      "problem_text": "...",
      "difficulty": "easy|medium",
      "similarity": 0.85,
      "document_id": "source_id",
      "has_subproblems": true,
      "subproblems": [...]
    }
  ],
  "uploadSummary": "First 200 chars of extracted text...",
  "extractedLength": 1234,
  "message": "Found 3 similar problems"
}
```

## Database Functions

### `find_similar_problems`
PostgreSQL function for vector similarity search:
```sql
find_similar_problems(
  query_embedding vector(1536),
  difficulty_filter text[],
  exclude_user_id uuid,
  match_limit int
) RETURNS TABLE (...)
```

## Monitoring

Monitor the following metrics:
- Upload success rate
- Average extraction time
- Embedding generation time
- Similarity search performance
- User engagement with recommendations

## Security Notes

- Mathpix API keys are server-side only
- File uploads validated for type and size
- User authentication required for personalized exclusions
- Embeddings stored securely in database