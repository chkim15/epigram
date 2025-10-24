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
// Using GPT-5-chat for better accuracy with mathematical content
const AZURE_OPENAI_CHAT_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT_NAME_GPT5 || 'gpt-5-chat';

// Note: PDF to image conversion is handled client-side in the RecommendedPractice component
// This approach works perfectly in serverless environments and provides better user experience

/**
 * Extract text from image using GPT-5-chat vision capabilities
 * For images: Direct processing with GPT-5 vision
 * Using temperature=0 for deterministic and consistent results
 */
async function extractTextWithGPT5Vision(file: File): Promise<string> {
  try {
    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');

    // Determine MIME type
    const mimeType = file.type || 'image/png';

    console.log('Using GPT-5 vision to extract text from:', mimeType);

    const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_CHAT_DEPLOYMENT}/chat/completions?api-version=2024-06-01`;

    // Create the proper data URL with base64 encoding
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const extractionPrompt = 'Extract all mathematical content from this image. Include all text, equations, problem statements, and mathematical expressions. Use LaTeX notation for math. If there are multiple problems, clearly separate them.';

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
            content: 'You are an expert at extracting mathematical content from documents. Extract ALL text, equations, and mathematical expressions. Preserve LaTeX formatting for equations. Focus on the mathematical content and problem statements.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: extractionPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl,
                  detail: 'high' // Use high detail for better mathematical content extraction
                }
              }
            ]
          }
        ],
        max_tokens: 4000,
        temperature: 0
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('GPT-5 Vision API error:', error);

      // Parse error to provide better feedback
      try {
        const errorObj = JSON.parse(error);
        if (errorObj.error?.message) {
          // Check if it's a PDF-specific issue
          if (mimeType === 'application/pdf' && (errorObj.error.message.includes('image') || errorObj.error.message.includes('URL'))) {
            throw new Error('PDF processing failed. The GPT-5 vision API may not support this PDF format. Please try converting to an image (PNG/JPEG) or using a different PDF.');
          }
          throw new Error(`Failed to extract text: ${errorObj.error.message}`);
        }
      } catch {
        // If not JSON, use raw error
      }

      throw new Error(`Failed to extract text: ${error}`);
    }

    const data = await response.json();
    const extractedText = data.choices[0].message.content;

    if (!extractedText || extractedText.trim().length < 10) {
      throw new Error('Could not extract enough text from the file');
    }

    console.log('Successfully extracted text using GPT-5 vision, length:', extractedText.length);
    return extractedText;

  } catch (error) {
    console.error('Error extracting text with GPT-5 vision:', error);
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
        max_tokens: 150,
        temperature: 0
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
 * Select similar problems using LLM to analyze content and problem similarity
 */
async function selectSimilarProblemsWithLLM(
  uploadedContent: string,
  candidateProblems: Array<{
    id: string;
    problem_text: string;
    solution_text: string | null;
    difficulty: string;
    document_id: string;
  }>
): Promise<string[]> {
  try {
    // Limit uploaded content to 10000 chars for optimal token usage
    const contentExcerpt = uploadedContent.substring(0, 10000);

    // Format problems with solution context for LLM analysis
    const formattedProblems = candidateProblems.map(p => {
      const solutionContext = p.solution_text
        ? p.solution_text.substring(0, 250) + '...'
        : 'No solution available';

      return `ID: ${p.id}
Problem: ${p.problem_text}
Context: ${solutionContext}`;
    }).join('\n\n');

    // Call Azure OpenAI GPT-5 to select best matching problems
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
            content: 'You are a calculus tutor finding practice problems similar to study materials. Analyze problems and their solution context to find the best matches.'
          },
          {
            role: 'user',
            content: `A student uploaded this study material:
"${contentExcerpt}"

Find problems that are most similar and would be good practice for this material.

Available problems:
${formattedProblems}

Select exactly 5 problems that best match the uploaded material.
Consider:
1. Conceptual similarity to the uploaded content
2. Problems covering the same mathematical topics
3. Appropriate difficulty progression (start with easier ones)

Return ONLY a JSON object with the format: {"selected": ["problem_id_1", "problem_id_2", "problem_id_3", "problem_id_4", "problem_id_5"]}`
          }
        ],
        max_tokens: 200,
        temperature: 0
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Azure OpenAI API error:', error);
      throw new Error(`LLM API error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse the JSON response
    try {
      const result = JSON.parse(content);
      if (result.selected && Array.isArray(result.selected)) {
        // Validate that selected IDs exist in candidate problems
        const validIds = new Set(candidateProblems.map(p => p.id));
        const selectedIds = result.selected.filter((id: string) => validIds.has(id));

        // Ensure we have exactly 5 problems (or less if not enough candidates)
        return selectedIds.slice(0, 5);
      }
    } catch (parseError) {
      console.error('Error parsing LLM response:', parseError);
      throw new Error('Failed to parse LLM response');
    }

    return [];
  } catch (error) {
    console.error('Error in LLM problem selection:', error);
    throw error;
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
    const userId = formData.get('userId') as string;
    const isPDF = formData.get('isPDF') === 'true';

    let extractedText = '';
    let pageCount = 0;

    // Handle PDF text extraction (client-side extracted)
    if (isPDF) {
      extractedText = formData.get('extractedText') as string;

      if (!extractedText || extractedText.trim().length < 10) {
        return NextResponse.json({
          success: false,
          error: 'Could not extract enough text from PDF',
          recommendations: []
        }, { status: 400 });
      }

      // Count pages from text markers
      pageCount = (extractedText.match(/--- Page \d+ ---/g) || []).length;
      console.log(`Received extracted text from PDF, length: ${extractedText.length}, pages: ${pageCount}`);
    } else {
      // Handle image file - use GPT-5 vision
      const file = formData.get('file') as File;
      if (!file) {
        return NextResponse.json(
          { error: 'No file uploaded' },
          { status: 400 }
        );
      }

      // Validate file type
      const validImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!validImageTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.name}. Please upload an image file (PNG, JPEG, or WebP).` },
          { status: 400 }
        );
      }

      pageCount = 1;
      console.log(`Processing single image file: ${file.name}...`);

      try {
        extractedText = await extractTextWithGPT5Vision(file);
        console.log(`Successfully extracted text from image, length: ${extractedText.length}`);
      } catch (error) {
        console.error('Text extraction failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to extract text from file';

        // Check if it's a credentials issue
        if (errorMessage.includes('credentials')) {
          return NextResponse.json(
            { error: 'API credentials are not configured. Please contact the administrator.' },
            { status: 503 }
          );
        }

        return NextResponse.json(
          { error: errorMessage },
          { status: 500 }
        );
      }
    }

    // Validate extracted text
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

    // Step 3: Fetch all problems from identified topics with their solutions
    console.log('Fetching problems from identified topics...');

    interface CandidateProblem {
      id: string;
      problem_text: string;
      difficulty: string;
      document_id: string;
      solution_text: string | null;
    }

    let candidateProblems: CandidateProblem[] = [];

    if (identifiedTopicIds.length > 0) {
      // Fetch problems from identified topics with their solutions
      const { data: problemsData, error: fetchError } = await supabase
        .from('problem_topics')
        .select(`
          problem_id,
          problems!inner (
            id,
            problem_text,
            difficulty,
            document_id,
            solution_text
          )
        `)
        .in('topic_id', identifiedTopicIds)
        .in('problems.difficulty', ['easy', 'medium'])
        .eq('problems.included', true);

      if (fetchError) {
        console.error('Error fetching problems:', fetchError);
        // Fall back to all easy/medium problems if topic fetch fails
        const { data: fallbackData } = await supabase
          .from('problems')
          .select('id, problem_text, difficulty, document_id, solution_text')
          .in('difficulty', ['easy', 'medium'])
          .eq('included', true)
          .limit(50);

        candidateProblems = fallbackData || [];
      } else {
        // Extract the problems from the join result and deduplicate
        // A problem can appear multiple times if it has multiple matching topics
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const problemsFromJoin = (problemsData as any[])?.map(item => item.problems) || [];

        // Deduplicate problems by ID
        const uniqueProblemsMap = new Map();
        problemsFromJoin.forEach(problem => {
          if (!uniqueProblemsMap.has(problem.id)) {
            uniqueProblemsMap.set(problem.id, problem);
          }
        });
        candidateProblems = Array.from(uniqueProblemsMap.values());
      }

      // Also fetch solutions from the solutions table for problems that don't have inline solutions
      const problemIds = candidateProblems.map(p => p.id);
      const { data: solutionsData } = await supabase
        .from('solutions')
        .select('problem_id, solution_text')
        .in('problem_id', problemIds);

      // Merge solutions from solutions table with problems
      if (solutionsData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const solutionMap = new Map((solutionsData as any[]).map(s => [s.problem_id, s.solution_text]));
        candidateProblems = candidateProblems.map(p => ({
          ...p,
          solution_text: p.solution_text || solutionMap.get(p.id) || null
        }));
      }
    } else {
      // If no topics identified, fall back to random easy/medium problems
      const { data: fallbackData } = await supabase
        .from('problems')
        .select('id, problem_text, difficulty, document_id, solution_text')
        .in('difficulty', ['easy', 'medium'])
        .eq('included', true)
        .limit(30);

      candidateProblems = fallbackData || [];
    }

    console.log(`Found ${candidateProblems.length} candidate problems from topics`);

    // Step 4: Use LLM to select the most similar problems
    console.log('Using LLM to select similar problems...');

    let selectedProblemIds: string[] = [];

    try {
      selectedProblemIds = await selectSimilarProblemsWithLLM(extractedText, candidateProblems);
      console.log(`LLM selected ${selectedProblemIds.length} problems`);
    } catch (llmError) {
      console.error('LLM selection failed, falling back to embedding search:', llmError);

      // Fallback to embedding-based search if LLM fails
      const embedding = await generateEmbedding(extractedText);
      const { data: recommendations, error } = await supabase.rpc(
        'find_similar_problems_new',
        {
          query_embedding: embedding,
          difficulty_filter: ['easy', 'medium'],
          exclude_user_id: userId || null,
          match_limit: 5
        }
      );

      if (error || !recommendations) {
        return NextResponse.json(
          { error: 'Failed to find similar problems' },
          { status: 500 }
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      selectedProblemIds = (recommendations as any[]).map(r => r.id);
    }

    // Get the selected problems with full details, maintaining order and avoiding duplicates
    const uniqueSelectedIds = [...new Set(selectedProblemIds)]; // Remove duplicate IDs
    const recommendations = uniqueSelectedIds
      .map(id => candidateProblems.find(p => p.id === id))
      .filter((p): p is NonNullable<typeof p> => p !== undefined); // Type-safe filter

    // Step 5: Fetch all subproblems for all recommendations in a single query
    const problemIds = recommendations.map(p => p.id);
    const { data: allSubproblems } = await supabase
      .from('subproblems')
      .select('problem_id, id, key, problem_text, solution_text')
      .in('problem_id', problemIds)
      .order('problem_id, key');

    // Group subproblems by problem_id
    const subproblemsByProblemId = new Map();
    if (allSubproblems) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (allSubproblems as any[]).forEach(sub => {
        if (!subproblemsByProblemId.has(sub.problem_id)) {
          subproblemsByProblemId.set(sub.problem_id, []);
        }
        subproblemsByProblemId.get(sub.problem_id).push(sub);
      });
    }

    // Map problems with their subproblems
    const problemsWithSubproblems = recommendations.map(problem => {
      const subproblems = subproblemsByProblemId.get(problem.id) || [];
      return {
        ...problem,
        has_subproblems: subproblems.length > 0,
        subproblems: subproblems
      };
    });

    // Return recommendations with metadata
    const responseMessage = problemsWithSubproblems.length > 0
      ? `Found ${problemsWithSubproblems.length} similar problems${pageCount > 1 ? ` from ${pageCount} pages` : ''}`
      : 'No similar problems found. Try uploading more specific content.';

    return NextResponse.json({
      success: true,
      recommendations: problemsWithSubproblems,
      identifiedTopics: identifiedTopics,
      uploadSummary: extractedText.substring(0, 200) + '...',
      extractedLength: extractedText.length,
      pageCount: pageCount > 1 ? pageCount : undefined,
      message: responseMessage
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}