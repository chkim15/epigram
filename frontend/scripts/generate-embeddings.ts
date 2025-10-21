#!/usr/bin/env tsx

/**
 * Script to generate embeddings for all problems in the database
 * This includes combining subproblem text with the main problem for richer embeddings
 * Uses Azure OpenAI text-embedding-3-large model at 1536 dimensions
 *
 * Usage: npm run generate-embeddings
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for admin access
);

// Azure OpenAI configuration
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY!;
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT!;
const AZURE_OPENAI_EMBEDDING_DEPLOYMENT = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'text-embedding-3-large';

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
        dimensions: 1536  // Use 1536 dimensions (optimal for text-embedding-3-large)
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

/**
 * Combine problem text with subproblems for comprehensive embedding
 */
async function getProblemFullText(problemId: string): Promise<string> {
  // Get main problem
  const { data: problem, error: problemError } = await supabase
    .from('problems')
    .select('problem_text, solution_text')
    .eq('id', problemId)
    .single();

  if (problemError) {
    console.error(`Error fetching problem ${problemId}:`, problemError);
    return '';
  }

  // Get subproblems if they exist
  const { data: subproblems } = await supabase
    .from('subproblems')
    .select('key, problem_text, solution_text')
    .eq('problem_id', problemId)
    .order('key');

  // Combine all text
  let fullText = problem.problem_text || '';

  if (subproblems && subproblems.length > 0) {
    fullText += ' ' + subproblems
      .map(sp => `Part ${sp.key}: ${sp.problem_text} ${sp.solution_text || ''}`)
      .join(' ');
  }

  // Add solution text if available
  if (problem.solution_text) {
    fullText += ' Solution: ' + problem.solution_text;
  }

  return fullText.trim();
}

/**
 * Main function to generate embeddings for all problems
 */
async function generateAllEmbeddings() {
  console.log('Starting embedding generation process...');

  // Get all problems without embeddings (using new column)
  const { data: problems, error } = await supabase
    .from('problems')
    .select('id, problem_text')
    .is('embedding_new', null)
    .eq('included', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching problems:', error);
    return;
  }

  if (!problems || problems.length === 0) {
    console.log('No problems found without embeddings.');
    return;
  }

  console.log(`Found ${problems.length} problems without embeddings`);

  // Process in batches to avoid rate limits
  const batchSize = 5; // Small batch size to respect API limits
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < problems.length; i += batchSize) {
    const batch = problems.slice(i, i + batchSize);
    console.log(`\nProcessing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(problems.length/batchSize)}`);

    for (const problem of batch) {
      try {
        // Get full text including subproblems
        const fullText = await getProblemFullText(problem.id);

        if (!fullText) {
          console.log(`Skipping problem ${problem.id} - no text found`);
          continue;
        }

        // Generate embedding
        console.log(`Generating embedding for problem ${problem.id}...`);
        const embedding = await generateEmbedding(fullText);

        // Update database with embedding (using new column)
        const { error: updateError } = await supabase
          .from('problems')
          .update({
            embedding_new: `[${embedding.join(',')}]`,
            embedding_generated_at: new Date().toISOString()
          })
          .eq('id', problem.id);

        if (updateError) {
          console.error(`Error updating problem ${problem.id}:`, updateError);
          errorCount++;
        } else {
          console.log(`✓ Successfully generated embedding for problem ${problem.id}`);
          successCount++;
        }

      } catch (error) {
        console.error(`Error processing problem ${problem.id}:`, error);
        errorCount++;
      }

      // Small delay between API calls
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Longer delay between batches
    console.log(`Batch complete. Progress: ${successCount + errorCount}/${problems.length}`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n=================================');
  console.log('Embedding generation complete!');
  console.log(`Successfully generated: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log('=================================');
}

// Run the script
generateAllEmbeddings()
  .then(() => {
    console.log('Script finished');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });