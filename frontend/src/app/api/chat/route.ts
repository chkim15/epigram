import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

// Initialize AI clients
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Types
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
}

interface ChatRequest {
  message: string;
  model: string;
  conversationHistory: ChatMessage[];
  currentProblem?: {
    id: string;
    problem_text: string;
    solution_text?: string;
    difficulty?: string;
    topics?: unknown;
  };
  subproblems?: Array<{
    id: string;
    key: string;
    problem_text: string;
    solution_text?: string;
  }>;
  image?: string; // Base64 image data
}

// System prompts for math-focused conversations
const MATH_SYSTEM_PROMPT = `You are an expert mathematics tutor specializing in calculus and advanced mathematics. Your role is to:

1. Help students understand mathematical concepts clearly and intuitively
2. Break down complex problems into manageable steps
3. Provide clear explanations with logical reasoning
4. Use appropriate mathematical notation when helpful
5. Encourage mathematical thinking and problem-solving strategies
6. Be patient and supportive while maintaining academic rigor

When a student asks about a specific problem, analyze it thoroughly and provide step-by-step guidance. If they're stuck, offer hints rather than complete solutions to promote learning.

Keep responses concise but comprehensive, focusing on mathematical understanding rather than just getting the right answer.`;

const PROBLEM_CONTEXT_PROMPT = (problem: ChatRequest['currentProblem'], subproblems?: ChatRequest['subproblems']) => {
  if (!problem) return '';
  
  let contextPrompt = `
CURRENT PROBLEM BEING VIEWED:
${problem.problem_text ? `Problem: ${problem.problem_text}` : ''}`;

  // Add subproblems if they exist
  if (subproblems && subproblems.length > 0) {
    contextPrompt += '\n\nParts:';
    subproblems.forEach(sub => {
      contextPrompt += `\n${sub.key}. ${sub.problem_text || ''}`;
    });
  }

  contextPrompt += `
${problem.difficulty ? `\nDifficulty: ${problem.difficulty}` : ''}
${problem.topics ? `Topics: ${JSON.stringify(problem.topics)}` : ''}

IMPORTANT: The student is currently viewing this specific problem${subproblems && subproblems.length > 0 ? ' with multiple parts' : ''}. When they ask questions, they are likely referring to THIS problem unless they specify otherwise. You can reference specific parts of this problem directly in your explanations. If they ask about "this problem" or "the problem", they mean the one shown above.`;

  return contextPrompt;
};

export async function POST(req: NextRequest) {
  try {
    console.log('Chat API called');
    
    // Check environment variables
    if (!process.env.GOOGLE_API_KEY) {
      console.error('GOOGLE_API_KEY is not set');
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }
    
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not set');
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const body: ChatRequest = await req.json();
    const { message, model, conversationHistory, currentProblem, subproblems, image } = body;

    console.log('Request body parsed:', { message: message?.substring(0, 50), model });

    if (!message || !model) {
      return NextResponse.json(
        { error: 'Message and model are required' },
        { status: 400 }
      );
    }

    // Debug logging
    console.log('API received currentProblem:', currentProblem ? {
      id: currentProblem.id,
      problem_text: currentProblem.problem_text?.substring(0, 100) + '...',
      difficulty: currentProblem.difficulty
    } : null);
    console.log('API received subproblems:', subproblems?.length || 0);

    // Prepare system prompt with problem context if available
    const systemPrompt = currentProblem 
      ? MATH_SYSTEM_PROMPT + '\n\n' + PROBLEM_CONTEXT_PROMPT(currentProblem, subproblems)
      : MATH_SYSTEM_PROMPT;

    console.log('Model selected:', model);

    switch (model) {
      case 'gemini-2.5-flash':
      case 'gemini-2.5-pro':
        console.log('Calling Gemini API with model:', model);
        // Gemini now returns a streaming response
        return await handleGeminiRequest(message, conversationHistory, systemPrompt, model, image);
      
      case 'gpt-5-mini':
      case 'gpt-5-nano':
        console.log('Calling OpenAI API...');
        // OpenAI returns a streaming response (with fallback to non-streaming)
        return await handleOpenAIRequest(message, conversationHistory, systemPrompt, model, image);
      
      default:
        console.error('Invalid model:', model);
        return NextResponse.json(
          { error: 'Invalid model specified' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

async function handleGeminiRequest(
  message: string, 
  conversationHistory: ChatMessage[], 
  systemPrompt: string,
  modelName: string,
  image?: string
): Promise<Response> {
  try {
    console.log('Initializing Gemini model:', modelName);
    
    // Map frontend model names to Gemini API model names
    const geminiModelMap: Record<string, string> = {
      'gemini-2.5-flash': 'gemini-2.0-flash-exp',
      'gemini-2.5-pro': 'gemini-2.0-pro-exp'
    };
    
    const geminiModel = geminiModelMap[modelName] || 'gemini-2.0-flash-exp';
    console.log('Using Gemini API model:', geminiModel);
    
    const model = genAI.getGenerativeModel({ 
      model: geminiModel,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: modelName === 'gemini-2.5-pro' ? 4096 : 2048, // Pro gets more tokens
      }
    });

    // Build conversation context
    const contextMessages = conversationHistory
      .slice(-10) // Keep last 10 messages for context
      .map(msg => `${msg.role === 'user' ? 'Student' : 'Tutor'}: ${msg.content}`)
      .join('\n');

    const fullPrompt = `${systemPrompt}

${contextMessages ? `Previous conversation:\n${contextMessages}\n` : ''}

Student: ${message}

Tutor:`;

    // Prepare the content for Gemini - use proper types
    let contentParts;
    
    // Add image if provided
    if (image) {
      // Remove data:image/jpeg;base64, or similar prefix
      const base64Data = image.replace(/^data:image\/[^;]+;base64,/, '');
      contentParts = [
        { text: fullPrompt },
        {
          inlineData: {
            data: base64Data,
            mimeType: image.match(/^data:image\/([^;]+)/)?.[1] ? `image/${image.match(/^data:image\/([^;]+)/)?.[1]}` : 'image/jpeg'
          }
        }
      ];
    } else {
      contentParts = fullPrompt;
    }

    console.log('Sending streaming request to Gemini...');
    const result = await model.generateContentStream(contentParts);
    console.log('Gemini streaming started');
    
    // Create a readable stream to send back to the client
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
              // Send the content chunk as Server-Sent Events format
              const data = `data: ${JSON.stringify({ content: chunkText })}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
          }
          // Send final message to indicate stream is complete
          const endData = `data: ${JSON.stringify({ done: true })}\n\n`;
          controller.enqueue(encoder.encode(endData));
        } catch (error) {
          console.error('Gemini streaming error:', error);
          const errorData = `data: ${JSON.stringify({ error: 'Stream error occurred' })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/stream-event',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Gemini API Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    if (errorMessage.includes('API key')) {
      throw new Error('Invalid Gemini API key');
    } else if (errorMessage.includes('quota')) {
      throw new Error('Gemini API quota exceeded');
    } else if (errorMessage.includes('blocked')) {
      throw new Error('Request was blocked by Gemini safety filters');
    } else {
      throw new Error(`Gemini API error: ${errorMessage || 'Unknown error'}`);
    }
  }
}

async function handleOpenAIRequest(
  message: string,
  conversationHistory: ChatMessage[],
  systemPrompt: string,
  model: string,
  image?: string
): Promise<Response> {
  try {
    console.log('OpenAI API request starting...');
    console.log('API Key exists:', !!process.env.OPENAI_API_KEY);
    console.log('API Key length:', process.env.OPENAI_API_KEY?.length);
    
    // Map our model names to OpenAI model names
    const modelMap: Record<string, string> = {
      'gpt-5-mini': 'gpt-5-mini',
      'gpt-5-nano': 'gpt-5-nano',
    };

    const openaiModel = modelMap[model] || 'gpt-5-nano';
    console.log('Using OpenAI model:', openaiModel);

    // Build messages array for OpenAI with proper types
    const messages: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
    }> = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history (last 10 messages)
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      });
    }

    // Add current message with optional image
    const currentMessage: {
      role: 'user' | 'assistant';
      content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
    } = {
      role: 'user',
      content: message
    };
    
    // Add image if provided for GPT models
    if (image) {
      currentMessage.content = [
        {
          type: 'text',
          text: message
        },
        {
          type: 'image_url',
          image_url: {
            url: image
          }
        }
      ];
    }
    
    messages.push(currentMessage);

    console.log('Messages array length:', messages.length);
    console.log('System prompt length:', systemPrompt.length);
    console.log('Making OpenAI API call...');

    // Try streaming first, fallback to non-streaming if not available
    try {
      const stream = await openai.chat.completions.create({
        model: openaiModel,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messages: messages as any,
        max_completion_tokens: 4000,
        stream: true,
      });

      console.log('OpenAI streaming API call successful');
      
      // Create a readable stream to send back to the client
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content || '';
              if (content) {
                // Send the content chunk as Server-Sent Events format
                const data = `data: ${JSON.stringify({ content })}\n\n`;
                controller.enqueue(encoder.encode(data));
              }
            }
            // Send final message to indicate stream is complete
            const endData = `data: ${JSON.stringify({ done: true })}\n\n`;
            controller.enqueue(encoder.encode(endData));
          } catch (error) {
            console.error('Streaming error:', error);
            const errorData = `data: ${JSON.stringify({ error: 'Stream error occurred' })}\n\n`;
            controller.enqueue(encoder.encode(errorData));
          } finally {
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/stream-event',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (streamError: any) {
      // If streaming fails (e.g., organization not verified), fallback to non-streaming
      if (streamError?.message?.includes('stream') || streamError?.message?.includes('organization')) {
        console.log('Streaming not available, falling back to non-streaming...');
        
        const completion = await openai.chat.completions.create({
          model: openaiModel,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          messages: messages as any,
          max_completion_tokens: 4000,
          stream: false,
        });

        console.log('OpenAI non-streaming API call successful');
        const responseContent = completion.choices[0]?.message?.content || 'No response generated';
        
        // Return as regular JSON response
        return new Response(JSON.stringify({ 
          response: responseContent,
          model,
          timestamp: new Date().toISOString()
        }), {
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } else {
        // Re-throw other errors
        throw streamError;
      }
    }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    console.error('Error details:', {
      name: error?.name,
      message: error?.message,
      status: error?.status,
      code: error?.code,
      type: error?.type,
      param: error?.param,
      response: error?.response?.data,
      headers: error?.response?.headers
    });
    
    // More specific error handling for GPT-5
    if (error?.status === 401) {
      throw new Error('OpenAI API key is invalid or expired');
    } else if (error?.status === 403) {
      throw new Error('Access denied - API key may not have GPT-5 access');
    } else if (error?.status === 404) {
      throw new Error(`Model not found - check model name spelling: ${model}`);
    } else if (error?.status === 429) {
      throw new Error('OpenAI API rate limit exceeded or quota reached');
    } else if (error?.message?.includes('model')) {
      throw new Error(`Model error: ${error.message}`);
    } else {
      throw new Error(`OpenAI API error: ${error?.message || 'Unknown error'}`);
    }
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Chat API is running' },
    { status: 200 }
  );
}