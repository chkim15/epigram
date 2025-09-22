import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
let openai: OpenAI | null = null;

interface GradeRequest {
  userAnswer: string;
  correctAnswer: string;
  problemText?: string;
}

interface GradeResponse {
  isCorrect: boolean;
  confidence: number;
  feedback?: string;
  explanation?: string;
}

// Simplified prompt for GPT-5-nano (reasoning model)
const GRADING_PROMPT = `Check if the student answer equals the correct answer mathematically. Return JSON only:
{"isCorrect": true/false, "confidence": 0.0-1.0, "feedback": "short text"}`;

export async function POST(req: NextRequest) {
  try {
    // Check for API keys
    const apiKey = process.env.AZURE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    const isAzure = !!process.env.AZURE_OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const body: GradeRequest = await req.json();
    const { userAnswer, correctAnswer, problemText } = body;

    if (!userAnswer || !correctAnswer) {
      return NextResponse.json(
        { error: 'User answer and correct answer are required' },
        { status: 400 }
      );
    }

    // Configure OpenAI client for GPT-5-nano
    if (isAzure && process.env.AZURE_OPENAI_ENDPOINT) {
      // Use GPT-5-nano deployment
      const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME_GPT5_NANO || 'gpt-5-nano';
      const azureBaseURL = `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${deploymentName}`;

      openai = new OpenAI({
        apiKey: process.env.AZURE_OPENAI_API_KEY!,
        baseURL: azureBaseURL,
        defaultQuery: { 'api-version': '2025-04-01-preview' },
        defaultHeaders: {
          'api-key': process.env.AZURE_OPENAI_API_KEY!,
        },
      });
    } else if (process.env.OPENAI_API_KEY) {
      // Regular OpenAI configuration
      openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    } else {
      throw new Error('No OpenAI API key configured');
    }

    // Build the grading query
    const query = problemText
      ? `Problem: ${problemText}

Correct Answer: ${correctAnswer}
Student Answer: ${userAnswer}

Grade the student's answer.`
      : `Correct Answer: ${correctAnswer}
Student Answer: ${userAnswer}

Grade the student's answer.`;

    // Prepare messages for OpenAI
    const messages: Array<{
      role: 'system' | 'user';
      content: string;
    }> = [
      { role: 'system', content: GRADING_PROMPT },
      { role: 'user', content: query }
    ];

    // Get grading result from GPT-5-nano
    console.log('Calling OpenAI with:', {
      model: isAzure ? 'gpt-5-nano' : 'gpt-5-nano',
      deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME_GPT5_NANO,
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      messageCount: messages.length
    });

    // For Azure, the model parameter is ignored (deployment name in URL is used)
    // But we still need to pass something
    const completion = await openai.chat.completions.create({
      model: 'gpt-5-nano', // This is ignored by Azure, but required by the API
      messages: messages,
      // temperature: 0, // GPT-5-nano doesn't support temperature parameter
      max_completion_tokens: 2000, // Much higher limit for reasoning model
      // response_format: { type: 'json_object' }, // Try without forcing JSON for GPT-5-nano
    });

    console.log('OpenAI response:', JSON.stringify(completion, null, 2));
    console.log('Message object:', completion.choices[0]?.message);

    // Check for reasoning content in different fields
    const message = completion.choices[0]?.message;
    // Use unknown instead of any for better type safety
    const messageAsUnknown = message as unknown as { reasoning_content?: string; text?: string };
    const response = message?.content || messageAsUnknown?.reasoning_content || messageAsUnknown?.text;

    // Log all message properties to debug
    if (message) {
      console.log('All message properties:', Object.keys(message));
      console.log('Full message details:', JSON.stringify(message, null, 2));
    }

    if (!response) {
      console.error('No response content. Message:', completion.choices[0]?.message);
      console.error('Finish reason:', completion.choices[0]?.finish_reason);

      // If finish_reason is 'length', we need more tokens
      if (completion.choices[0]?.finish_reason === 'length') {
        console.error('Model hit token limit. Need to increase max_completion_tokens.');
      }

      throw new Error('No response from OpenAI - model may need different configuration');
    }

    try {
      // Parse the JSON response
      const gradeResult: GradeResponse = JSON.parse(response);

      // Validate response structure
      if (typeof gradeResult.isCorrect !== 'boolean' ||
          typeof gradeResult.confidence !== 'number') {
        throw new Error('Invalid response format from AI');
      }

      return NextResponse.json(gradeResult);

    } catch (parseError) {
      console.error('Failed to parse AI response:', response);
      console.error('Parse error:', parseError);

      // Fallback: try basic string matching if AI fails
      const isCorrect = userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();

      return NextResponse.json({
        isCorrect,
        confidence: 1.0,
        feedback: isCorrect ? 'Correct!' : 'Incorrect',
        explanation: 'Graded by exact match (fallback)'
      });
    }

  } catch (error) {
    console.error('Grading API Error:', error);

    // More specific error handling
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        return NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401 }
        );
      } else if (error.message.includes('404')) {
        return NextResponse.json(
          { error: 'GPT-5-nano model not found. Check deployment configuration.' },
          { status: 404 }
        );
      } else if (error.message.includes('429')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: `Grading error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Grading API is running' },
    { status: 200 }
  );
}