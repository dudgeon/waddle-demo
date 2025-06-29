/**
 * Multi-Agent Manager - SDK-aligned agent lifecycle management
 * 
 * Replaces the singleton pattern with a scalable multi-agent system
 * that follows OpenAI Agents SDK best practices.
 */

import { run } from '@openai/agents';
import { getAgentRegistry } from '../agents/index.js';
import { loadTools, convertToolsForAgent } from './loadTools.js';
import type { AgentContext, AgentType, AgentResult } from '../agents/types.js';

/**
 * Multi-agent manager with SDK-aligned patterns
 */
export class MultiAgentManager {
  private static instance: MultiAgentManager;
  private isInitialized = false;
  private isShuttingDown = false;
  private initializationPromise: Promise<void> | null = null;

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
      
      // Load tools first (shared across agents)
      const toolDefinitions = await loadTools();
      const tools = convertToolsForAgent(toolDefinitions);
      
      console.log(`[MultiAgentManager] Loaded ${tools.length} tools for agents`);
      
      // Import and register all agents
      await this.loadAgents(tools);
      
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
  private async loadAgents(tools: any[]): Promise<void> {
    // Dynamic imports to avoid circular dependencies
    const { createTriageAgent } = await import('../agents/triage-agent.js');
    
    const registry = getAgentRegistry();
    
    // Create triage agent with available tools
    const triageAgent = createTriageAgent(tools);
    
    // Register triage agent (converted from original customer service agent)
    registry.register({
      type: 'triage',
      agent: triageAgent,
      description: 'Analyzes customer inquiries and provides support (converted from customer service agent)',
      canReceiveHandoffs: false, // Main entry point
      metadata: {
        model: (triageAgent.model || 'gpt-4o-mini').toString(),
        toolCount: tools.length,
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
    options: { stream?: boolean } = {}
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

      // Use SDK's run function with context injection
      const result = options.stream === true 
        ? await run(agent, message, { context, stream: true })
        : await run(agent, message, { context, stream: false });

      const executionTime = Date.now() - startTime;
      
      if (context.isDebug) {
        console.log(`[MultiAgentManager] ${agentType} agent completed in ${executionTime}ms`);
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