import { getAgent } from '../src/lib/agent';
import { run } from '@openai/agents';
import type { ChatMessage } from '../src/types/agent';

// Vercel Edge Runtime configuration
export const config = {
  runtime: 'edge',
};

/**
 * POST /api/chat - Process chat messages with OpenAI Agent
 * Supports streaming responses using OpenAI Agents SDK
 */
export default async function handler(req: Request) {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // Handle GET requests for SSE streaming
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const message = url.searchParams.get('message');
    const stream = url.searchParams.get('stream') === 'true';

    // Validate required parameters for streaming
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Missing message parameter' }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    if (!stream) {
      return new Response(
        JSON.stringify({ error: 'GET requests only support streaming mode' }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // Continue with streaming logic using GET parameters
  } else if (req.method === 'POST') {
    // POST requests will be handled in the try block below
  } else {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }

  try {
    // Extract message parameters (either from GET query params or POST body)
    let message: string;
    let sessionId: string | undefined;
    let stream: boolean;

    if (req.method === 'GET') {
      const url = new URL(req.url);
      message = url.searchParams.get('message')!; // Already validated above
      sessionId = url.searchParams.get('sessionId') || undefined;
      stream = true; // GET requests are always streaming
    } else {
      // POST request - parse body
      const body = await req.json();
      ({ message, sessionId, stream = true } = body);
    }

    // Validate required fields
    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ 
          error: 'Message is required and must be a string',
          code: 'INVALID_INPUT'
        }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // Get the agent instance
    const agent = await getAgent();

        // Handle streaming vs non-streaming responses
    if (stream) {
      // Create a readable stream for Server-Sent Events (SSE)
      const encoder = new TextEncoder();
      
      // Helper function to format SSE messages
      const formatSSEMessage = (type: string, data: any, id?: string) => {
        let message = '';
        if (id) message += `id: ${id}\n`;
        message += `event: ${type}\n`;
        message += `data: ${JSON.stringify(data)}\n\n`;
        return message;
      };

      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            // Send connection established event
            const connectEvent = formatSSEMessage('connected', {
              sessionId: sessionId || `session-${Date.now()}`,
              timestamp: new Date().toISOString()
            });
            controller.enqueue(encoder.encode(connectEvent));

            // Run the agent with streaming enabled
            const result = await run(agent, message, {
              stream: true,
            });

            let eventId = 1;

            // Handle streaming events using async iteration
            for await (const event of result) {
              // Process different types of stream events
              if (event.type === 'raw_model_stream_event') {
                // Handle raw model stream events (text deltas)
                const rawEvent = event.data;
                if (rawEvent.type === 'output_text_delta') {
                  const sseMessage = formatSSEMessage('text_delta', {
                    delta: rawEvent.delta,
                    sessionId: sessionId || `session-${Date.now()}`
                  }, `event-${eventId++}`);
                  controller.enqueue(encoder.encode(sseMessage));
                } else if (rawEvent.type === 'response_done') {
                  const sseMessage = formatSSEMessage('response_completed', {
                    status: 'completed',
                    sessionId: sessionId || `session-${Date.now()}`
                  }, `event-${eventId++}`);
                  controller.enqueue(encoder.encode(sseMessage));
                }
              } else if (event.type === 'run_item_stream_event') {
                // Handle run item events (tool calls, messages, etc.)
                if (event.name === 'tool_called') {
                  const sseMessage = formatSSEMessage('tool_call', {
                    name: event.item.type,
                    event_name: event.name,
                    sessionId: sessionId || `session-${Date.now()}`
                  }, `event-${eventId++}`);
                  controller.enqueue(encoder.encode(sseMessage));
                } else if (event.name === 'message_output_created') {
                  const sseMessage = formatSSEMessage('message_created', {
                    event_name: event.name,
                    item_type: event.item.type,
                    sessionId: sessionId || `session-${Date.now()}`
                  }, `event-${eventId++}`);
                  controller.enqueue(encoder.encode(sseMessage));
                }
              } else if (event.type === 'agent_updated_stream_event') {
                // Handle agent handoff events
                const sseMessage = formatSSEMessage('agent_updated', {
                  agent_name: event.agent?.name || 'unknown',
                  sessionId: sessionId || `session-${Date.now()}`
                }, `event-${eventId++}`);
                controller.enqueue(encoder.encode(sseMessage));
              }
            }

            // Wait for completion and send final result
            await result.completed;

            const finalMessage = formatSSEMessage('final_result', {
              final_output: result.finalOutput,
              agent_name: result.lastAgent?.name || 'waddle-agent',
              usage: result.rawResponses?.[result.rawResponses.length - 1]?.usage || null,
              sessionId: sessionId || `session-${Date.now()}`,
              timestamp: new Date().toISOString()
            }, `event-${eventId++}`);
            controller.enqueue(encoder.encode(finalMessage));

            // Send completion event
            const completionMessage = formatSSEMessage('stream_complete', {
              sessionId: sessionId || `session-${Date.now()}`,
              timestamp: new Date().toISOString()
            }, `event-${eventId++}`);
            controller.enqueue(encoder.encode(completionMessage));

          } catch (error) {
            console.error('Streaming error:', error);
            const errorMessage = formatSSEMessage('error', {
              error: error instanceof Error ? error.message : 'Unknown streaming error',
              code: 'STREAMING_ERROR',
              sessionId: sessionId || `session-${Date.now()}`,
              timestamp: new Date().toISOString()
            }, `error-${Date.now()}`);
            controller.enqueue(encoder.encode(errorMessage));
          } finally {
            controller.close();
          }
        },
      });

      return new Response(readableStream, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Cache-Control',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Non-streaming response
      const result = await run(agent, message);

      // Create a chat message response object
      const response: ChatMessage = {
        id: `resp-${Date.now()}`,
        content: result.finalOutput || 'No response generated',
        role: 'assistant',
        timestamp: new Date(),
      };

      return new Response(
        JSON.stringify({
          success: true,
          message: response,
          agent: {
            name: result.lastAgent?.name || 'waddle-agent',
            toolsCount: agent.tools?.length || 0,
          },
                     sessionId: sessionId || `session-${Date.now()}`,
           usage: result.rawResponses?.[result.rawResponses.length - 1]?.usage || null,
        }),
        {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

  } catch (error) {
    console.error('Chat API error:', error);
    
    // Handle specific error types
    let errorMessage = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Handle specific OpenAI Agents SDK errors
      if (error.message.includes('OPENAI_API_KEY')) {
        errorCode = 'MISSING_API_KEY';
        statusCode = 500;
      } else if (error.message.includes('rate limit')) {
        errorCode = 'RATE_LIMITED';
        statusCode = 429;
      } else if (error.message.includes('invalid')) {
        errorCode = 'INVALID_REQUEST';
        statusCode = 400;
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        code: errorCode,
        message: 'Failed to process chat message',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      { 
        status: statusCode,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
}

/**
 * GET /api/chat - Health check endpoint
 */
export async function GET() {
  try {
    // Get agent to verify system is working
    const agent = await getAgent();
    
    return new Response(
      JSON.stringify({
        status: 'healthy',
        agent: {
          name: agent.name,
          toolsCount: agent.tools?.length || 0,
        },
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
} 