/**
 * Shared types and interfaces for the multi-agent system
 */

import type { Agent } from '@openai/agents';

/**
 * Context passed to all agents for dynamic behavior and tool access
 */
export interface AgentContext {
  /** Unique session identifier */
  sessionId: string;
  
  /** User ID if authenticated */
  userId?: string;
  
  /** Enable debug mode with detailed logging */
  isDebug: boolean;
  
  /** Timestamp when context was created */
  timestamp: Date;
  
  /** Request source (ui, api, test) */
  source: 'ui' | 'api' | 'test';
  
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Agent type identifiers for routing
 */
export type AgentType = 'triage';

/**
 * Agent registration interface
 */
export interface AgentRegistration {
  /** Agent type identifier */
  type: AgentType;
  
  /** Agent instance */
  agent: Agent<AgentContext>;
  
  /** Agent description for routing decisions */
  description: string;
  
  /** Whether this agent can be a handoff target */
  canReceiveHandoffs: boolean;
  
  /** Agent configuration metadata */
  metadata: {
    model: string;
    toolCount: number;
    hasStructuredOutput: boolean;
    supportedCapabilities: string[];
  };
}

/**
 * Run context type for agent execution
 * This should match the OpenAI SDK's RunContext interface
 */
export interface RunContext<T = AgentContext> {
  context: T;
}

/**
 * Agent execution result
 */
export interface AgentResult {
  /** Final response content */
  finalOutput: string;
  
  /** Agent that produced the response */
  agentType: AgentType;
  
  /** Execution metadata */
  metadata: {
    executionTime: number;
    tokenUsage?: any; // SDK Usage type
    handoffOccurred: boolean;
    toolsUsed: string[];
  };
  
  /** Raw SDK response for advanced usage */
  rawResponse?: any;
}