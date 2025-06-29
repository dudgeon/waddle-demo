/**
 * Legacy Agent Wrapper - Backward compatibility for old agent.ts
 * 
 * This wrapper maintains API compatibility with the old singleton agent system
 * while redirecting calls to the new multi-agent system. This allows existing
 * code (like legacy chat routes) to continue working during transition.
 */

import { Agent } from '@openai/agents';
import { MultiAgentManager } from './multi-agent-manager.js';
import type { AgentConfig } from '../types/agent.js';

// Legacy error classes (preserved for backward compatibility)
export class AgentInitializationError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'AgentInitializationError';
  }
}

export class AgentConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AgentConfigurationError';
  }
}

export class AgentRuntimeError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'AgentRuntimeError';
  }
}

/**
 * Legacy agent configuration (reconstructed from triage agent)
 */
function getLegacyAgentConfig(): AgentConfig {
  return {
    name: 'waddle-customer-service-agent', // Legacy name
    model: process.env.AGENT_MODEL || 'gpt-4o-mini',
    persona: 'You are a helpful customer service agent for Waddle.', // Simplified legacy persona
    settings: {
      requireApprovalForTools: true,
      maxConversationTurns: 20,
      enableDebugLogging: process.env.NODE_ENV === 'development',
      toolTimeout: 30000,
    }
  };
}

/**
 * Legacy function to get agent configuration
 */
export function getAgentConfig(): AgentConfig {
  return getLegacyAgentConfig();
}

/**
 * Legacy function to create an agent (now redirects to triage agent)
 */
export async function createAgent(): Promise<Agent<any>> {
  try {
    console.log('[Legacy Agent] Redirecting to multi-agent system...');
    
    const manager = MultiAgentManager.getInstance();
    await manager.initialize();
    
    // Get the triage agent (main entry point)
    const registry = (await import('../agents/index.js')).getAgentRegistry();
    const agent = registry.get('triage');
    
    if (!agent) {
      throw new AgentInitializationError('Failed to get triage agent from multi-agent system');
    }
    
    console.log('[Legacy Agent] Successfully redirected to triage agent');
    return agent;
    
  } catch (error) {
    console.error('[Legacy Agent] Failed to create legacy agent:', error);
    throw new AgentInitializationError(
      `Failed to create legacy agent: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Legacy singleton instance management
 */
let legacyAgentInstance: Agent<any> | null = null;

/**
 * Legacy function to get singleton agent instance
 */
export async function getAgent(): Promise<Agent<any>> {
  if (!legacyAgentInstance) {
    legacyAgentInstance = await createAgent();
  }
  return legacyAgentInstance;
}

/**
 * Legacy function to reset agent instance
 */
export function resetAgent(): void {
  const config = getLegacyAgentConfig();
  if (config.settings.enableDebugLogging) {
    console.log('[Legacy Agent] Resetting legacy agent instance');
  }
  legacyAgentInstance = null;
}

/**
 * Legacy AgentManager class (redirects to MultiAgentManager)
 */
export class AgentManager {
  private static instance: AgentManager;
  
  private constructor() {}

  static getInstance(): AgentManager {
    if (!AgentManager.instance) {
      AgentManager.instance = new AgentManager();
    }
    return AgentManager.instance;
  }

  async initialize(): Promise<void> {
    console.log('[Legacy AgentManager] Redirecting to MultiAgentManager...');
    const multiManager = MultiAgentManager.getInstance();
    await multiManager.initialize();
  }

  async getAgent(): Promise<Agent<any>> {
    return getAgent();
  }

  async healthCheck(): Promise<boolean> {
    const multiManager = MultiAgentManager.getInstance();
    return multiManager.healthCheck();
  }

  reset(): void {
    resetAgent();
  }

  async shutdown(): Promise<void> {
    const multiManager = MultiAgentManager.getInstance();
    await multiManager.shutdown();
  }

  getStatus() {
    const multiManager = MultiAgentManager.getInstance();
    const status = multiManager.getStatus();
    
    // Convert to legacy format
    return {
      isInitialized: status.initialized,
      isShuttingDown: status.shutting_down,
      lastHealthCheck: new Date(),
      agentName: 'waddle-customer-service-agent', // Legacy name
    };
  }

  isReady(): boolean {
    const multiManager = MultiAgentManager.getInstance();
    const status = multiManager.getStatus();
    return status.initialized && !status.shutting_down;
  }
}