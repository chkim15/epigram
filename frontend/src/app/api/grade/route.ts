import { NextRequest, NextResponse } from 'next/server';
import { AnthropicBedrock } from '@anthropic-ai/bedrock-sdk';

// Use Node runtime — the Bedrock SDK / AWS SigV4 signing stack is not edge-compatible
export const runtime = 'nodejs';

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

// Claude may wrap JSON in prose or markdown fences even when told not to.
// Try increasingly lenient strategies; throw if none yield valid JSON.
function extractJson(text: string): unknown {
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    // fall through
  }

  // Strip a leading ```json / ``` fence and trailing ``` fence
  const unfenced = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  try {
    return JSON.parse(unfenced);
  } catch {
    // fall through
  }

  // Last resort: grab the first balanced-looking object
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    return JSON.parse(trimmed.slice(start, end + 1));
  }

  throw new Error('Could not extract JSON from model response');
}

export async function POST(req: NextRequest) {
  try {
    // Require AWS Bedrock credentials
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return NextResponse.json(
        { error: 'AWS Bedrock credentials not configured' },
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

    // Configure Claude Sonnet client on AWS Bedrock (global cross-region inference profile)
    const client = new AnthropicBedrock({
      awsRegion: process.env.AWS_REGION || 'us-east-1',
      awsAccessKey: process.env.AWS_ACCESS_KEY_ID,
      awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY,
    });
    const model = process.env.BEDROCK_GRADING_MODEL || 'global.anthropic.claude-sonnet-4-6';

    // Build the grading query
    const query = problemText
      ? `Problem: ${problemText}

Correct Answer: ${correctAnswer}
Student Answer: ${userAnswer}

Grade the student's answer.`
      : `Correct Answer: ${correctAnswer}
Student Answer: ${userAnswer}

Grade the student's answer.`;

    // Get grading result from Claude Sonnet (system prompt is a top-level field on the Messages API)
    const completion = await client.messages.create({
      model,
      max_tokens: 1024,
      system: GRADING_PROMPT,
      messages: [{ role: 'user', content: query }],
    });

    // Concatenate text content blocks
    let response = '';
    for (const block of completion.content) {
      if (block.type === 'text') {
        response += block.text;
      }
    }
    response = response.trim();

    if (!response) {
      console.error('No text content from Bedrock');
      throw new Error('No response from Bedrock');
    }

    try {
      // Parse the JSON response (robust to fences / surrounding prose)
      const gradeResult = extractJson(response) as GradeResponse;

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

    const status = (error as { status?: number })?.status;
    const name = (error as { name?: string })?.name;

    if (status === 403 || name === 'AccessDeniedException') {
      return NextResponse.json(
        { error: 'Bedrock access denied — submit the Anthropic use-case form and verify IAM allows bedrock:InvokeModel for this model' },
        { status: 403 }
      );
    } else if (status === 400 || name === 'ValidationException') {
      return NextResponse.json(
        { error: 'Invalid Bedrock model ID — ensure BEDROCK_GRADING_MODEL is the global inference profile (global.anthropic.claude-sonnet-4-6)' },
        { status: 400 }
      );
    } else if (status === 404 || name === 'ResourceNotFoundException') {
      return NextResponse.json(
        { error: 'Bedrock model not found in region — check BEDROCK_GRADING_MODEL and AWS_REGION' },
        { status: 404 }
      );
    } else if (status === 429 || name === 'ThrottlingException' || name === 'TooManyRequestsException') {
      return NextResponse.json(
        { error: 'Bedrock rate limit / throughput exceeded' },
        { status: 429 }
      );
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
