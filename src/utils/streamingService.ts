/**
 * Streaming Service for Server-Sent Events (SSE) communication with the chat API
 * Handles real-time streaming responses from the OpenAI Agents SDK
 */

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

  /**
   * Start a streaming chat session
   */
  async startStream(
    message: string, 
    sessionId?: string, 
    callbacks: StreamingCallbacks = {}
  ): Promise<void> {
    this.callbacks = callbacks;

    // Close any existing connection
    this.closeStream();

    try {
      // Create URL with query parameters for the stream
      const url = new URL('/api/chat', window.location.origin);
      url.searchParams.set('message', message);
      url.searchParams.set('stream', 'true');
      if (sessionId) {
        url.searchParams.set('sessionId', sessionId);
      }

      // Create EventSource connection
      this.eventSource = new EventSource(url.toString());

      // Set up event listeners
      this.setupEventListeners();

    } catch (error) {
      console.error('Failed to start streaming:', error);
      this.callbacks.onError?.({
        error: error instanceof Error ? error.message : 'Failed to start streaming',
        code: 'STREAM_START_ERROR',
        sessionId: sessionId || 'unknown',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Send a non-streaming message
   */
  async sendMessage(message: string, sessionId?: string): Promise<any> {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          stream: false,
          sessionId: sessionId || `session-${Date.now()}`
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
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
      this.callbacks.onError?.({
        error: 'Connection error occurred',
        code: 'CONNECTION_ERROR',
        sessionId: 'unknown',
        timestamp: new Date().toISOString()
      });
    };

    // EventSource open event
    this.eventSource.onopen = () => {
      console.log('EventSource connection opened');
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