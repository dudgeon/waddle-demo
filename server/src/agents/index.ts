/**
 * Agent Registry - Central management for multi-agent system
 * 
 * Provides agent discovery, registration, and management following
 * OpenAI Agents SDK patterns with full TypeScript support.
 */

import type { Agent } from '@openai/agents';
import type { AgentContext, AgentType, AgentRegistration } from './types.js';

/**
 * Central registry for managing multiple agents
 */
export class AgentRegistry {
  private static instance: AgentRegistry;
  private agents = new Map<AgentType, AgentRegistration>();
  private initialized = false;

  private constructor() {}

  static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  /**
   * Register an agent with the registry
   */
  register(registration: AgentRegistration): void {
    if (this.agents.has(registration.type)) {
      console.warn(`[AgentRegistry] Agent ${registration.type} is already registered, overwriting`);
    }

    this.agents.set(registration.type, registration);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AgentRegistry] Registered agent: ${registration.type}`);
      console.log(`[AgentRegistry] - Model: ${registration.metadata.model}`);
      console.log(`[AgentRegistry] - Tools: ${registration.metadata.toolCount}`);
      console.log(`[AgentRegistry] - Capabilities: ${registration.metadata.supportedCapabilities.join(', ')}`);
    }
  }

  /**
   * Get a specific agent by type
   */
  get(type: AgentType): Agent<AgentContext> | undefined {
    const registration = this.agents.get(type);
    return registration?.agent;
  }

  /**
   * Get agent registration details
   */
  getRegistration(type: AgentType): AgentRegistration | undefined {
    return this.agents.get(type);
  }

  /**
   * Get all registered agents
   */
  getAll(): Array<AgentRegistration> {
    return Array.from(this.agents.values());
  }

  /**
   * Get agents that can receive handoffs
   */
  getHandoffTargets(): Array<AgentRegistration> {
    return this.getAll().filter(reg => reg.canReceiveHandoffs);
  }

  /**
   * Check if an agent type is registered
   */
  has(type: AgentType): boolean {
    return this.agents.has(type);
  }

  /**
   * Get the count of registered agents
   */
  count(): number {
    return this.agents.size;
  }

  /**
   * Get agent types
   */
  getTypes(): AgentType[] {
    return Array.from(this.agents.keys());
  }

  /**
   * Unregister an agent
   */
  unregister(type: AgentType): boolean {
    const removed = this.agents.delete(type);
    if (removed && process.env.NODE_ENV === 'development') {
      console.log(`[AgentRegistry] Unregistered agent: ${type}`);
    }
    return removed;
  }

  /**
   * Clear all agents
   */
  clear(): void {
    this.agents.clear();
    this.initialized = false;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[AgentRegistry] Cleared all agents');
    }
  }

  /**
   * Mark registry as initialized
   */
  markInitialized(): void {
    this.initialized = true;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AgentRegistry] Initialized with ${this.count()} agents`);
    }
  }

  /**
   * Check if registry is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get registry status for debugging/monitoring
   */
  getStatus(): {
    initialized: boolean;
    agentCount: number;
    agents: Array<{
      type: AgentType;
      description: string;
      model: string;
      toolCount: number;
      canReceiveHandoffs: boolean;
    }>;
  } {
    return {
      initialized: this.initialized,
      agentCount: this.count(),
      agents: this.getAll().map(reg => ({
        type: reg.type,
        description: reg.description,
        model: reg.metadata.model,
        toolCount: reg.metadata.toolCount,
        canReceiveHandoffs: reg.canReceiveHandoffs,
      })),
    };
  }
}

/**
 * Convenience function to get the singleton registry instance
 */
export function getAgentRegistry(): AgentRegistry {
  return AgentRegistry.getInstance();
}