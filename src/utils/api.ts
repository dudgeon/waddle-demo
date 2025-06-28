/**
 * API Client for Express Backend
 * Handles HTTP communication with the Express server backend
 */

export interface ApiConfig {
  baseUrl: string;
  timeout?: number;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
  stream?: boolean;
}

export interface ChatResponse {
  response: string;
  sessionId: string;
  timestamp: string;
  usage?: any;
}

export interface ApiErrorData {
  error: string;
  code: string;
  statusCode: number;
  timestamp: string;
}

class ApiClient {
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;
  }

  /**
   * Get the appropriate base URL for the current environment
   */
  private getBaseUrl(): string {
    // Check for explicit environment variable first
    if (import.meta.env?.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
    
    // Use config baseUrl if provided and not empty
    if (this.config.baseUrl) {
      return this.config.baseUrl;
    }
    
    // In development, use the Express server on port 3001
    if (import.meta.env?.DEV || window.location.hostname === 'localhost') {
      return 'http://localhost:3001';
    }
    
    // In production, use the same origin (Railway deployment serves both frontend and backend)
    return window.location.origin;
  }

  /**
   * Send a chat message to the backend
   */
  async sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
    const url = `${this.getBaseUrl()}/api/chat`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: request.message,
          sessionId: request.sessionId || `session-${Date.now()}`,
          stream: false, // Non-streaming request
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          errorData.code || 'HTTP_ERROR',
          response.status,
          new Date().toISOString()
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        'NETWORK_ERROR',
        0,
        new Date().toISOString()
      );
    }
  }

  /**
   * Create a streaming chat connection URL for Server-Sent Events
   */
  createStreamingUrl(request: ChatRequest): string {
    const baseUrl = this.getBaseUrl();
    const url = new URL('/api/chat', baseUrl);
    
    url.searchParams.set('message', request.message);
    url.searchParams.set('stream', 'true');
    
    if (request.sessionId) {
      url.searchParams.set('sessionId', request.sessionId);
    }
    
    return url.toString();
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const url = `${this.getBaseUrl()}/health`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new ApiError(
        error instanceof Error ? error.message : 'Health check failed',
        'HEALTH_CHECK_ERROR',
        0,
        new Date().toISOString()
      );
    }
  }
}

// Create and export singleton instance
const apiClient = new ApiClient({
  baseUrl: '', // Will be determined dynamically
  timeout: 30000, // 30 seconds
});

export default apiClient;

// Export convenience functions
export const sendChatMessage = (request: ChatRequest) => apiClient.sendChatMessage(request);
export const createStreamingUrl = (request: ChatRequest) => apiClient.createStreamingUrl(request);
export const healthCheck = () => apiClient.healthCheck();

// Custom error class
export class ApiError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly timestamp: string;

  constructor(message: string, code: string, statusCode: number, timestamp: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.timestamp = timestamp;
  }
} 