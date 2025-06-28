import { Agent } from '@openai/agents';
import dotenv from 'dotenv';
import { getAgentConfig as getPersonaConfig } from '../config/persona';
import { loadTools, convertToolsForAgent } from './loadTools';
import type { AgentConfig } from '../types/agent';

// Load environment variables
dotenv.config();

/**
 * Get agent configuration with persona loading
 */
export function getAgentConfig(): AgentConfig {
  // Get base configuration from persona.ts
  const personaConfig = getPersonaConfig();
  
  // Check for environment variable persona override
  const envPersona = process.env.AGENT_PERSONA;
  
  return {
    name: personaConfig.name,
    model: personaConfig.model,
    persona: envPersona || personaConfig.persona,
    settings: {
      requireApprovalForTools: personaConfig.settings.requireApprovalForTools,
      maxConversationTurns: personaConfig.settings.maxConversationTurns,
      enableDebugLogging: personaConfig.settings.enableDebugLogging,
      toolTimeout: personaConfig.settings.toolTimeout,
    }
  };
}

/**
 * Create and configure the OpenAI Agent
 */
export async function createAgent(): Promise<Agent> {
  // Check for required environment variables
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
  
  // Get agent configuration from persona.ts
  const config = getAgentConfig();
  
  // Load available tools
  const toolDefinitions = await loadTools();
  const tools = convertToolsForAgent(toolDefinitions);
  
  // Create the agent with configuration
  const agent = new Agent({
    name: config.name,
    model: config.model,
    instructions: config.persona,
    tools: tools,
  });
  
  // Log agent creation in development
  if (config.settings.enableDebugLogging) {
    console.log(`[Agent] Created agent: ${config.name}`);
    console.log(`[Agent] Model: ${config.model}`);
    console.log(`[Agent] Tools loaded: ${tools.length}`);
    if (toolDefinitions.length > 0) {
      console.log(`[Agent] Available tools: ${toolDefinitions.map(t => t.name).join(', ')}`);
    }
  }
  
  return agent;
}

/**
 * Agent instance management
 */
let agentInstance: Agent | null = null;

/**
 * Get a singleton instance of the agent
 */
export async function getAgent(): Promise<Agent> {
  if (!agentInstance) {
    agentInstance = await createAgent();
  }
  return agentInstance;
}

/**
 * Reset the agent instance (useful for testing or configuration changes)
 */
export function resetAgent(): void {
  if (agentInstance) {
    const config = getAgentConfig();
    if (config.settings.enableDebugLogging) {
      console.log('[Agent] Resetting agent instance');
    }
  }
  agentInstance = null;
}

/**
 * Agent lifecycle management
 */
export class AgentManager {
  private static instance: AgentManager;
  private agent: Agent | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): AgentManager {
    if (!AgentManager.instance) {
      AgentManager.instance = new AgentManager();
    }
    return AgentManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.agent = await createAgent();
      this.isInitialized = true;
      
      const config = getAgentConfig();
      if (config.settings.enableDebugLogging) {
        console.log('[AgentManager] Agent initialized successfully');
      }
    } catch (error) {
      console.error('[AgentManager] Failed to initialize agent:', error);
      throw error;
    }
  }

  async getAgent(): Promise<Agent> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    if (!this.agent) {
      throw new Error('Agent not initialized');
    }
    
    return this.agent;
  }

  reset(): void {
    this.agent = null;
    this.isInitialized = false;
    resetAgent();
  }

  isReady(): boolean {
    return this.isInitialized && this.agent !== null;
  }
} 