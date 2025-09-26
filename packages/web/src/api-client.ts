/**
 * API Client for SoulCypher Platform Backend
 */

import {
  SDKConfig,
  Avatar,
  AvatarSession,
  CreateSessionRequest,
  CreateAvatarRequest,
  SoulCypherError,
  AuthenticationError,
  RateLimitError
} from './types';

export class APIClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: SDKConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.soulcypher.ai';

    if (!this.apiKey) {
      throw new AuthenticationError('API key is required');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}/v1${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      return response.json();
    } catch (error) {
      if (error instanceof SoulCypherError) {
        throw error;
      }

      // Network or other errors
      throw new SoulCypherError(
        `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'NETWORK_ERROR'
      );
    }
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    const text = await response.text();
    let errorData: any;

    try {
      errorData = JSON.parse(text);
    } catch {
      errorData = { message: text };
    }

    const message = errorData.message || `Request failed with status ${response.status}`;

    switch (response.status) {
      case 401:
        throw new AuthenticationError(message);
      case 429:
        throw new RateLimitError(message);
      case 400:
        throw new SoulCypherError(message, 'VALIDATION_ERROR', 400);
      case 404:
        throw new SoulCypherError(message, 'NOT_FOUND', 404);
      case 500:
        throw new SoulCypherError(message, 'INTERNAL_ERROR', 500);
      default:
        throw new SoulCypherError(message, 'API_ERROR', response.status);
    }
  }

  // Avatar operations
  async getAvatars(): Promise<{ avatars: Avatar[]; pagination?: any }> {
    return this.request<{ avatars: Avatar[]; pagination?: any }>('/avatars');
  }

  async getAvatar(avatarId: string): Promise<Avatar> {
    return this.request<Avatar>(`/avatars/${avatarId}`);
  }

  async createAvatar(request: CreateAvatarRequest): Promise<Avatar> {
    return this.request<Avatar>('/avatars', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Session operations
  async createSession(request: CreateSessionRequest): Promise<AvatarSession> {
    return this.request<AvatarSession>('/sessions/create', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getSession(sessionId: string): Promise<AvatarSession> {
    return this.request<AvatarSession>(`/sessions/${sessionId}`);
  }

  async getSessionStatus(sessionId: string): Promise<{
    sessionId: string;
    status: string;
    provider: string;
    avatarId: string;
    startTime: string;
    endTime?: string;
    duration: number;
    estimatedCost: number;
    roomName: string;
  }> {
    return this.request(`/sessions/${sessionId}/status`);
  }

  async endSession(sessionId: string): Promise<void> {
    await this.request(`/sessions/${sessionId}/end`, {
      method: 'POST',
    });
  }

  // Health check (mounted at root level, not under /v1)
  async ping(): Promise<{ status: string; timestamp: string }> {
    const url = `${this.baseUrl}/health`;

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new SoulCypherError(
          `Health check failed: ${response.status}`,
          'HEALTH_CHECK_ERROR',
          response.status
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof SoulCypherError) {
        throw error;
      }

      throw new SoulCypherError(
        `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'NETWORK_ERROR'
      );
    }
  }
}