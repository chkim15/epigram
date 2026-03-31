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

// Simplified prompt for grading
const GRADING_PROMPT = `Check if the student answer equals the correct answer mathematically. Return JSON only:
{"isCorrect": true/false, "confidence": 0.0-1.0, "feedback": "short text"}
When writing feedback, address the student directly using "you" (e.g. "Your answer..." or "You got...") instead of referring to them as "the student" or "student answer".`;

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

    // Get grading result from GPT-5-nano
    const completion = await openai.chat.completions.create({
      model: 'gpt-5-nano',
      messages: [
        { role: 'system', content: GRADING_PROMPT },
        { role: 'user', content: query }
      ],
      max_completion_tokens: 2000,
    });

    const message = completion.choices[0]?.message;
    const messageAsUnknown = message as unknown as { reasoning_content?: string; text?: string };
    const response = message?.content || messageAsUnknown?.reasoning_content || messageAsUnknown?.text;

    if (!response) {
      console.error('No response content from OpenAI');
      throw new Error('No response from OpenAI');
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
