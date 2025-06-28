import { Agent } from '@openai/agents';
import { getAgentConfig } from '../config/persona';

// Environment variables will be checked when creating the agent

/**
 * Create and configure the OpenAI Agent
 */
export async function createAgent(): Promise<Agent> {
  // Check for required environment variables
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
  
  // Start with empty tools array (will be populated in task 3.4)
  const tools: any[] = [];
  
  // Get agent configuration from config file
  const config = getAgentConfig();
  
  // Create the agent with configuration from persona.ts
  const agent = new Agent({
    name: config.name,
    model: config.model,
    instructions: config.persona,
    tools: tools,
  });
  
  return agent;
}

/**
 * Get a singleton instance of the agent
 */
let agentInstance: Agent | null = null;

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
  agentInstance = null;
} 