import { Agent } from '@openai/agents';
import dotenv from 'dotenv';
import path from 'path';
import { getAgentConfig as getPersonaConfig } from '../config/persona';
import { loadTools, convertToolsForAgent } from './loadTools';
import type { AgentConfig } from '../types/agent';

// Load environment variables from project root
dotenv.config({ path: path.join(__dirname, '../../../.env') });

/**
 * Custom error classes for agent lifecycle management
 */
export class AgentInitializationError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'AgentInitializationError';
  }
}

export class AgentConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AgentConfigurationError';
  }
}

export class AgentRuntimeError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'AgentRuntimeError';
  }
}

/**
 * Validate environment variables required for agent operation
 */
function validateEnvironment(): void {
  const requiredVars = ['OPENAI_API_KEY'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new AgentConfigurationError(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
  
  // Validate OpenAI API key format
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey && !apiKey.startsWith('sk-')) {
    throw new AgentConfigurationError(
      'OPENAI_API_KEY appears to be invalid (should start with "sk-")'
    );
  }
}

/**
 * Validate agent configuration
 */
function validateAgentConfig(config: AgentConfig): void {
  if (!config.name || config.name.trim().length === 0) {
    throw new AgentConfigurationError('Agent name is required');
  }
  
  if (!config.model || config.model.trim().length === 0) {
    throw new AgentConfigurationError('Agent model is required');
  }
  
  if (!config.persona || config.persona.trim().length === 0) {
    throw new AgentConfigurationError('Agent persona/instructions are required');
  }
  
  // Validate settings
  if (config.settings.maxConversationTurns < 1) {
    throw new AgentConfigurationError('maxConversationTurns must be at least 1');
  }
  
  if (config.settings.toolTimeout < 1000) {
    throw new AgentConfigurationError('toolTimeout must be at least 1000ms');
  }
}

/**
 * Get agent configuration with persona loading
 */
export function getAgentConfig(): AgentConfig {
  try {
    // Get base configuration from persona.ts
    const personaConfig = getPersonaConfig();
    
    // Check for environment variable persona override
    const envPersona = process.env.AGENT_PERSONA;
    
    const config: AgentConfig = {
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
    
    // Validate the configuration
    validateAgentConfig(config);
    
    return config;
  } catch (error) {
    if (error instanceof AgentConfigurationError) {
      throw error;
    }
    throw new AgentConfigurationError(
      `Failed to load agent configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Create and configure the OpenAI Agent
 */
export async function createAgent(): Promise<Agent> {
  try {
    console.log('[Agent] Starting agent creation...');
    
    // Validate environment first
    console.log('[Agent] Validating environment...');
    validateEnvironment();
    console.log('[Agent] Environment validation passed');
    
    // Get agent configuration from persona.ts
    console.log('[Agent] Loading agent configuration...');
    const config = getAgentConfig();
    console.log('[Agent] Agent configuration loaded:', {
      name: config.name,
      model: config.model,
      personaLength: config.persona.length
    });
    
    // Load available tools with error handling
    console.log('[Agent] Loading tools...');
    let toolDefinitions: any[] = [];
    let tools: any[] = [];
    try {
      toolDefinitions = await loadTools();
      tools = convertToolsForAgent(toolDefinitions);
      console.log('[Agent] Tools loaded successfully:', tools.length);
    } catch (error) {
      console.warn('[Agent] Failed to load tools, continuing without tools:', error);
      toolDefinitions = [];
      tools = [];
    }
    
    // Create the agent with configuration
    console.log('[Agent] Creating OpenAI Agent instance...');
    console.log('[Agent] Agent config for OpenAI:', {
      name: config.name,
      model: config.model,
      instructionsLength: config.persona.length,
      toolsCount: tools.length
    });
    
    const agent = new Agent({
      name: config.name,
      model: config.model,
      instructions: config.persona,
      tools: tools,
    });
    
    console.log('[Agent] OpenAI Agent instance created successfully');
    
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
  } catch (error) {
    console.error('[Agent] Agent creation failed at step:', error);
    console.error('[Agent] Full error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      cause: error instanceof Error && 'cause' in error ? error.cause : undefined
    });
    
    if (error instanceof AgentConfigurationError) {
      throw error;
    }
    throw new AgentInitializationError(
      `Failed to create agent: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Agent instance management (legacy singleton - kept for backward compatibility)
 */
let agentInstance: Agent | null = null;

/**
 * Get a singleton instance of the agent (legacy - use AgentManager instead)
 */
export async function getAgent(): Promise<Agent> {
  if (!agentInstance) {
    agentInstance = await createAgent();
  }
  return agentInstance;
}

/**
 * Reset the agent instance (legacy - use AgentManager instead)
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
 * Enhanced Agent lifecycle management with proper error handling
 */
export class AgentManager {
  private static instance: AgentManager;
  private agent: Agent | null = null;
  private isInitialized = false;
  private isShuttingDown = false;
  private initializationPromise: Promise<void> | null = null;
  private lastHealthCheck: Date | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Set up graceful shutdown handlers
    this.setupShutdownHandlers();
  }

  static getInstance(): AgentManager {
    if (!AgentManager.instance) {
      AgentManager.instance = new AgentManager();
    }
    return AgentManager.instance;
  }

  /**
   * Initialize the agent with proper error handling and retries
   */
  async initialize(retries = 3): Promise<void> {
    // If already initialized, return
    if (this.isInitialized && this.agent) {
      return;
    }

    // If initialization is in progress, wait for it
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Start initialization
    this.initializationPromise = this.doInitialize(retries);
    
    try {
      await this.initializationPromise;
    } finally {
      this.initializationPromise = null;
    }
  }

  private async doInitialize(retries: number): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const config = getAgentConfig();
        
        if (config.settings.enableDebugLogging) {
          console.log(`[AgentManager] Initializing agent (attempt ${attempt}/${retries})...`);
        }

        this.agent = await createAgent();
        this.isInitialized = true;
        this.lastHealthCheck = new Date();
        
        // Start health check monitoring
        this.startHealthChecking();
        
        if (config.settings.enableDebugLogging) {
          console.log('[AgentManager] Agent initialized successfully');
        }
        
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        console.error(`[AgentManager] Initialization attempt ${attempt} failed:`, lastError.message);
        
        if (attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
          console.log(`[AgentManager] Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new AgentInitializationError(
      `Failed to initialize agent after ${retries} attempts`,
      lastError || undefined
    );
  }

  /**
   * Get the agent instance with automatic initialization
   */
  async getAgent(): Promise<Agent> {
    if (this.isShuttingDown) {
      throw new AgentRuntimeError('Agent is shutting down');
    }

    if (!this.isInitialized || !this.agent) {
      await this.initialize();
    }
    
    if (!this.agent) {
      throw new AgentRuntimeError('Agent not available after initialization');
    }
    
    this.lastHealthCheck = new Date();
    return this.agent;
  }

  /**
   * Perform a health check on the agent
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.agent || !this.isInitialized) {
        return false;
      }

      // Basic health check - ensure agent is accessible
      const agentName = this.agent.name;
      const isHealthy = typeof agentName === 'string' && agentName.length > 0;
      
      if (isHealthy) {
        this.lastHealthCheck = new Date();
      }
      
      return isHealthy;
    } catch (error) {
      console.error('[AgentManager] Health check failed:', error);
      return false;
    }
  }

  /**
   * Start periodic health checking
   */
  private startHealthChecking(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Health check every 5 minutes
    this.healthCheckInterval = setInterval(async () => {
      const isHealthy = await this.healthCheck();
      if (!isHealthy) {
        console.warn('[AgentManager] Health check failed, resetting agent');
        this.reset();
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Reset the agent instance
   */
  reset(): void {
    try {
      const config = getAgentConfig();
      if (config.settings.enableDebugLogging) {
        console.log('[AgentManager] Resetting agent instance');
      }
    } catch (error) {
      console.warn('[AgentManager] Could not load config during reset:', error);
    }

    this.agent = null;
    this.isInitialized = false;
    this.lastHealthCheck = null;
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    // Reset legacy singleton too
    resetAgent();
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('[AgentManager] Shutting down...');
    this.isShuttingDown = true;
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    this.reset();
    console.log('[AgentManager] Shutdown complete');
  }

  /**
   * Set up graceful shutdown handlers
   */
  private setupShutdownHandlers(): void {
    const shutdownHandler = async (signal: string) => {
      console.log(`[AgentManager] Received ${signal}, shutting down gracefully...`);
      await this.shutdown();
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
    process.on('SIGINT', () => shutdownHandler('SIGINT'));
  }

  /**
   * Get agent status information
   */
  getStatus(): {
    isInitialized: boolean;
    isShuttingDown: boolean;
    lastHealthCheck: Date | null;
    agentName?: string;
  } {
    return {
      isInitialized: this.isInitialized,
      isShuttingDown: this.isShuttingDown,
      lastHealthCheck: this.lastHealthCheck,
      agentName: this.agent?.name,
    };
  }

  /**
   * Check if agent is ready to handle requests
   */
  isReady(): boolean {
    return this.isInitialized && this.agent !== null && !this.isShuttingDown;
  }
} 