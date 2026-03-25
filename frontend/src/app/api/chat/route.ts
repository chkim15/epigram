import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

// Initialize AI clients
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

// Configure OpenAI client - supports both Azure and regular OpenAI
let openai: OpenAI | null = null;


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
  solutions?: Array<{
    id: string;
    solution_text: string;
    solution_order: number;
  }>;
  subproblemSolutions?: {
    [key: string]: Array<{
      id: string;
      solution_text: string;
      solution_order: number;
    }>;
  };
  image?: string; // Base64 image data
}

// System prompt with emphasis on active learning
const MATH_SYSTEM_PROMPT = `You are an AI math tutor facilitating active learning. Your role is not just to provide answers, but to guide students through reasoning, problem-solving, and self-discovery.

Core Principles:
• Active Engagement – Prompt students to explain their reasoning, test ideas, and critique their own solutions, rather than passively receiving answers.
• Scaffolded Support – When students are stuck, break problems into smaller subproblems, remind them of definitions, or suggest general problem-solving tactics (e.g., try numbers, simplify assumptions, check special cases).
• Socratic Questioning – Respond with clarifying or leading questions instead of giving away solutions immediately (e.g., "What happens if you plug in x=0?", "How does this connect to the Chain Rule?").
• Small Steps to Big Ideas – Encourage connections across concepts, highlighting how each problem relates to core knowledge points (e.g. limits, derivatives, integrals, problem-solving techniques).
• Feedback with Growth in Mind – Praise partial progress, identify misconceptions gently, and encourage students to refine their own reasoning.
• Promote Reflection – Ask students to summarize in their own words, or compare multiple approaches.
• Keep Explanations Clear, Concise, and Helpful – Avoid overloading with unnecessary detail. Provide just enough guidance to help the student move forward independently.

Please follow the pacing rules strictly:
• Ask only one follow-up question at a time—focused on what is most necessary for solving the problem—and wait for the student's response before continuing.
• Ask at most two follow-up questions. After that, provide the complete step-by-step solution/explanation towards the final answer.`;

const PROBLEM_CONTEXT_PROMPT = (
  problem: ChatRequest['currentProblem'],
  subproblems?: ChatRequest['subproblems'],
  solutions?: ChatRequest['solutions'],
  subproblemSolutions?: ChatRequest['subproblemSolutions']
) => {
  if (!problem) return '';

  let contextPrompt = `\nCurrent Problem: ${problem.problem_text || ''}`;

  // Add subproblems if available
  if (subproblems && subproblems.length > 0) {
    contextPrompt += '\n\nSubproblems:';
    subproblems.forEach(sp => {
      contextPrompt += `\n${sp.key}) ${sp.problem_text}`;
    });
  }

  // Add solutions if available
  if (solutions && solutions.length > 0) {
    contextPrompt += '\n\nCorrect Solution(s):';
    solutions.forEach((sol, idx) => {
      contextPrompt += `\n${solutions.length > 1 ? `Solution ${idx + 1}: ` : ''}${sol.solution_text}`;
    });
  }

  // Add subproblem solutions if available
  if (subproblemSolutions && Object.keys(subproblemSolutions).length > 0) {
    contextPrompt += '\n\nSubproblem Solutions:';
    Object.entries(subproblemSolutions).forEach(([key, sols]) => {
      if (sols && sols.length > 0) {
        contextPrompt += `\n${key}) `;
        sols.forEach((sol, idx) => {
          contextPrompt += `${sols.length > 1 ? `[Solution ${idx + 1}] ` : ''}${sol.solution_text} `;
        });
      }
    });
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

    if (!process.env.AZURE_OPENAI_API_KEY && !process.env.OPENAI_API_KEY) {
      console.error('Neither AZURE_OPENAI_API_KEY nor OPENAI_API_KEY is set');
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const body: ChatRequest = await req.json();
    const { message, model, conversationHistory, currentProblem, subproblems, solutions, subproblemSolutions, image } = body;

    if (!message || !model) {
      return NextResponse.json(
        { error: 'Message and model are required' },
        { status: 400 }
      );
    }


    // Check if the message is asking for visual explanation
    const visualKeywords = /\b(plot|graph|visuali[sz]e|show\s+(me\s+)?visual|draw|chart|diagram|illustrate)\b/i;
    const isVisualRequest = visualKeywords.test(message);

    // Prepare system prompt with problem context if available
    let systemPrompt = currentProblem
      ? MATH_SYSTEM_PROMPT + '\n\n' + PROBLEM_CONTEXT_PROMPT(currentProblem, subproblems, solutions, subproblemSolutions)
      : MATH_SYSTEM_PROMPT;

    // Add graph generation instructions when visual request is detected
    if (isVisualRequest) {
      systemPrompt += `\n\nIMPORTANT: The user is asking for a visual explanation. Generate a graph by outputting VALID JSON with CALCULATED NUMERIC VALUES:

\`\`\`graph
{
  "type": "line",
  "data": [
    {"x": -5, "y": 10.5},
    {"x": -4, "y": 8.2},
    {"x": -3, "y": 6.1},
    {"x": -2, "y": 4.0},
    {"x": -1, "y": 2.3},
    {"x": 0, "y": 0.0},
    {"x": 1, "y": 2.3},
    {"x": 2, "y": 4.0},
    {"x": 3, "y": 6.1},
    {"x": 4, "y": 8.2},
    {"x": 5, "y": 10.5}
  ],
  "xAxis": {"label": "x"},
  "yAxis": {"label": "f(x)"},
  "title": "Function Plot"
}
\`\`\`

CRITICAL RULES:
- ALL values must be NUMBERS (like 5.2, -3.14), NOT expressions (NOT "2*Math.cos(x)")
- Calculate all values before putting them in JSON
- NO JavaScript expressions, NO formulas, ONLY decimal numbers
- Must be VALID JSON - no ellipsis (...), no comments
- Include 20-50 data points for smooth curves`;
    }


    switch (model) {
      case 'gemini-2.5-flash':
      case 'gemini-2.5-pro':
            return await handleGeminiRequest(message, conversationHistory, systemPrompt, model, image);

      case 'gpt-5':
      case 'gpt-5-mini':
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
    const apiKey = process.env.AZURE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    const isAzure = !!process.env.AZURE_OPENAI_API_KEY;

    // Configure Azure OpenAI client based on the model
    if (isAzure && process.env.AZURE_OPENAI_ENDPOINT) {
      // Determine which deployment to use based on the model
      let deploymentName: string;
      if (model === 'gpt-5') {
        deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME_GPT5 || 'gpt-5-chat';
      } else {
        deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-5-mini';
      }

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

    if (!openai) {
      throw new Error('Failed to initialize OpenAI client');
    }

    // Map our model names to OpenAI model names
    // For Azure, the model is determined by the deployment name in the URL
    const modelMap: Record<string, string> = {
      'gpt-5': 'gpt-5-chat',
      'gpt-5-mini': 'gpt-5-mini',
    };

    const openaiModel = modelMap[model] || 'gpt-5-mini';

    // Build messages array for OpenAI with proper types
    const messages: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
    }> = [
      { role: 'system', content: systemPrompt }
    ];

    // Include conversation history (last 30 messages)
    const recentHistory = conversationHistory.slice(-30);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      });
    }

    // Add current message with optional image
    if (image) {
      messages.push({
        role: 'user',
        content: [
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
        ]
      });
    } else {
      messages.push({
        role: 'user',
        content: message
      });
    }

    // Try streaming first, fallback to non-streaming if not available
    try {
      const stream = await openai.chat.completions.create({
        model: openaiModel,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messages: messages as any,
        max_completion_tokens: 4000,
        stream: true,
        // GPT-5 models may only support default temperature of 1
        ...(model !== 'gpt-5-mini' && model !== 'gpt-5' && { temperature: 0.7 }),
      });

      // Create a readable stream to send back to the client
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content || '';
              if (content) {
                const data = `data: ${JSON.stringify({ content })}\n\n`;
                controller.enqueue(encoder.encode(data));
              }
            }
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
          'X-Accel-Buffering': 'no',
        },
      });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (streamError: any) {
      // If streaming fails, fallback to non-streaming
      if (streamError?.message?.includes('stream') || streamError?.message?.includes('organization')) {
        console.log('Streaming not available, falling back to non-streaming...');

        const completion = await openai.chat.completions.create({
          model: openaiModel,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          messages: messages as any,
          max_completion_tokens: 4000,
          stream: false,
          ...(model !== 'gpt-5-mini' && model !== 'gpt-5' && { temperature: 0.7 }),
        });

        const responseContent = completion.choices[0]?.message?.content || 'No response generated';

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
        throw streamError;
      }
    }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('OpenAI API Error:', error);

    if (error?.status === 401) {
      throw new Error('OpenAI API key is invalid or expired');
    } else if (error?.status === 403) {
      throw new Error('Access denied - API key may not have model access');
    } else if (error?.status === 404) {
      throw new Error(`Model not found - check model name spelling: ${model}`);
    } else if (error?.status === 429) {
      throw new Error('OpenAI API rate limit exceeded or quota reached');
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
