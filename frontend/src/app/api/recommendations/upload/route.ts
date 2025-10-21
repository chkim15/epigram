import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role for RPC calls
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Azure OpenAI configuration
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY!;
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT!;
const AZURE_OPENAI_EMBEDDING_DEPLOYMENT = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'text-embedding-3-large';
const AZURE_OPENAI_CHAT_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT_NAME_GPT5 || 'gpt-5-chat';

/**
 * Extract text from PDF or image using Mathpix API
 */
async function extractTextWithMathpix(file: File): Promise<string> {
  const mathpixAppId = process.env.MATHPIX_APP_ID;
  const mathpixAppKey = process.env.MATHPIX_APP_KEY;

  if (!mathpixAppId || !mathpixAppKey || mathpixAppId === 'your_mathpix_app_id_here') {
    console.error('Mathpix credentials not properly configured');
    throw new Error('Mathpix API credentials are not configured. Please add MATHPIX_APP_ID and MATHPIX_APP_KEY to your .env.local file');
  }

  // Convert file to base64
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString('base64');

  // Determine content type
  const contentType = file.type.startsWith('image/') ? 'image' : 'pdf';

  console.log('Calling Mathpix API for file type:', file.type);

  const requestBody = {
    src: `data:${file.type};base64,${base64}`,
    formats: ['text', 'latex_simplified'],
    data_options: {
      include_latex: true
    },
    // For PDFs, process all pages
    ...(contentType === 'pdf' && {
      conversion_formats: { 'pdf': ['text'] },
      include_pdf: true
    })
  };

  console.log('Mathpix request formats:', requestBody.formats);

  try {
    const response = await fetch('https://api.mathpix.com/v3/text', {
      method: 'POST',
      headers: {
        'app_id': mathpixAppId,
        'app_key': mathpixAppKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Mathpix API response status:', response.status);
    console.log('Mathpix API response headers:', response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mathpix API error:', response.status, errorText);

      if (response.status === 401) {
        throw new Error('Invalid Mathpix API credentials. Please check your MATHPIX_APP_ID and MATHPIX_APP_KEY.');
      } else if (response.status === 400) {
        throw new Error(`Mathpix API bad request: ${errorText}`);
      } else if (response.status === 429) {
        throw new Error('Mathpix API rate limit exceeded. Please try again later.');
      }

      throw new Error(`Mathpix API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log('Mathpix API response received');
    console.log('Result keys:', Object.keys(result));
    console.log('Full result structure:', JSON.stringify(result, null, 2).substring(0, 500));

    // Extract text from result - handle all possible response formats
    let extractedText = '';

    // Check various possible fields in order of preference
    if (result.text) {
      extractedText = result.text;
      console.log('Extracted from result.text, length:', extractedText.length);
    } else if (result.latex_simplified) {
      extractedText = result.latex_simplified;
      console.log('Extracted from result.latex_simplified, length:', extractedText.length);
    } else if (result.latex) {
      extractedText = result.latex;
      console.log('Extracted from result.latex, length:', extractedText.length);
    } else if (result.data) {
      if (Array.isArray(result.data)) {
        // For PDFs with multiple pages
        interface PageData {
          text?: string;
          latex?: string;
          latex_simplified?: string;
        }
        extractedText = result.data
          .map((page: PageData) => page.text || page.latex || page.latex_simplified || '')
          .filter((text: string) => text.length > 0)
          .join('\n');
        console.log('Extracted from result.data array, length:', extractedText.length);
      } else if (typeof result.data === 'object' && result.data.text) {
        extractedText = result.data.text;
        console.log('Extracted from result.data.text, length:', extractedText.length);
      }
    } else if (result.result) {
      // Some Mathpix responses wrap the content in a result field
      if (typeof result.result === 'string') {
        extractedText = result.result;
        console.log('Extracted from result.result string, length:', extractedText.length);
      } else if (result.result.text) {
        extractedText = result.result.text;
        console.log('Extracted from result.result.text, length:', extractedText.length);
      }
    }

    // If still no text, log the entire response structure for debugging
    if (!extractedText || extractedText.length < 10) {
      console.log('Unable to extract sufficient text from Mathpix response');
      console.log('Full response (first 1000 chars):', JSON.stringify(result).substring(0, 1000));
    }

    return extractedText || '';
  } catch (error) {
    console.error('Error calling Mathpix API:', error);
    throw error;
  }
}

/**
 * Identify relevant calculus topics from extracted text using Azure OpenAI
 */
async function identifyTopics(text: string): Promise<number[]> {
  try {
    // Fetch all available topics from database
    const { data: topics, error } = await supabase
      .from('topics')
      .select('id, main_topics, subtopics, course')
      .order('id');

    if (error || !topics) {
      console.error('Error fetching topics:', error);
      return [];
    }

    // Create a formatted list of topics for the prompt
    const topicsList = topics.map(t =>
      `${t.id}. ${t.main_topics} - ${t.subtopics} (${t.course})`
    ).join('\n');

    // Call Azure OpenAI to identify relevant topics
    const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_CHAT_DEPLOYMENT}/chat/completions?api-version=2024-06-01`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_API_KEY
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are a calculus expert. Analyze the given mathematical content and identify which topics from the provided list are most relevant. Return only the topic IDs as a JSON array of numbers.'
          },
          {
            role: 'user',
            content: `Analyze this mathematical content and identify the most relevant topics (return up to 5 topic IDs):

Content to analyze:
"${text.substring(0, 3000)}"

Available topics:
${topicsList}

Return only a JSON array of topic IDs, like [1, 4, 11]. Include only topics that are directly relevant to the content.`
          }
        ],
        temperature: 0.3,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Azure OpenAI API error:', error);
      return [];
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse the JSON array from the response
    try {
      const topicIds = JSON.parse(content);
      if (Array.isArray(topicIds)) {
        // Filter to ensure valid topic IDs
        return topicIds.filter(id =>
          typeof id === 'number' &&
          id >= 1 &&
          id <= topics.length
        );
      }
    } catch (parseError) {
      console.error('Error parsing topic IDs:', parseError);
    }

    return [];
  } catch (error) {
    console.error('Error identifying topics:', error);
    return [];
  }
}

/**
 * Generate embedding for text using Azure OpenAI text-embedding-3-large
 * Uses 1536 dimensions for optimal quality while staying within pgvector limits
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_EMBEDDING_DEPLOYMENT}/embeddings?api-version=2024-06-01`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_API_KEY
      },
      body: JSON.stringify({
        input: text,
        dimensions: 1536  // Use 1536 dimensions (reduced from full 3072)
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Azure OpenAI API error: ${error}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.some(type => file.type.startsWith(type.split('/')[0]))) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a PDF or image file.' },
        { status: 400 }
      );
    }

    // Step 1: Extract text from the uploaded file
    console.log('Extracting text from file...');
    let extractedText = '';

    try {
      extractedText = await extractTextWithMathpix(file);
    } catch (error) {
      console.error('Mathpix extraction failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to extract text from file';

      // Check if it's a credentials issue
      if (errorMessage.includes('credentials')) {
        return NextResponse.json(
          { error: 'Mathpix API is not configured. Please contact the administrator to set up text extraction.' },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

    if (!extractedText || extractedText.trim().length < 10) {
      return NextResponse.json(
        { error: 'Could not extract enough text from the file. Please upload a clearer image or PDF.' },
        { status: 400 }
      );
    }

    // Step 2: Identify topics from the extracted text
    console.log('Identifying topics...');
    const identifiedTopicIds = await identifyTopics(extractedText);

    // Fetch topic details for the identified topics
    interface Topic {
      id: number;
      main_topics: string;
      subtopics: string;
      course: string;
    }

    let identifiedTopics: Topic[] = [];
    if (identifiedTopicIds.length > 0) {
      const { data: topicDetails } = await supabase
        .from('topics')
        .select('id, main_topics, subtopics, course')
        .in('id', identifiedTopicIds)
        .order('id');

      if (topicDetails) {
        identifiedTopics = topicDetails;
      }
    }

    // Step 3: Generate embedding for the extracted text
    console.log('Generating embedding...');
    const embedding = await generateEmbedding(extractedText);

    // Step 4: Find similar problems using the RPC function (new function with new column)
    console.log('Finding similar problems...');
    const { data: recommendations, error } = await supabase.rpc(
      'find_similar_problems_new',
      {
        query_embedding: embedding,  // Pass as array directly, Supabase will handle conversion
        difficulty_filter: ['easy', 'medium'],
        exclude_user_id: userId || null,
        match_limit: 3
      }
    );

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to find similar problems' },
        { status: 500 }
      );
    }

    // Step 4: If problems have subproblems, fetch them
    interface ProblemResult {
      id: string;  // UUID from database, but Supabase client converts to string
      problem_text: string;
      difficulty: string;
      similarity: number;
      has_subproblems: boolean;
    }

    const problemsWithSubproblems = await Promise.all(
      (recommendations || []).map(async (problem: ProblemResult) => {
        if (problem.has_subproblems) {
          const { data: subproblems } = await supabase
            .from('subproblems')
            .select('id, key, problem_text, solution_text')
            .eq('problem_id', problem.id)
            .order('key');

          return {
            ...problem,
            subproblems: subproblems || []
          };
        }
        return problem;
      })
    );

    // Return recommendations with metadata
    return NextResponse.json({
      success: true,
      recommendations: problemsWithSubproblems,
      identifiedTopics: identifiedTopics,
      uploadSummary: extractedText.substring(0, 200) + '...',
      extractedLength: extractedText.length,
      message: problemsWithSubproblems.length > 0
        ? `Found ${problemsWithSubproblems.length} similar problems`
        : 'No similar problems found. Try uploading more specific content.'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}