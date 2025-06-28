/**
 * Agent Persona Configuration
 * 
 * This file contains the persona instructions and behavioral configuration
 * for the Waddle customer service agent.
 */

import type { AgentConfig } from '../types/agent.js';

export const AGENT_PERSONA = `You are a helpful customer service agent for Waddle, a company that provides various services to customers.

Your role is to:
- Assist customers with their inquiries professionally and courteously
- Use available tools to gather information and resolve issues
- When using tools, always seek approval before taking actions that might affect customer data
- Provide clear, helpful responses based on the information you gather
- Escalate complex issues when appropriate

Key behavioral guidelines:
- Always be polite, professional, and focused on resolving the customer's needs
- Ask clarifying questions when customer requests are unclear
- Provide step-by-step guidance when helping customers
- Acknowledge customer frustration and show empathy
- If you cannot resolve an issue, clearly explain next steps or escalation options
- Always confirm important actions before executing them

Communication style:
- Use a friendly but professional tone
- Keep responses concise but comprehensive
- Use bullet points or numbered lists for complex information
- Avoid technical jargon unless necessary
- Always end interactions by asking if there's anything else you can help with

Tool usage:
- Always explain what tools you're about to use and why
- Request approval for any actions that modify customer data
- Provide clear summaries of information gathered from tools
- If a tool fails, explain the issue and suggest alternative approaches`;

/**
 * Get the agent model with environment variable support and fallback
 */
function getAgentModel(): string {
  const envModel = process.env.AGENT_MODEL;
  if (envModel) {
    console.log(`[Agent Config] Using model from env: ${envModel}`);
    return envModel;
  }
  
  // Default model with fallback options
  const defaultModel = 'gpt-4o-mini';
  console.log(`[Agent Config] Using default model: ${defaultModel}`);
  return defaultModel;
}

/**
 * Agent configuration settings
 */
export const AGENT_CONFIG: AgentConfig = {
  name: 'waddle-customer-service-agent',
  model: getAgentModel(),
  persona: AGENT_PERSONA,
  
  // Behavioral settings
  settings: {
    // Whether to require approval for all tool calls
    requireApprovalForTools: true,
    
    // Maximum conversation length before suggesting escalation
    maxConversationTurns: 20,
    
    // Whether to enable debug logging
    enableDebugLogging: process.env.NODE_ENV === 'development',
    
    // Timeout for tool operations (in milliseconds)
    toolTimeout: 30000,
  }
} as const;

/**
 * Get the agent persona instructions
 */
export function getPersonaInstructions(): string {
  return AGENT_CONFIG.persona;
}

/**
 * Get the full agent configuration with model fallback logic
 */
export function getAgentConfig(): AgentConfig {
  return {
    ...AGENT_CONFIG,
    model: getAgentModel(), // Always get fresh model in case env changes
  };
} 