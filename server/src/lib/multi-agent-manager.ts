/**
 * Multi-Agent Manager - SDK-aligned agent lifecycle management
 * 
 * Replaces the singleton pattern with a scalable multi-agent system
 * that follows OpenAI Agents SDK best practices.
 */

import { run, AgentInputItem } from '@openai/agents';
import { getAgentRegistry } from '../agents/index.js';
import { loadTools, convertToolsForAgent, loadMCPConfigurations } from './loadTools.js';
import { makeInstrumentedMcpTool } from './mcp-tool-wrapper.js';
import type { AgentContext, AgentType, AgentResult } from '../agents/types.js';

/**
 * Multi-agent manager with SDK-aligned patterns
 */
export class MultiAgentManager {
  private static instance: MultiAgentManager;
  private isInitialized = false;
  private isShuttingDown = false;
  private initializationPromise: Promise<void> | null = null;
  private conversationThreads = new Map<string, AgentInputItem[]>();

  private constructor() {
    this.setupShutdownHandlers();
  }

  static getInstance(): MultiAgentManager {
    if (!MultiAgentManager.instance) {
      MultiAgentManager.instance = new MultiAgentManager();
    }
    return MultiAgentManager.instance;
  }

  /**
   * Initialize all agents in the registry
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.doInitialize();
    
    try {
      await this.initializationPromise;
    } finally {
      this.initializationPromise = null;
    }
  }

  private async doInitialize(): Promise<void> {
    try {
      console.log('[MultiAgentManager] Initializing multi-agent system...');
      
      // Load local tools and MCP configurations separately
      console.log('[MultiAgentManager] Loading tools and MCP configurations...');
      const [toolDefinitions, mcpConfigurations] = await Promise.all([
        loadTools().catch(error => {
          console.error('[MultiAgentManager] Failed to load tools:', error);
          throw error;
        }),
        loadMCPConfigurations().catch(error => {
          console.error('[MultiAgentManager] Failed to load MCP configurations:', error);
          throw error;
        })
      ]);
      
      // Convert local tools to SDK format
      console.log('[MultiAgentManager] Converting tools for agent...');
      const localTools = convertToolsForAgent(toolDefinitions);
      
      // Create MCP tools with instrumentation for visibility
      const mcpTools = mcpConfigurations.map(config => makeInstrumentedMcpTool(config));
      
      console.log(`[MultiAgentManager] Loaded ${localTools.length} local tools and ${mcpTools.length} MCP tools`);
      
      // Import and register all agents
      await this.loadAgents(localTools, mcpTools);
      
      const registry = getAgentRegistry();
      registry.markInitialized();
      
      this.isInitialized = true;
      
      console.log(`[MultiAgentManager] Initialized with ${registry.count()} agents`);
      
      if (process.env.NODE_ENV === 'development') {
        this.logAgentStatus();
      }
      
    } catch (error) {
      console.error('[MultiAgentManager] Initialization failed:', error);
      throw new Error(`Failed to initialize multi-agent system: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load and register agent definitions
   */
  private async loadAgents(localTools: any[], mcpTools: any[]): Promise<void> {
    // Dynamic imports to avoid circular dependencies
    const { createTriageAgent } = await import('../agents/triage-agent.js');
    
    const registry = getAgentRegistry();
    
    // Create triage agent with both local and MCP tools
    const triageAgent = createTriageAgent(localTools, mcpTools);
    
    // Register triage agent (converted from original customer service agent)
    registry.register({
      type: 'triage',
      agent: triageAgent,
      description: 'Analyzes customer inquiries and provides support (converted from customer service agent)',
      canReceiveHandoffs: false, // Main entry point
      metadata: {
        model: (triageAgent.model || 'gpt-4o-mini').toString(),
        toolCount: localTools.length + mcpTools.length,
        hasStructuredOutput: true,
        supportedCapabilities: ['customer_service', 'inquiry_analysis', 'support'],
      },
    });
  }

  /**
   * Run an agent with the provided message and context
   */
  async runAgent(
    agentType: AgentType,
    message: string,
    context: AgentContext,
    options: { stream?: boolean; sseEmitter?: (event: string, data: any) => void } = {}
  ): Promise<AgentResult> {
    if (this.isShuttingDown) {
      throw new Error('Multi-agent system is shutting down');
    }

    if (!this.isInitialized) {
      await this.initialize();
    }

    const registry = getAgentRegistry();
    const agent = registry.get(agentType);
    
    if (!agent) {
      throw new Error(`Agent type '${agentType}' not found. Available: ${registry.getTypes().join(', ')}`);
    }

    const startTime = Date.now();
    
    try {
      if (context.isDebug) {
        console.log(`[MultiAgentManager] Running ${agentType} agent with message: "${message.substring(0, 100)}..."`);
      }

      // Get existing conversation thread for this session
      const thread = this.getOrCreateThread(context.sessionId);
      
      // Create new user message
      const newMessage: AgentInputItem = { role: 'user', content: message };
      
      // Run agent with conversation history + new message
      const conversationInput = thread.concat(newMessage);
      
      if (context.isDebug) {
        console.log(`[MultiAgentManager] Session ${context.sessionId} has ${thread.length} previous messages`);
      }

      // Use SDK's run function with conversation history and context injection
      console.log('[MultiAgentManager] Running agent...', {
        agentType,
        streaming: options.stream === true,
        sessionId: context.sessionId,
        messageLength: message.length
      });
      
      const result = options.stream === true 
        ? await run(agent, conversationInput, { context, stream: true })
        : await run(agent, conversationInput, { context, stream: false });

      console.log('[MultiAgentManager] Agent run completed', {
        hasResult: !!result,
        hasInterruptions: !!(result.interruptions && result.interruptions.length > 0),
        interruptionCount: result.interruptions?.length || 0,
        hasRawResponses: !!result.rawResponses,
        hasFinalOutput: !!result.finalOutput,
        streaming: options.stream === true,
        sessionId: context.sessionId
      });

      // Handle MCP tool approval interruptions
      console.log('[MultiAgentManager] Checking for interruptions...', {
        hasInterruptions: result.interruptions && result.interruptions.length > 0,
        interruptionCount: result.interruptions?.length || 0,
        sessionId: context.sessionId,
        allInterruptions: result.interruptions,
        resultKeys: Object.keys(result || {})
      });
      
      // Note: Interruption handling moved to streaming routes for better event correlation
      // The interruptions are processed during the streaming event loop where we have
      // better access to the event structure and can emit UI notifications in real-time
      if (result.interruptions && result.interruptions.length > 0) {
        console.log('[MultiAgentManager] Interruptions detected:', result.interruptions.length);
        console.log('[MultiAgentManager] Note: Interruption handling moved to streaming routes for better UI integration');
      }

      // Update conversation thread with result history
      this.conversationThreads.set(context.sessionId, result.history);

      const executionTime = Date.now() - startTime;
      
      if (context.isDebug) {
        console.log(`[MultiAgentManager] ${agentType} agent completed in ${executionTime}ms, thread now has ${result.history.length} messages`);
      }

      return {
        finalOutput: result.finalOutput || 'No response generated',
        agentType,
        metadata: {
          executionTime,
          tokenUsage: result.rawResponses?.[result.rawResponses.length - 1]?.usage,
          handoffOccurred: result.lastAgent?.name !== agent.name,
          toolsUsed: [], // TODO: Extract from result
        },
        rawResponse: result,
      };

    } catch (error) {
      console.error(`[MultiAgentManager] Error running ${agentType} agent:`, error);
      throw new Error(`Agent execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get the default entry agent (triage)
   */
  getDefaultAgent(): AgentType {
    return 'triage';
  }

  /**
   * Create agent context from request parameters
   */
  createContext(params: {
    sessionId: string;
    userId?: string;
    source?: 'ui' | 'api' | 'test';
    metadata?: Record<string, any>;
  }): AgentContext {
    return {
      sessionId: params.sessionId,
      userId: params.userId,
      isDebug: process.env.NODE_ENV === 'development',
      timestamp: new Date(),
      source: params.source || 'api',
      metadata: params.metadata,
    };
  }

  /**
   * Get or create conversation thread for a session
   */
  private getOrCreateThread(sessionId: string): AgentInputItem[] {
    if (!this.conversationThreads.has(sessionId)) {
      this.conversationThreads.set(sessionId, []);
      if (process.env.NODE_ENV === 'development') {
        console.log(`[MultiAgentManager] Created new conversation thread for session: ${sessionId}`);
      }
    }
    return this.conversationThreads.get(sessionId)!;
  }

  /**
   * Clear conversation thread for a specific session
   */
  clearThread(sessionId: string): void {
    const deleted = this.conversationThreads.delete(sessionId);
    if (deleted && process.env.NODE_ENV === 'development') {
      console.log(`[MultiAgentManager] Cleared conversation thread for session: ${sessionId}`);
    }
  }

  /**
   * Get count of active conversation threads
   */
  getThreadCount(): number {
    return this.conversationThreads.size;
  }

  /**
   * Get conversation thread for a session (for debugging)
   */
  getThread(sessionId: string): AgentInputItem[] | undefined {
    return this.conversationThreads.get(sessionId);
  }

  /**
   * Get system status for health checks
   */
  getStatus(): {
    initialized: boolean;
    shutting_down: boolean;
    agent_count: number;
    agents: Array<{
      type: AgentType;
      description: string;
      model: string;
      canReceiveHandoffs: boolean;
    }>;
  } {
    const registry = getAgentRegistry();
    
    return {
      initialized: this.isInitialized,
      shutting_down: this.isShuttingDown,
      agent_count: registry.count(),
      agents: registry.getAll().map(reg => ({
        type: reg.type,
        description: reg.description,
        model: reg.metadata.model,
        canReceiveHandoffs: reg.canReceiveHandoffs,
      })),
    };
  }

  /**
   * Health check for the multi-agent system
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isInitialized || this.isShuttingDown) {
        return false;
      }

      const registry = getAgentRegistry();
      
      // Check that we have the minimum required agents
      const requiredAgents: AgentType[] = ['triage'];
      const hasRequiredAgents = requiredAgents.every(type => registry.has(type));
      
      if (!hasRequiredAgents) {
        console.warn('[MultiAgentManager] Health check failed: missing required agents');
        return false;
      }

      return true;
    } catch (error) {
      console.error('[MultiAgentManager] Health check failed:', error);
      return false;
    }
  }

  /**
   * Graceful shutdown of the multi-agent system
   */
  async shutdown(): Promise<void> {
    console.log('[MultiAgentManager] Shutting down multi-agent system...');
    this.isShuttingDown = true;
    
    const registry = getAgentRegistry();
    registry.clear();
    
    this.isInitialized = false;
    console.log('[MultiAgentManager] Shutdown complete');
  }

  /**
   * Set up graceful shutdown handlers
   */
  private setupShutdownHandlers(): void {
    const shutdownHandler = async (signal: string) => {
      console.log(`[MultiAgentManager] Received ${signal}, shutting down gracefully...`);
      await this.shutdown();
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
    process.on('SIGINT', () => shutdownHandler('SIGINT'));
  }

  /**
   * Log agent status for debugging
   */
  private logAgentStatus(): void {
    const registry = getAgentRegistry();
    const status = registry.getStatus();
    
    console.log('[MultiAgentManager] Agent Status:');
    status.agents.forEach(agent => {
      console.log(`  - ${agent.type}: ${agent.description}`);
      console.log(`    Model: ${agent.model}, Tools: ${agent.toolCount}, Handoffs: ${agent.canReceiveHandoffs}`);
    });
  }
}