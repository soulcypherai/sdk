/**
 * SoulCypher Avatar SDK - Main Export
 */

export { SoulCypherSDK } from './sdk';
export { AvatarSessionManager } from './session';
export { APIClient } from './api-client';

// Export constants
export {
  AVATAR_PROVIDERS,
  SESSION_EVENTS,
  AVATAR_EVENTS,
  CONNECTION_EVENTS,
  ALL_EVENTS,
  SESSION_STATUS,
  SDK_ENVIRONMENTS,
  ERROR_CODES
} from './constants';

// Export types
export type {
  SDKConfig,
  Avatar,
  AvatarSession,
  CreateSessionRequest,
  SessionEventData,
  UsageMetrics,
  AvatarProvider,
  SessionEventType,
  SessionStatus,
  SDKEnvironment,
  ErrorCode
} from './types';

// Export errors
export {
  SoulCypherError,
  AuthenticationError,
  RateLimitError,
  SessionError,
  ConnectionError
} from './types';

