import { NextRequest, NextResponse } from 'next/server';
import AnthropicBedrock from '@anthropic-ai/bedrock-sdk';

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
{"isCorrect": true/false, "confidence": 0.0-1.0, "feedback": "short text"}`;

export async function POST(req: NextRequest) {
  try {
    // Check for AWS credentials
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return NextResponse.json(
        { error: 'AWS credentials not configured' },
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

    const client = new AnthropicBedrock({
      awsRegion: process.env.AWS_REGION || 'us-east-1',
    });

    // Build the grading query
    const query = problemText
      ? `Problem: ${problemText}

Correct Answer: ${correctAnswer}
Student Answer: ${userAnswer}

Grade the student's answer.`
      : `Correct Answer: ${correctAnswer}
Student Answer: ${userAnswer}

Grade the student's answer.`;

    // Get grading result from Claude Haiku
    const completion = await client.messages.create({
      model: 'anthropic.claude-haiku-4-5-20251001-v1:0',
      system: GRADING_PROMPT,
      messages: [
        { role: 'user', content: query }
      ],
      max_tokens: 2000,
    });

    const response = completion.content[0].type === 'text' ? completion.content[0].text : null;

    if (!response) {
      console.error('No response content from Claude');
      throw new Error('No response from Claude');
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
      if (error.message.includes('credentials') || error.message.includes('security token')) {
        return NextResponse.json(
          { error: 'Invalid AWS credentials' },
          { status: 401 }
        );
      } else if (error.message.includes('AccessDeniedException')) {
        return NextResponse.json(
          { error: 'Access denied - check AWS IAM permissions' },
          { status: 403 }
        );
      } else if (error.message.includes('throttl') || error.message.includes('rate')) {
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
