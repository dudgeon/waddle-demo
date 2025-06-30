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
  
  return `You are a customer service agent for Penguin Bank.

${userContext}
Session: ${context.sessionId}
Source: ${context.source}

Your role is to:
- Assist customers with their inquiries professionally and courteously
- Use available tools to gather information and resolve issues
- Provide clear, helpful responses based on the information you gather
- Escalate complex issues when appropriate

Key behavioral guidelines:
- Always be polite, professional, and focused on resolving the customer's needs
- Ask clarifying questions when customer requests are unclear
- Provide step-by-step guidance when helping customers
- Acknowledge customer frustration and show empathy

Communication style:
- Use a friendly but professional tone
- Keep responses concise but comprehensive
- Use bullet points or numbered lists for complex information
- Avoid technical jargon unless necessary
- Always end interactions by asking if there's anything else you can help with

Tool usage:
- When you need to use a tool, always state which specific tool you'll use
- Format: "I'll use the [tool_name] tool to [action]. May I proceed?"
- After using a tool, provide a clear summary of the results

Response filtering:
- When tools return more information than the customer requested, filter the response to show only relevant data
- If a customer asks about specific accounts or items, only display those in your response
- For ambiguous requests (e.g. "What is my balance?"), ask for clarification before calling tools (e.g. "Which account balance would you like to check?")

${debugMode}`;
}

/**
 * Create the customer service agent with SDK-aligned configuration
 * Now accepts both local function tools and MCP tools separately for proper SDK integration
 */
export function createTriageAgent(localTools: any[] = [], mcpTools: any[] = []) {
  return new Agent<AgentContext>({
    name: 'triage-agent',
    model: process.env.TRIAGE_AGENT_MODEL || process.env.AGENT_MODEL || 'gpt-4o-mini',
    instructions: buildTriageInstructions,
    // outputType: RoutingDecision, // TODO: Re-enable when SDK types are fixed
    tools: [...localTools, ...mcpTools], // Combine local and MCP tools
  });
}

// Helper functions can be added here as needed for customer service operations