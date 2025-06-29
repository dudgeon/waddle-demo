/**
 * Triage Agent - Routes customer inquiries to appropriate specialists
 * 
 * Uses OpenAI Agents SDK patterns:
 * - Dynamic instructions based on context
 * - Structured output with Zod schemas  
 * - Handoff capabilities to specialist agents
 */

import { Agent } from '@openai/agents';
import type { AgentContext, RunContext } from './types.js';

// Note: Structured output schemas can be added here when needed for specific use cases

/**
 * Dynamic instructions function that adapts based on context
 */
function buildTriageInstructions(runContext: RunContext<AgentContext>, _agent: any): string {
  const { context } = runContext;
  const debugMode = context.isDebug ? '\n\nDEBUG MODE: Always explain your routing reasoning in detail.' : '';
  const userContext = context.userId ? `\nCustomer ID: ${context.userId}` : '\nNo customer authentication detected';
  
  return `You are a customer service agent for Waddle, a company that provides various services to customers.

${userContext}
Session: ${context.sessionId}
Source: ${context.source}

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
- If a tool fails, explain the issue and suggest alternative approaches

${debugMode}`;
}

/**
 * Create the customer service agent with SDK-aligned configuration
 * Converted from legacy persona.ts approach to use dynamic instructions and proper SDK patterns
 */
export function createTriageAgent(tools: any[] = []) {
  return new Agent<AgentContext>({
    name: 'triage-agent',
    model: process.env.TRIAGE_AGENT_MODEL || process.env.AGENT_MODEL || 'gpt-4o-mini',
    instructions: buildTriageInstructions,
    // outputType: RoutingDecision, // TODO: Re-enable when SDK types are fixed
    tools: tools, // Available tools for the agent
  });
}

// Helper functions can be added here as needed for customer service operations