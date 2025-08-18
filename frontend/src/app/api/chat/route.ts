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

// Simplified system prompt for speed
const MATH_SYSTEM_PROMPT = `You are a math tutor helping with calculus. Be clear, concise, and helpful. Break down problems step-by-step.`;

const PROBLEM_CONTEXT_PROMPT = (problem: ChatRequest['currentProblem'], subproblems?: ChatRequest['subproblems']) => {
  if (!problem) return '';
  
  // Simplified context for speed
  let contextPrompt = `\nProblem: ${problem.problem_text?.substring(0, 500) || ''}`;
  
  if (subproblems && subproblems.length > 0) {
    contextPrompt += '\nParts: ' + subproblems.map(s => s.key).join(', ');
  }
  
  return contextPrompt;
};

// Use Node runtime for better compatibility with Google AI SDK
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    
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

    if (!message || !model) {
      return NextResponse.json(
        { error: 'Message and model are required' },
        { status: 400 }
      );
    }


    // Prepare system prompt with problem context if available
    const systemPrompt = currentProblem 
      ? MATH_SYSTEM_PROMPT + '\n\n' + PROBLEM_CONTEXT_PROMPT(currentProblem, subproblems)
      : MATH_SYSTEM_PROMPT;


    switch (model) {
      case 'gemini-2.5-flash':
      case 'gemini-2.5-pro':
            return await handleGeminiRequest(message, conversationHistory, systemPrompt, model, image);
      
      case 'gpt-4o-mini':
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
    
    // Map frontend model names to Gemini API model names
    const geminiModelMap: Record<string, string> = {
      'gemini-2.5-flash': 'gemini-2.5-flash',  // Using standard model name
      'gemini-2.5-pro': 'gemini-2.5-pro'
    };
    
    const geminiModel = geminiModelMap[modelName] || 'gemini-2.5-flash';
    
    // Get the generative model
    const model = genAI.getGenerativeModel({ 
      model: geminiModel,
      generationConfig: {
        temperature: 0.7,
        topK: 1,  // Minimum for fastest generation
        topP: 0.8,
        maxOutputTokens: modelName === 'gemini-2.5-pro' ? 4096 : 2048, // Balanced token limits
        candidateCount: 1,
      }
    });

    // Build minimal context for speed
    const contextMessages = conversationHistory
      .slice(-2) // Only last 2 messages for minimum latency
      .map(msg => `${msg.role === 'user' ? 'Student' : 'Tutor'}: ${msg.content.substring(0, 200)}`)
      .join('\n');

    // Minimal prompt for speed
    const fullPrompt = contextMessages 
      ? `${systemPrompt}\n\nRecent:\n${contextMessages}\n\nStudent: ${message}\nTutor:`
      : `${systemPrompt}\n\nStudent: ${message}\nTutor:`;

    // Prepare the content for the SDK
    let contents;
    
    // Add image if provided
    if (image) {
      // Remove data:image/jpeg;base64, or similar prefix
      const base64Data = image.replace(/^data:image\/[^;]+;base64,/, '');
      const mimeType = image.match(/^data:image\/([^;]+)/)?.[1] ? `image/${image.match(/^data:image\/([^;]+)/)?.[1]}` : 'image/jpeg';
      
      contents = [
        { text: fullPrompt },
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        }
      ];
    } else {
      // For simple text, we can pass just the string
      contents = fullPrompt;
    }

    // Generate content stream
    const result = await model.generateContentStream(contents);
    
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
        'X-Accel-Buffering': 'no', // Disable proxy buffering for immediate streaming
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
      'gpt-4o-mini': 'gpt-4o-mini',
    };

    const openaiModel = modelMap[model] || 'gpt-4o-mini';
    console.log('Using OpenAI model:', openaiModel);

    // Build messages array for OpenAI with proper types
    const messages: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
    }> = [
      { role: 'system', content: systemPrompt }
    ];

    // Minimal history for speed
    const recentHistory = conversationHistory.slice(-2);
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
        max_completion_tokens: 4000, // Proper response length
        stream: true,
        temperature: 0.7,
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
          'X-Accel-Buffering': 'no', // Disable proxy buffering for immediate streaming
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
          max_completion_tokens: 4000, // Proper response length
          stream: false,
          temperature: 0.7,
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
    
    // More specific error handling for OpenAI
    if (error?.status === 401) {
      throw new Error('OpenAI API key is invalid or expired');
    } else if (error?.status === 403) {
      throw new Error('Access denied - API key may not have model access');
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