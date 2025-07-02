import { hostedMcpTool } from '@openai/agents';

// Store recent MCP tool calls for correlation with streaming events
const recentMcpToolCalls = new Map<string, { toolName: string; timestamp: number; args?: any }>();

export interface McpConfig {
  serverLabel: string;
  serverUrl: string;
  headers?: Record<string, string>;
}

export function makeInstrumentedMcpTool(config: McpConfig) {
  // Create the MCP tool WITH approval requirement for visibility
  // This will trigger interruptions that we can use for UI activation
  return hostedMcpTool({
    ...config,
    requireApproval: 'always'
  });
}

export function makeInstrumentedMcpToolWithoutApproval(config: McpConfig) {
  // Version without approval for testing
  return hostedMcpTool({
    ...config,
    requireApproval: 'never'
  });
}

// Function to handle approval and extract tool information
export function handleMcpToolApproval(sessionId: string, toolName: string, toolArgs: any = {}) {
  console.log('[MCP Tool Approval]', {
    toolName,
    toolArgs,
    sessionId,
    timestamp: new Date().toISOString()
  });
  
  // Store tool call info for correlation with streaming events
  const key = sessionId || 'default';
  recentMcpToolCalls.set(key, {
    toolName,
    args: toolArgs,
    timestamp: Date.now()
  });
}

export function getRecentMcpToolCall(sessionId: string): string | null {
  // Lazy cleanup: remove old entries when accessed
  const now = Date.now();
  for (const [key, value] of recentMcpToolCalls.entries()) {
    if (now - value.timestamp > 10000) { // Remove entries older than 10 seconds
      recentMcpToolCalls.delete(key);
    }
  }
  
  const call = recentMcpToolCalls.get(sessionId || 'default');
  
  // Only return if recent (within 5 seconds)
  if (call && now - call.timestamp < 5000) {
    return call.toolName;
  }
  
  return null;
}

export function clearMcpToolCall(sessionId: string): void {
  recentMcpToolCalls.delete(sessionId || 'default');
}