/**
 * Tool Discovery System for OpenAI Agents SDK
 * 
 * This module handles the discovery and loading of tools for the agent.
 * Initially returns an empty array, but designed to be extensible for:
 * - Internal API tools
 * - External MCP servers
 * - Database query tools
 * - CRM integration tools
 */

export interface ToolDefinition {
  /** Tool name identifier */
  name: string;
  
  /** Tool description for the agent */
  description: string;
  
  /** Tool parameters schema (JSON Schema) */
  parameters?: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  
  /** Tool implementation function */
  implementation: (args: Record<string, any>) => Promise<any>;
  
  /** Whether this tool requires approval before execution */
  requiresApproval?: boolean;
  
  /** Tool category for organization */
  category?: 'database' | 'crm' | 'api' | 'mcp' | 'utility';
}

/**
 * Tool registry for managing available tools
 */
class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();
  private initialized = false;

  /**
   * Register a new tool
   */
  register(tool: ToolDefinition): void {
    if (this.tools.has(tool.name)) {
      console.warn(`[ToolRegistry] Tool ${tool.name} is already registered, overwriting`);
    }
    this.tools.set(tool.name, tool);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ToolRegistry] Registered tool: ${tool.name} (${tool.category || 'uncategorized'})`);
    }
  }

  /**
   * Unregister a tool
   */
  unregister(toolName: string): boolean {
    const removed = this.tools.delete(toolName);
    if (removed && process.env.NODE_ENV === 'development') {
      console.log(`[ToolRegistry] Unregistered tool: ${toolName}`);
    }
    return removed;
  }

  /**
   * Get all registered tools
   */
  getAll(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get a specific tool by name
   */
  get(toolName: string): ToolDefinition | undefined {
    return this.tools.get(toolName);
  }

  /**
   * Get tools by category
   */
  getByCategory(category: string): ToolDefinition[] {
    return this.getAll().filter(tool => tool.category === category);
  }

  /**
   * Check if a tool is registered
   */
  has(toolName: string): boolean {
    return this.tools.has(toolName);
  }

  /**
   * Get the count of registered tools
   */
  count(): number {
    return this.tools.size;
  }

  /**
   * Clear all tools
   */
  clear(): void {
    this.tools.clear();
    this.initialized = false;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[ToolRegistry] Cleared all tools');
    }
  }

  /**
   * Mark registry as initialized
   */
  markInitialized(): void {
    this.initialized = true;
  }

  /**
   * Check if registry is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Singleton instance
const toolRegistry = new ToolRegistry();

/**
 * Load all available tools for the agent
 * Currently returns empty array, will be extended in future tasks
 */
export async function loadTools(): Promise<ToolDefinition[]> {
  if (toolRegistry.isInitialized()) {
    return toolRegistry.getAll();
  }

  try {
    // Phase 1: Start with empty tools array
    // Future phases will add:
    // - await loadInternalTools()
    // - await loadMCPTools()
    // - await loadDatabaseTools()
    // - await loadCRMTools()

    const tools: ToolDefinition[] = [];

    // Register any loaded tools
    tools.forEach(tool => toolRegistry.register(tool));
    
    toolRegistry.markInitialized();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[loadTools] Loaded ${tools.length} tools`);
      if (tools.length > 0) {
        console.log(`[loadTools] Available tools: ${tools.map(t => t.name).join(', ')}`);
      }
    }

    return tools;
  } catch (error) {
    console.error('[loadTools] Failed to load tools:', error);
    throw new Error(`Tool loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Reload tools (useful for development and testing)
 */
export async function reloadTools(): Promise<ToolDefinition[]> {
  toolRegistry.clear();
  return loadTools();
}

/**
 * Get tool registry instance for advanced operations
 */
export function getToolRegistry(): ToolRegistry {
  return toolRegistry;
}

/**
 * Convert tools to OpenAI Agents SDK format
 */
export function convertToolsForAgent(tools: ToolDefinition[]): any[] {
  return tools.map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters || {
        type: 'object',
        properties: {},
        required: []
      }
    }
  }));
}

/**
 * Execute a tool by name with given arguments
 */
export async function executeTool(toolName: string, args: Record<string, any>): Promise<any> {
  const tool = toolRegistry.get(toolName);
  
  if (!tool) {
    throw new Error(`Tool '${toolName}' not found`);
  }

  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[executeTool] Executing ${toolName} with args:`, args);
    }

    const result = await tool.implementation(args);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[executeTool] ${toolName} completed successfully`);
    }

    return result;
  } catch (error) {
    console.error(`[executeTool] Error executing ${toolName}:`, error);
    throw error;
  }
}

/**
 * Get tools that require approval
 */
export function getApprovalRequiredTools(): ToolDefinition[] {
  return toolRegistry.getAll().filter(tool => tool.requiresApproval === true);
}

/**
 * Future tool loading functions (placeholder implementations)
 */

// async function loadInternalTools(): Promise<ToolDefinition[]> {
//   // Will load internally defined API tools
//   return [];
// }

// async function loadMCPTools(): Promise<ToolDefinition[]> {
//   // Will discover and load MCP server tools
//   return [];
// }

// async function loadDatabaseTools(): Promise<ToolDefinition[]> {
//   // Will load database query tools
//   return [];
// }

// async function loadCRMTools(): Promise<ToolDefinition[]> {
//   // Will load CRM integration tools
//   return [];
// } 