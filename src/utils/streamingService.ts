/**
 * Streaming Service for Server-Sent Events (SSE) communication with the chat API
 * Handles real-time streaming responses from the OpenAI Agents SDK
 */

import { createStreamingUrl, sendChatMessage as apiSendMessage, healthCheck, type ChatRequest } from './api';

export interface StreamEvent {
  id?: string;
  event: string;
  data: any;
}

export interface StreamingCallbacks {
  onConnected?: (data: any) => void;
  onTextDelta?: (data: { delta: string; sessionId: string }) => void;
  onToolCall?: (data: { name: string; event_name: string; sessionId: string }) => void;
  onMessageCreated?: (data: { event_name: string; item_type: string; sessionId: string }) => void;
  onAgentUpdated?: (data: { agent_name: string; sessionId: string }) => void;
  onResponseCompleted?: (data: { status: string; sessionId: string }) => void;
  onFinalResult?: (data: { 
    final_output: string; 
    agent_name: string; 
    usage: any; 
    sessionId: string; 
    timestamp: string 
  }) => void;
  onStreamComplete?: (data: { sessionId: string; timestamp: string }) => void;
  onError?: (data: { error: string; code: string; sessionId: string; timestamp: string }) => void;
}

export class StreamingChatService {
  private eventSource: EventSource | null = null;
  private callbacks: StreamingCallbacks = {};
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private reconnectDelay: number = 1000; // Start with 1 second
  private lastMessage: string = '';
  private lastSessionId: string = '';

  /**
   * Start a streaming chat session
   */
  async startStream(
    message: string, 
    sessionId?: string, 
    callbacks: StreamingCallbacks = {}
  ): Promise<void> {
    this.callbacks = callbacks;
    this.lastMessage = message;
    this.lastSessionId = sessionId || `session-${Date.now()}`;
    this.reconnectAttempts = 0;

    // Close any existing connection
    this.closeStream();

    await this.attemptConnection();
  }

  /**
   * Attempt to establish a streaming connection with retry logic
   */
  private async attemptConnection(): Promise<void> {
    try {
      // Create streaming URL using the API client
      const streamingRequest: ChatRequest = {
        message: this.lastMessage,
        sessionId: this.lastSessionId,
        stream: true
      };
      const url = createStreamingUrl(streamingRequest);

      // Create EventSource connection
      this.eventSource = new EventSource(url);

      // Set up event listeners
      this.setupEventListeners();

    } catch (error) {
      console.error('Failed to start streaming:', error);
      this.handleConnectionError(error);
    }
  }

  /**
   * Handle connection errors with retry logic
   */
  private handleConnectionError(error: any): void {
    const errorMessage = error instanceof Error ? error.message : 'Failed to start streaming';
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
      
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);
      
      setTimeout(() => {
        this.attemptConnection();
      }, delay);
    } else {
      // Max attempts reached, notify error
      this.callbacks.onError?.({
        error: `Connection failed after ${this.maxReconnectAttempts} attempts: ${errorMessage}`,
        code: 'MAX_RECONNECT_ATTEMPTS_EXCEEDED',
        sessionId: this.lastSessionId,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Send a non-streaming message
   */
  async sendMessage(message: string, sessionId?: string): Promise<any> {
    try {
      const request: ChatRequest = {
        message,
        sessionId: sessionId || `session-${Date.now()}`,
        stream: false
      };

      return await apiSendMessage(request);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Close the streaming connection
   */
  closeStream(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  /**
   * Check if streaming is currently active
   */
  isStreaming(): boolean {
    return this.eventSource !== null && this.eventSource.readyState === EventSource.OPEN;
  }

  /**
   * Check backend health before attempting connections
   */
  async checkBackendHealth(): Promise<boolean> {
    try {
      await healthCheck();
      return true;
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  }

  /**
   * Set up event listeners for all SSE event types
   */
  private setupEventListeners(): void {
    if (!this.eventSource) return;

    // Connection events
    this.eventSource.addEventListener('connected', (event) => {
      const data = JSON.parse(event.data);
      this.callbacks.onConnected?.(data);
    });

    // Text streaming events
    this.eventSource.addEventListener('text_delta', (event) => {
      const data = JSON.parse(event.data);
      this.callbacks.onTextDelta?.(data);
    });

    // Tool call events
    this.eventSource.addEventListener('tool_call', (event) => {
      const data = JSON.parse(event.data);
      this.callbacks.onToolCall?.(data);
    });

    // Message creation events
    this.eventSource.addEventListener('message_created', (event) => {
      const data = JSON.parse(event.data);
      this.callbacks.onMessageCreated?.(data);
    });

    // Agent update events
    this.eventSource.addEventListener('agent_updated', (event) => {
      const data = JSON.parse(event.data);
      this.callbacks.onAgentUpdated?.(data);
    });

    // Response completion events
    this.eventSource.addEventListener('response_completed', (event) => {
      const data = JSON.parse(event.data);
      this.callbacks.onResponseCompleted?.(data);
    });

    // Final result events
    this.eventSource.addEventListener('final_result', (event) => {
      const data = JSON.parse(event.data);
      this.callbacks.onFinalResult?.(data);
    });

    // Stream completion events
    this.eventSource.addEventListener('stream_complete', (event) => {
      const data = JSON.parse(event.data);
      this.callbacks.onStreamComplete?.(data);
      this.closeStream(); // Auto-close on completion
    });

    // Error events (custom error events from server)
    this.eventSource.addEventListener('error', (event) => {
      const data = JSON.parse((event as MessageEvent).data);
      this.callbacks.onError?.(data);
    });

    // EventSource error handling
    this.eventSource.onerror = (event) => {
      console.error('EventSource error:', event);
      
      // Check if this is a connection failure that warrants retry
      if (this.eventSource?.readyState === EventSource.CLOSED) {
        console.log('EventSource connection closed, attempting to reconnect...');
        this.handleConnectionError(new Error('EventSource connection closed'));
      } else {
        // Other types of errors
        this.callbacks.onError?.({
          error: 'Connection error occurred',
          code: 'CONNECTION_ERROR',
          sessionId: this.lastSessionId,
          timestamp: new Date().toISOString()
        });
      }
    };

    // EventSource open event
    this.eventSource.onopen = () => {
      console.log('EventSource connection opened');
      // Reset reconnection attempts on successful connection
      this.reconnectAttempts = 0;
    };
  }
}

// Export a singleton instance
export const streamingChatService = new StreamingChatService();

// Export utility functions for easy use
export const startChatStream = (
  message: string,
  sessionId?: string,
  callbacks?: StreamingCallbacks
) => streamingChatService.startStream(message, sessionId, callbacks);

export const sendChatMessage = (message: string, sessionId?: string) => 
  streamingChatService.sendMessage(message, sessionId);

export const closeChatStream = () => streamingChatService.closeStream();

export const isChatStreaming = () => streamingChatService.isStreaming(); 