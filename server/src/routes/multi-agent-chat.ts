/**
 * Multi-Agent Chat Routes - SDK-aligned chat endpoints with agent routing
 * 
 * Replaces the singleton chat routes with a multi-agent system that
 * supports agent routing, context injection, and handoffs.
 */

import express from 'express';
import { MultiAgentManager } from '../lib/multi-agent-manager.js';
import type { AgentType } from '../agents/types.js';
import type { ChatMessage } from '../types/agent.js';

const router = express.Router();

/**
 * GET /api/chat/test - Multi-agent system self-test endpoint
 */
router.get('/chat/test', async (_req: express.Request, res: express.Response) => {
  try {
    console.log('[Multi-Agent Test] Starting multi-agent system self-test...');
    
    const manager = MultiAgentManager.getInstance();
    await manager.initialize();
    
    console.log('[Multi-Agent Test] Multi-agent system initialized successfully');
    
    // Test triage agent with a simple message
    const testMessage = 'Hello, I need help with my account';
    const context = manager.createContext({
      sessionId: `test-${Date.now()}`,
      source: 'test',
    });
    
    console.log('[Multi-Agent Test] Testing triage agent with message:', testMessage);
    
    const result = await manager.runAgent('triage', testMessage, context);
    
    console.log('[Multi-Agent Test] Triage agent responded successfully');
    
    // Get system status
    const status = manager.getStatus();
    
    // Return success response
    res.json({
      status: 'success',
      message: 'Multi-agent system self-test passed',
      agentResponse: result.finalOutput,
      agentUsed: result.agentType,
      executionTime: result.metadata.executionTime,
      handoffOccurred: result.metadata.handoffOccurred,
      systemStatus: status,
      timestamp: new Date().toISOString(),
      testMessage: testMessage
    });
    
  } catch (error) {
    console.error('[Multi-Agent Test] Self-test failed:', error);
    
    const errorDetails = {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    };
    
    res.status(500).json({
      status: 'failed',
      message: 'Multi-agent system self-test failed',
      error: errorDetails,
      troubleshooting: {
        checkApiKey: 'Verify OPENAI_API_KEY is set and valid',
        checkModel: 'Try setting AGENT_MODEL=gpt-4o if gpt-4o-mini fails',
        checkNetwork: 'Ensure internet connection for OpenAI API calls',
        checkAgents: 'Verify all agent definitions are valid',
        checkLogs: 'Check server logs for detailed error information'
      }
    });
  }
});

/**
 * GET /api/chat/status - Multi-agent system status endpoint
 */
router.get('/chat/status', async (_req: express.Request, res: express.Response) => {
  try {
    const manager = MultiAgentManager.getInstance();
    const status = manager.getStatus();
    const healthy = await manager.healthCheck();
    
    res.json({
      healthy,
      status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Multi-Agent Status] Status check failed:', error);
    res.status(500).json({
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Helper function to format SSE messages
 */
const formatSSEMessage = (type: string, data: any, id?: string) => {
  let sseMessage = '';
  if (id) sseMessage += `id: ${id}\n`;
  sseMessage += `event: ${type}\n`;
  sseMessage += `data: ${JSON.stringify(data)}\n\n`;
  return sseMessage;
};

/**
 * GET /api/chat - Handle streaming requests via Server-Sent Events
 * EventSource can only make GET requests, so we need this for streaming
 */
router.get('/chat', async (req: express.Request, res: express.Response) => {
  try {
    // Extract message parameters from query string
    const { message, sessionId, stream, agentType, userId } = req.query;

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

    // Initialize multi-agent system
    const manager = MultiAgentManager.getInstance();
    await manager.initialize();

    // Create agent context
    const context = manager.createContext({
      sessionId: sessionId as string || `session-${Date.now()}`,
      userId: userId as string,
      source: 'ui',
    });

    // Determine which agent to use (default to triage)
    const targetAgent: AgentType = (agentType as AgentType) || manager.getDefaultAgent();

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
      console.log('[Multi-Agent Chat GET] Client disconnected');
      isClientConnected = false;
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
    });

    req.on('error', (error) => {
      console.error('[Multi-Agent Chat GET] Client connection error:', error);
      isClientConnected = false;
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
    });

    // Set up heartbeat mechanism
    heartbeatInterval = setInterval(() => {
      if (isClientConnected && !res.destroyed) {
        const heartbeatEvent = formatSSEMessage('heartbeat', {
          timestamp: new Date().toISOString(),
          sessionId: context.sessionId
        });
        try {
          res.write(heartbeatEvent);
        } catch (error) {
          console.error('[Multi-Agent Chat GET] Heartbeat write error:', error);
          isClientConnected = false;
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
          }
        }
      } else {
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
        }
      }
    }, 30000); // 30 seconds

    try {
      // Send connection established event
      const connectEvent = formatSSEMessage('connected', {
        sessionId: context.sessionId,
        agentType: targetAgent,
        timestamp: new Date().toISOString()
      });
      res.write(connectEvent);

      // Run the agent with streaming enabled
      const result = await manager.runAgent(targetAgent, message, context, { stream: true });

      let eventId = 1;

      // Handle streaming events using async iteration
      for await (const event of result.rawResponse) {
        // Check if client is still connected before processing events
        if (!isClientConnected) {
          console.log('[Multi-Agent Chat GET] Client disconnected, stopping stream processing');
          break;
        }

        // Process different types of stream events
        if (event.type === 'raw_model_stream_event') {
          const rawEvent = event.data;
          if (rawEvent.type === 'output_text_delta') {
            const sseMessage = formatSSEMessage('text_delta', {
              delta: rawEvent.delta,
              sessionId: context.sessionId,
              agentType: targetAgent
            }, `event-${eventId++}`);
            
            if (isClientConnected && !res.destroyed) {
              res.write(sseMessage);
            }
          } else if (rawEvent.type === 'response_done') {
            const sseMessage = formatSSEMessage('response_completed', {
              status: 'completed',
              sessionId: context.sessionId,
              agentType: targetAgent
            }, `event-${eventId++}`);
            
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
              sessionId: context.sessionId,
              agentType: targetAgent
            }, `event-${eventId++}`);
            
            if (isClientConnected && !res.destroyed) {
              res.write(sseMessage);
            }
          } else if (event.name === 'message_output_created') {
            const sseMessage = formatSSEMessage('message_created', {
              event_name: event.name,
              item_type: event.item.type,
              sessionId: context.sessionId,
              agentType: targetAgent
            }, `event-${eventId++}`);
            
            if (isClientConnected && !res.destroyed) {
              res.write(sseMessage);
            }
          }
        } else if (event.type === 'agent_updated_stream_event') {
          // Handle agent handoff events
          const sseMessage = formatSSEMessage('agent_updated', {
            agent_name: event.agent?.name || 'unknown',
            sessionId: context.sessionId,
            handoff_occurred: true
          }, `event-${eventId++}`);
          
          if (isClientConnected && !res.destroyed) {
            res.write(sseMessage);
          }
        }
      }

      // Send final result if client is still connected
      if (isClientConnected && !res.destroyed) {
        const finalMessage = formatSSEMessage('final_result', {
          final_output: result.finalOutput,
          agent_type: result.agentType,
          execution_time: result.metadata.executionTime,
          handoff_occurred: result.metadata.handoffOccurred,
          tools_used: result.metadata.toolsUsed,
          usage: result.metadata.tokenUsage,
          sessionId: context.sessionId,
          timestamp: new Date().toISOString()
        }, `event-${eventId++}`);
        res.write(finalMessage);

        // Send stream completion event
        const completedEvent = formatSSEMessage('stream_complete', {
          sessionId: context.sessionId,
          timestamp: new Date().toISOString()
        }, `event-${eventId++}`);
        res.write(completedEvent);
      }

    } catch (streamError) {
      console.error('[Multi-Agent Chat GET] Streaming error:', streamError);
      
      if (isClientConnected && !res.destroyed) {
        const errorEvent = formatSSEMessage('error', {
          error: streamError instanceof Error ? streamError.message : 'Unknown streaming error',
          code: 'STREAMING_ERROR',
          sessionId: context.sessionId,
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
    console.error('[Multi-Agent Chat GET] Error processing streaming request:', error);
    
    if (process.env.NODE_ENV === 'development') {
      console.error('[Multi-Agent Chat GET] Full error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
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
 * POST /api/chat - Process chat messages with Multi-Agent system
 * Supports streaming responses using Server-Sent Events (SSE)
 */
router.post('/chat', async (req: express.Request, res: express.Response) => {
  try {
    // Extract message parameters from request body
    const { message, sessionId, stream = true, agentType, userId } = req.body;

    // Validate required fields
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ 
        error: 'Message is required and must be a string',
        code: 'INVALID_INPUT'
      });
    }

    // Initialize multi-agent system
    const manager = MultiAgentManager.getInstance();
    await manager.initialize();

    // Create agent context
    const context = manager.createContext({
      sessionId: sessionId || `session-${Date.now()}`,
      userId,
      source: 'api',
    });

    // Determine which agent to use (default to triage)
    const targetAgent: AgentType = agentType || manager.getDefaultAgent();

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
        console.log('[Multi-Agent Chat POST] Client disconnected');
        isClientConnected = false;
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
        }
      });

      req.on('error', (error) => {
        console.error('[Multi-Agent Chat POST] Client connection error:', error);
        isClientConnected = false;
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
        }
      });

      // Set up heartbeat mechanism
      heartbeatInterval = setInterval(() => {
        if (isClientConnected && !res.destroyed) {
          const heartbeatEvent = formatSSEMessage('heartbeat', {
            timestamp: new Date().toISOString(),
            sessionId: context.sessionId
          });
          try {
            res.write(heartbeatEvent);
          } catch (error) {
            console.error('[Multi-Agent Chat POST] Heartbeat write error:', error);
            isClientConnected = false;
            if (heartbeatInterval) {
              clearInterval(heartbeatInterval);
            }
          }
        } else {
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
          }
        }
      }, 30000); // 30 seconds

      try {
        // Send connection established event
        const connectEvent = formatSSEMessage('connected', {
          sessionId: context.sessionId,
          agentType: targetAgent,
          timestamp: new Date().toISOString()
        });
        res.write(connectEvent);

        // Run the agent with streaming enabled
        const result = await manager.runAgent(targetAgent, message, context, { stream: true });

        let eventId = 1;

        // Handle streaming events using async iteration
        for await (const event of result.rawResponse) {
          if (!isClientConnected) {
            console.log('[Multi-Agent Chat POST] Client disconnected, stopping stream processing');
            break;
          }

          // Process different types of stream events (same as GET implementation)
          if (event.type === 'raw_model_stream_event') {
            const rawEvent = event.data;
            if (rawEvent.type === 'output_text_delta') {
              const sseMessage = formatSSEMessage('text_delta', {
                delta: rawEvent.delta,
                sessionId: context.sessionId,
                agentType: targetAgent
              }, `event-${eventId++}`);
              
              if (isClientConnected && !res.destroyed) {
                res.write(sseMessage);
              }
            }
          } else if (event.type === 'agent_updated_stream_event') {
            const sseMessage = formatSSEMessage('agent_updated', {
              agent_name: event.agent?.name || 'unknown',
              sessionId: context.sessionId,
              handoff_occurred: true
            }, `event-${eventId++}`);
            
            if (isClientConnected && !res.destroyed) {
              res.write(sseMessage);
            }
          }
        }

        // Send final result if client is still connected
        if (isClientConnected && !res.destroyed) {
          const finalMessage = formatSSEMessage('final_result', {
            final_output: result.finalOutput,
            agent_type: result.agentType,
            execution_time: result.metadata.executionTime,
            handoff_occurred: result.metadata.handoffOccurred,
            sessionId: context.sessionId,
            timestamp: new Date().toISOString()
          }, `event-${eventId++}`);
          res.write(finalMessage);

          const completedEvent = formatSSEMessage('stream_complete', {
            sessionId: context.sessionId,
            timestamp: new Date().toISOString()
          }, `event-${eventId++}`);
          res.write(completedEvent);
        }

      } catch (streamError) {
        console.error('[Multi-Agent Chat POST] Streaming error:', streamError);
        
        if (isClientConnected && !res.destroyed) {
          const errorEvent = formatSSEMessage('error', {
            error: streamError instanceof Error ? streamError.message : 'Unknown streaming error',
            code: 'STREAMING_ERROR',
            sessionId: context.sessionId,
            timestamp: new Date().toISOString()
          });
          res.write(errorEvent);
        }
      } finally {
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
        }
        
        if (!res.destroyed) {
          res.end();
        }
      }

    } else {
      // Handle non-streaming response
      try {
        const result = await manager.runAgent(targetAgent, message, context);

        const response: ChatMessage = {
          id: `msg-${Date.now()}`,
          content: result.finalOutput,
          role: 'assistant',
          timestamp: new Date(),
          sessionId: context.sessionId,
        };

        res.json({
          ...response,
          agentType: result.agentType,
          executionTime: result.metadata.executionTime,
          handoffOccurred: result.metadata.handoffOccurred,
        });
      } catch (nonStreamError) {
        console.error('[Multi-Agent Chat POST] Non-streaming error:', nonStreamError);
        throw nonStreamError;
      }
    }

  } catch (error) {
    console.error('[Multi-Agent Chat POST] Request error:', error);
    
    if (process.env.NODE_ENV === 'development') {
      console.error('[Multi-Agent Chat POST] Full error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
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