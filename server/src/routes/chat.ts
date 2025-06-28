import express from 'express';
import { run } from '@openai/agents';
import { AgentManager, AgentRuntimeError } from '../lib/agent.js';
import type { ChatMessage } from '../types/agent.js';

const router = express.Router();

/**
 * GET /api/chat/test - Lightweight agent self-test endpoint
 * Tests agent initialization and basic functionality
 */
router.get('/chat/test', async (_req: express.Request, res: express.Response) => {
  try {
    console.log('[Chat Test] Starting agent self-test...');
    
    // Test agent initialization
    const agentManager = AgentManager.getInstance();
    const agent = await agentManager.getAgent();
    
    console.log('[Chat Test] Agent initialized successfully');
    
    // Test basic agent functionality with a simple ping
    const testMessage = 'ping';
    console.log('[Chat Test] Testing agent with message:', testMessage);
    
    const result = await run(agent, testMessage);
    
    console.log('[Chat Test] Agent responded successfully');
    
    // Return success response
    res.json({
      status: 'success',
      message: 'Agent self-test passed',
      agentResponse: result.finalOutput || 'No response generated',
      agentName: result.lastAgent?.name || 'waddle-agent',
      timestamp: new Date().toISOString(),
      testMessage: testMessage
    });
    
  } catch (error) {
    console.error('[Chat Test] Self-test failed:', error);
    
    // Enhanced error details for debugging
    const errorDetails = {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    };
    
    res.status(500).json({
      status: 'failed',
      message: 'Agent self-test failed',
      error: errorDetails,
      troubleshooting: {
        checkApiKey: 'Verify OPENAI_API_KEY is set and valid',
        checkModel: 'Try setting AGENT_MODEL=gpt-4o if gpt-4o-mini fails',
        checkNetwork: 'Ensure internet connection for OpenAI API calls',
        checkLogs: 'Check server logs for detailed error information'
      }
    });
  }
});

/**
 * GET /api/chat - Handle streaming requests via Server-Sent Events
 * EventSource can only make GET requests, so we need this for streaming
 */
router.get('/chat', async (req: express.Request, res: express.Response) => {
  try {
    // Extract message parameters from query string
    const { message, sessionId, stream } = req.query;

    // Validate required fields
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ 
        error: 'Message is required and must be a string',
        code: 'INVALID_INPUT'
      });
    }

    // Only handle streaming requests on GET
    if (stream !== 'true') {
      return res.status(400).json({
        error: 'GET /api/chat only supports streaming requests. Use POST for non-streaming.',
        code: 'INVALID_REQUEST_METHOD'
      });
    }

    // Get the agent instance
    const agentManager = AgentManager.getInstance();
    const agent = await agentManager.getAgent();

    // Set up Server-Sent Events headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    // Handle client disconnection
    let isClientConnected = true;
    let heartbeatInterval: NodeJS.Timeout | null = null;
    
    req.on('close', () => {
      console.log('[Chat Route GET] Client disconnected');
      isClientConnected = false;
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
    });

    req.on('error', (error) => {
      console.error('[Chat Route GET] Client connection error:', error);
      isClientConnected = false;
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
    });

    // Set up heartbeat mechanism to keep connection alive
    heartbeatInterval = setInterval(() => {
      if (isClientConnected && !res.destroyed) {
        // Send heartbeat event every 30 seconds
        const heartbeatEvent = formatSSEMessage('heartbeat', {
          timestamp: new Date().toISOString(),
          sessionId: sessionId || `session-${Date.now()}`
        });
        try {
          res.write(heartbeatEvent);
        } catch (error) {
          console.error('[Chat Route GET] Heartbeat write error:', error);
          isClientConnected = false;
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
          }
        }
      } else {
        // Clear interval if client disconnected
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
        }
      }
    }, 30000); // 30 seconds

    try {
      // Send connection established event
      const connectEvent = formatSSEMessage('connected', {
        sessionId: sessionId || `session-${Date.now()}`,
        timestamp: new Date().toISOString()
      });
      res.write(connectEvent);

      // Run the agent with streaming enabled
      const result = await run(agent, message, {
        stream: true,
      });

      let eventId = 1;

      // Handle streaming events using async iteration
      for await (const event of result) {
        // Check if client is still connected before processing events
        if (!isClientConnected) {
          console.log('[Chat Route GET] Client disconnected, stopping stream processing');
          break;
        }

        // Process different types of stream events
        if (event.type === 'raw_model_stream_event') {
          // Handle raw model stream events (text deltas)
          const rawEvent = event.data;
          if (rawEvent.type === 'output_text_delta') {
            const sseMessage = formatSSEMessage('text_delta', {
              delta: rawEvent.delta,
              sessionId: sessionId || `session-${Date.now()}`
            }, `event-${eventId++}`);
            
            // Check connection before writing
            if (isClientConnected && !res.destroyed) {
              res.write(sseMessage);
            }
          } else if (rawEvent.type === 'response_done') {
            const sseMessage = formatSSEMessage('response_completed', {
              status: 'completed',
              sessionId: sessionId || `session-${Date.now()}`
            }, `event-${eventId++}`);
            
            // Check connection before writing
            if (isClientConnected && !res.destroyed) {
              res.write(sseMessage);
            }
          }
        } else if (event.type === 'run_item_stream_event') {
          // Handle run item events (tool calls, messages, etc.)
          if (event.name === 'tool_called') {
            const sseMessage = formatSSEMessage('tool_call', {
              name: event.item.type,
              event_name: event.name,
              sessionId: sessionId || `session-${Date.now()}`
            }, `event-${eventId++}`);
            
            // Check connection before writing
            if (isClientConnected && !res.destroyed) {
              res.write(sseMessage);
            }
          } else if (event.name === 'message_output_created') {
            const sseMessage = formatSSEMessage('message_created', {
              event_name: event.name,
              item_type: event.item.type,
              sessionId: sessionId || `session-${Date.now()}`
            }, `event-${eventId++}`);
            
            // Check connection before writing
            if (isClientConnected && !res.destroyed) {
              res.write(sseMessage);
            }
          }
        } else if (event.type === 'agent_updated_stream_event') {
          // Handle agent handoff events
          const sseMessage = formatSSEMessage('agent_updated', {
            agent_name: event.agent?.name || 'unknown',
            sessionId: sessionId || `session-${Date.now()}`
          }, `event-${eventId++}`);
          
          // Check connection before writing
          if (isClientConnected && !res.destroyed) {
            res.write(sseMessage);
          }
        }
      }

      // Send final result if client is still connected
      if (isClientConnected && !res.destroyed) {
        const finalMessage = formatSSEMessage('final_result', {
          final_output: result.finalOutput,
          agent_name: result.lastAgent?.name || 'waddle-agent',
          usage: result.rawResponses?.[result.rawResponses.length - 1]?.usage || null,
          sessionId: sessionId || `session-${Date.now()}`,
          timestamp: new Date().toISOString()
        }, `event-${eventId++}`);
        res.write(finalMessage);

        // Send stream completion event
        const completedEvent = formatSSEMessage('stream_complete', {
          sessionId: sessionId || `session-${Date.now()}`,
          timestamp: new Date().toISOString()
        }, `event-${eventId++}`);
        res.write(completedEvent);
      }

    } catch (streamError) {
      console.error('[Chat Route GET] Streaming error:', streamError);
      
      // Send error event if client is still connected
      if (isClientConnected && !res.destroyed) {
        const errorEvent = formatSSEMessage('error', {
          error: streamError instanceof Error ? streamError.message : 'Unknown streaming error',
          code: 'STREAMING_ERROR',
          sessionId: sessionId || `session-${Date.now()}`,
          timestamp: new Date().toISOString()
        });
        res.write(errorEvent);
      }
    } finally {
      // Clean up heartbeat interval
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
      
      // End the response if still connected
      if (isClientConnected && !res.destroyed) {
        res.end();
      }
    }

  } catch (error) {
    console.error('[Chat Route GET] Error processing streaming request:', error);
    
    if (process.env.NODE_ENV === 'development') {
      console.error('[Chat Route GET] Full error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        cause: error instanceof Error && 'cause' in error ? error.cause : undefined
      });
    }

    // Only send error response if headers haven't been sent
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Failed to process streaming chat request',
        code: 'STREAMING_REQUEST_ERROR',
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : String(error)) : 
          'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  }
});

/**
 * POST /api/chat - Process chat messages with OpenAI Agent
 * Supports streaming responses using Server-Sent Events (SSE)
 */
// Helper function to format SSE messages
const formatSSEMessage = (type: string, data: any, id?: string) => {
  let sseMessage = '';
  if (id) sseMessage += `id: ${id}\n`;
  sseMessage += `event: ${type}\n`;
  sseMessage += `data: ${JSON.stringify(data)}\n\n`;
  return sseMessage;
};

router.post('/chat', async (req: express.Request, res: express.Response) => {
  try {
    // Extract message parameters from request body
    const { message, sessionId, stream = true } = req.body;

    // Validate required fields
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ 
        error: 'Message is required and must be a string',
        code: 'INVALID_INPUT'
      });
    }

    // Get the agent instance
    const agentManager = AgentManager.getInstance();
    const agent = await agentManager.getAgent();

    // Handle streaming vs non-streaming responses
    if (stream) {
      // Set up Server-Sent Events headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      });

      // Handle client disconnection
      let isClientConnected = true;
      let heartbeatInterval: NodeJS.Timeout | null = null;
      
      req.on('close', () => {
        console.log('[Chat Route] Client disconnected');
        isClientConnected = false;
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
        }
      });

      req.on('error', (error) => {
        console.error('[Chat Route] Client connection error:', error);
        isClientConnected = false;
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
        }
      });

      // Set up heartbeat mechanism to keep connection alive
      heartbeatInterval = setInterval(() => {
        if (isClientConnected && !res.destroyed) {
          // Send heartbeat event every 30 seconds
          const heartbeatEvent = formatSSEMessage('heartbeat', {
            timestamp: new Date().toISOString(),
            sessionId: sessionId || `session-${Date.now()}`
          });
          try {
            res.write(heartbeatEvent);
          } catch (error) {
            console.error('[Chat Route] Heartbeat write error:', error);
            isClientConnected = false;
            if (heartbeatInterval) {
              clearInterval(heartbeatInterval);
            }
          }
        } else {
          // Clear interval if client disconnected
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
          }
        }
      }, 30000); // 30 seconds

      try {
        // Send connection established event
        const connectEvent = formatSSEMessage('connected', {
          sessionId: sessionId || `session-${Date.now()}`,
          timestamp: new Date().toISOString()
        });
        res.write(connectEvent);

        // Run the agent with streaming enabled
        const result = await run(agent, message, {
          stream: true,
        });

        let eventId = 1;

        // Handle streaming events using async iteration
        for await (const event of result) {
          // Check if client is still connected before processing events
          if (!isClientConnected) {
            console.log('[Chat Route] Client disconnected, stopping stream processing');
            break;
          }

          // Process different types of stream events
          if (event.type === 'raw_model_stream_event') {
            // Handle raw model stream events (text deltas)
            const rawEvent = event.data;
            if (rawEvent.type === 'output_text_delta') {
              const sseMessage = formatSSEMessage('text_delta', {
                delta: rawEvent.delta,
                sessionId: sessionId || `session-${Date.now()}`
              }, `event-${eventId++}`);
              
              // Check connection before writing
              if (isClientConnected && !res.destroyed) {
                res.write(sseMessage);
              }
            } else if (rawEvent.type === 'response_done') {
              const sseMessage = formatSSEMessage('response_completed', {
                status: 'completed',
                sessionId: sessionId || `session-${Date.now()}`
              }, `event-${eventId++}`);
              
              // Check connection before writing
              if (isClientConnected && !res.destroyed) {
                res.write(sseMessage);
              }
            }
          } else if (event.type === 'run_item_stream_event') {
            // Handle run item events (tool calls, messages, etc.)
            if (event.name === 'tool_called') {
              const sseMessage = formatSSEMessage('tool_call', {
                name: event.item.type,
                event_name: event.name,
                sessionId: sessionId || `session-${Date.now()}`
              }, `event-${eventId++}`);
              
              // Check connection before writing
              if (isClientConnected && !res.destroyed) {
                res.write(sseMessage);
              }
            } else if (event.name === 'message_output_created') {
              const sseMessage = formatSSEMessage('message_created', {
                event_name: event.name,
                item_type: event.item.type,
                sessionId: sessionId || `session-${Date.now()}`
              }, `event-${eventId++}`);
              
              // Check connection before writing
              if (isClientConnected && !res.destroyed) {
                res.write(sseMessage);
              }
            }
          } else if (event.type === 'agent_updated_stream_event') {
            // Handle agent handoff events
            const sseMessage = formatSSEMessage('agent_updated', {
              agent_name: event.agent?.name || 'unknown',
              sessionId: sessionId || `session-${Date.now()}`
            }, `event-${eventId++}`);
            
            // Check connection before writing
            if (isClientConnected && !res.destroyed) {
              res.write(sseMessage);
            }
          }
        }

        // Send final result if client is still connected
        if (isClientConnected && !res.destroyed) {
          const finalMessage = formatSSEMessage('final_result', {
            final_output: result.finalOutput,
            agent_name: result.lastAgent?.name || 'waddle-agent',
            usage: result.rawResponses?.[result.rawResponses.length - 1]?.usage || null,
            sessionId: sessionId || `session-${Date.now()}`,
            timestamp: new Date().toISOString()
          }, `event-${eventId++}`);
          res.write(finalMessage);

          // Send stream completion event
          const completedEvent = formatSSEMessage('stream_complete', {
            sessionId: sessionId || `session-${Date.now()}`,
            timestamp: new Date().toISOString()
          }, `event-${eventId++}`);
          res.write(completedEvent);
        }

      } catch (streamError) {
        console.error('[Chat Route] Streaming error:', streamError);
        
        // Send error event if client is still connected
        if (isClientConnected && !res.destroyed) {
          const errorEvent = formatSSEMessage('error', {
            error: streamError instanceof Error ? streamError.message : 'Unknown streaming error',
            code: 'STREAMING_ERROR',
            sessionId: sessionId || `session-${Date.now()}`,
            timestamp: new Date().toISOString()
          });
          res.write(errorEvent);
        }
      } finally {
        // Clean up heartbeat interval
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
        }
        
        // Close the SSE connection safely
        if (!res.destroyed) {
          res.end();
        }
        console.log('[Chat Route] SSE stream ended');
      }

    } else {
      // Handle non-streaming response
      try {
        const result = await run(agent, message);

        const response: ChatMessage = {
          id: `msg-${Date.now()}`,
          content: result.finalOutput || 'No response generated',
          role: 'assistant',
          timestamp: new Date(),
          sessionId: sessionId,
        };

        res.json(response);
      } catch (nonStreamError) {
        console.error('[Chat Route] Non-streaming error:', nonStreamError);
        throw nonStreamError;
      }
    }

  } catch (error) {
    console.error('[Chat Route] Request error:', error);
    
    // Enhanced error logging for development
    if (process.env.NODE_ENV === 'development') {
      console.error('[Chat Route] Full error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        cause: error instanceof Error && 'cause' in error ? error.cause : undefined,
        // Log OpenAI-specific error details if available
        ...(error && typeof error === 'object' && 'response' in error 
          ? { openaiResponse: error.response } 
          : {}),
        ...(error && typeof error === 'object' && 'status' in error 
          ? { httpStatus: error.status } 
          : {}),
      });
    }
    
    // Handle different types of errors
    if (error instanceof AgentRuntimeError) {
      return res.status(503).json({
        error: 'Agent service unavailable',
        message: error.message,
        code: 'AGENT_UNAVAILABLE',
        ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {})
      });
    }
    
    // Generic error response
    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? 
        (error instanceof Error ? error.message : String(error)) : 
        'Something went wrong',
      code: 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV === 'development' && error instanceof Error ? { stack: error.stack } : {})
    });
  }
});

export default router; 