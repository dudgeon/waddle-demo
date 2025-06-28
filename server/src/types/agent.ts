/**
 * TypeScript interfaces for backend agent configuration, tools, and runtime management
 * 
 * This file contains all the type definitions needed for the backend agent system,
 * including configuration, tool management, streaming, and approval workflows.
 */

import type { Agent } from '@openai/agents';

/**
 * Agent configuration settings
 */
export interface AgentSettings {
  /** Whether to require approval for all tool calls */
  requireApprovalForTools: boolean;
  
  /** Maximum conversation length before suggesting escalation */
  maxConversationTurns: number;
  
  /** Whether to enable debug logging */
  enableDebugLogging: boolean;
  
  /** Timeout for tool operations (in milliseconds) */
  toolTimeout: number;
}

/**
 * Complete agent configuration
 */
export interface AgentConfig {
  /** Agent name identifier */
  name: string;
  
  /** OpenAI model to use */
  model: string;
  
  /** Agent persona instructions */
  persona: string;
  
  /** Agent behavioral settings */
  settings: AgentSettings;
}

/**
 * Tool definition interface (matches loadTools.ts)
 */
export interface ToolDefinition {
  /** Tool name identifier */
  name: string;
  
  /** Tool description for the agent */
  description: string;
  
  /** Tool parameters schema (JSON Schema) */
  parameters?: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  
  /** Tool implementation function */
  implementation: (args: Record<string, any>) => Promise<any>;
  
  /** Whether this tool requires approval before execution */
  requiresApproval?: boolean;
  
  /** Tool category for organization */
  category?: 'database' | 'crm' | 'api' | 'mcp' | 'utility';
}

/**
 * Tool call request from agent
 */
export interface ToolCallRequest {
  /** Unique identifier for this tool call */
  id: string;
  
  /** Name of the tool being called */
  toolName: string;
  
  /** Arguments passed to the tool */
  arguments: Record<string, any>;
  
  /** Timestamp when the tool call was requested */
  timestamp: Date;
  
  /** Context about why the tool is being called */
  context?: string;
  
  /** Session ID this tool call belongs to */
  sessionId?: string;
}

/**
 * Tool call approval decision
 */
export interface ToolCallApproval {
  /** ID of the tool call being approved/rejected */
  toolCallId: string;
  
  /** Whether the tool call was approved */
  approved: boolean;
  
  /** Optional reason for the decision */
  reason?: string;
  
  /** Timestamp of the approval decision */
  timestamp: Date;
  
  /** User who made the approval decision */
  approvedBy?: string;
}

/**
 * Tool call result
 */
export interface ToolCallResult {
  /** ID of the tool call */
  toolCallId: string;
  
  /** Whether the tool call was successful */
  success: boolean;
  
  /** Result data from the tool call */
  data?: any;
  
  /** Error message if the tool call failed */
  error?: string;
  
  /** Timestamp when the tool call completed */
  timestamp: Date;
  
  /** Execution time in milliseconds */
  executionTime: number;
}

/**
 * Approval event for logging and tracking
 */
export interface ApprovalEvent {
  /** Unique event identifier */
  id: string;
  
  /** Type of approval event */
  type: 'tool_call_requested' | 'tool_call_approved' | 'tool_call_rejected' | 'tool_call_completed';
  
  /** Tool call request details */
  toolCall: ToolCallRequest;
  
  /** Approval decision if applicable */
  approval?: ToolCallApproval;
  
  /** Tool call result if applicable */
  result?: ToolCallResult;
  
  /** Event timestamp */
  timestamp: Date;
  
  /** Session ID this event belongs to */
  sessionId?: string;
}

/**
 * Agent runtime state
 */
export interface AgentState {
  /** Current agent instance */
  agent: Agent | null;
  
  /** Whether the agent is currently processing */
  isProcessing: boolean;
  
  /** Number of conversation turns */
  conversationTurns: number;
  
  /** Pending tool calls awaiting approval */
  pendingToolCalls: ToolCallRequest[];
  
  /** Recent approval events */
  recentEvents: ApprovalEvent[];
  
  /** Agent initialization status */
  isInitialized: boolean;
  
  /** Last activity timestamp */
  lastActivity: Date;
}

/**
 * Chat message interface
 */
export interface ChatMessage {
  /** Message identifier */
  id: string;
  
  /** Message content */
  content: string;
  
  /** Message sender */
  role: 'user' | 'assistant' | 'system';
  
  /** Timestamp */
  timestamp: Date;
  
  /** Associated tool calls if any */
  toolCalls?: ToolCallRequest[];
  
  /** Session ID this message belongs to */
  sessionId?: string;
}

/**
 * Chat session interface
 */
export interface ChatSession {
  /** Session identifier */
  id: string;
  
  /** Session messages */
  messages: ChatMessage[];
  
  /** Current agent state */
  agentState: AgentState;
  
  /** Session metadata */
  metadata: {
    startTime: Date;
    lastActivity: Date;
    userAgent?: string;
    ipAddress?: string;
  };
}

/**
 * Streaming chunk types for Server-Sent Events
 */
export interface StreamingChunk {
  /** Chunk type */
  type: 'text' | 'tool_call' | 'approval_request' | 'error' | 'done' | 'connected' | 'agent_updated';
  
  /** Chunk data */
  data: any;
  
  /** Chunk timestamp */
  timestamp: Date;
  
  /** Session ID */
  sessionId?: string;
}

/**
 * Text delta streaming chunk
 */
export interface TextDeltaChunk extends StreamingChunk {
  type: 'text';
  data: {
    delta: string;
    content?: string;
  };
}

/**
 * Tool call streaming chunk
 */
export interface ToolCallChunk extends StreamingChunk {
  type: 'tool_call';
  data: {
    name: string;
    arguments?: Record<string, any>;
    requiresApproval?: boolean;
  };
}

/**
 * Error streaming chunk
 */
export interface ErrorChunk extends StreamingChunk {
  type: 'error';
  data: {
    error: string;
    code?: string;
  };
}

/**
 * Agent updated streaming chunk
 */
export interface AgentUpdatedChunk extends StreamingChunk {
  type: 'agent_updated';
  data: {
    agent_name: string;
    status?: string;
  };
}

/**
 * Final result streaming chunk
 */
export interface FinalResultChunk extends StreamingChunk {
  type: 'done';
  data: {
    final_output: string;
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  };
}

/**
 * Streaming callback handlers
 */
export interface StreamingCallbacks {
  onConnected?: (data: any) => void;
  onTextDelta?: (data: { delta: string }) => void;
  onToolCall?: (data: { name: string; arguments?: Record<string, any> }) => void;
  onMessageCreated?: (data: any) => void;
  onAgentUpdated?: (data: { agent_name: string }) => void;
  onFinalResult?: (data: { final_output: string; usage?: any }) => void;
  onStreamComplete?: (data: any) => void;
  onError?: (data: { error: string }) => void;
}

/**
 * Agent manager configuration
 */
export interface AgentManagerConfig {
  /** Maximum number of concurrent sessions */
  maxConcurrentSessions?: number;
  
  /** Session timeout in milliseconds */
  sessionTimeout?: number;
  
  /** Whether to enable session persistence */
  enableSessionPersistence?: boolean;
  
  /** Whether to enable metrics collection */
  enableMetrics?: boolean;
}

/**
 * Agent metrics interface
 */
export interface AgentMetrics {
  /** Total number of sessions */
  totalSessions: number;
  
  /** Active sessions count */
  activeSessions: number;
  
  /** Total messages processed */
  totalMessages: number;
  
  /** Total tool calls executed */
  totalToolCalls: number;
  
  /** Average response time in milliseconds */
  averageResponseTime: number;
  
  /** Error count */
  errorCount: number;
  
  /** Uptime in milliseconds */
  uptime: number;
}

/**
 * Request/Response interfaces for API endpoints
 */
export interface ChatRequest {
  message: string;
  sessionId: string;
  metadata?: Record<string, any>;
}

export interface ChatResponse {
  success: boolean;
  sessionId: string;
  error?: string;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  environment: string;
  agent?: {
    initialized: boolean;
    toolsLoaded: number;
  };
} 