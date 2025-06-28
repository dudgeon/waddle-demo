/**
 * TypeScript interfaces for agent configuration, tools, and approval events
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
 * Tool definition interface
 */
export interface ToolDefinition {
  /** Tool name */
  name: string;
  
  /** Tool description */
  description: string;
  
  /** Tool parameters schema */
  parameters?: Record<string, any>;
  
  /** Tool implementation function */
  implementation: (...args: any[]) => Promise<any> | any;
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
    customerInfo?: Record<string, any>;
  };
}

/**
 * Streaming response chunk
 */
export interface StreamingChunk {
  /** Chunk type */
  type: 'text' | 'tool_call' | 'approval_request' | 'error' | 'done';
  
  /** Chunk data */
  data: any;
  
  /** Chunk timestamp */
  timestamp: Date;
} 