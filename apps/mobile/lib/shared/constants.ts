/**
 * Shared constants used across the platform
 */

// ============================================================================
// Validation Constants
// ============================================================================

export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  BIO_MAX_LENGTH: 500,
  POST_MAX_LENGTH: 5000,
  COMMENT_MAX_LENGTH: 1000,
  ORG_NAME_MIN_LENGTH: 3,
  ORG_NAME_MAX_LENGTH: 100,
  ORG_DESCRIPTION_MAX_LENGTH: 2000,
  EVENT_TITLE_MIN_LENGTH: 5,
  EVENT_TITLE_MAX_LENGTH: 200,
  EVENT_DESCRIPTION_MAX_LENGTH: 5000,
  MESSAGE_MAX_LENGTH: 2000,
  POLL_QUESTION_MAX_LENGTH: 500,
  POLL_OPTION_MAX_LENGTH: 200,
  POLL_MIN_OPTIONS: 2,
  POLL_MAX_OPTIONS: 10,
} as const;

// ============================================================================
// File Upload Constants
// ============================================================================

export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_VIDEO_SIZE: 100 * 1024 * 1024, // 100MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
} as const;

// ============================================================================
// Pagination Constants
// ============================================================================

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  FEED_PAGE_SIZE: 10,
  COMMENTS_PAGE_SIZE: 20,
  MESSAGES_PAGE_SIZE: 50,
  NOTIFICATIONS_PAGE_SIZE: 20,
  SEARCH_PAGE_SIZE: 20,
} as const;

// ============================================================================
// Cache TTL Constants (in seconds)
// ============================================================================

export const CACHE_TTL = {
  USER_PROFILE: 300, // 5 minutes
  ORGANIZATION: 600, // 10 minutes
  POST: 180, // 3 minutes
  EVENT: 300, // 5 minutes
  FEED: 120, // 2 minutes
  TRENDING: 600, // 10 minutes
  STATISTICS: 900, // 15 minutes
} as const;

// ============================================================================
// Rate Limiting Constants
// ============================================================================

export const RATE_LIMITS = {
  AUTH_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  AUTH_MAX_REQUESTS: 5,
  API_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  API_MAX_REQUESTS: 100,
  POST_CREATION_WINDOW_MS: 60 * 1000, // 1 minute
  POST_CREATION_MAX_REQUESTS: 5,
  COMMENT_CREATION_WINDOW_MS: 60 * 1000, // 1 minute
  COMMENT_CREATION_MAX_REQUESTS: 10,
} as const;

// ============================================================================
// JWT Constants
// ============================================================================

export const JWT = {
  ACCESS_TOKEN_EXPIRY: '7d',
  REFRESH_TOKEN_EXPIRY: '30d',
  EMAIL_VERIFICATION_EXPIRY: '24h',
  PASSWORD_RESET_EXPIRY: '1h',
} as const;

// ============================================================================
// WebSocket Events
// ============================================================================

export const WS_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',

  // Messages
  MESSAGE_SENT: 'message:sent',
  MESSAGE_RECEIVED: 'message:received',
  MESSAGE_READ: 'message:read',
  MESSAGE_TYPING: 'message:typing',

  // Notifications
  NOTIFICATION_RECEIVED: 'notification:received',
  NOTIFICATION_READ: 'notification:read',

  // Presence
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',

  // Posts
  POST_CREATED: 'post:created',
  POST_UPDATED: 'post:updated',
  POST_DELETED: 'post:deleted',
  POST_REACTION: 'post:reaction',
  POST_COMMENT: 'post:comment',
} as const;

// ============================================================================
// Error Codes
// ============================================================================

export const ERROR_CODES = {
  // Authentication
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_FIELD: 'MISSING_FIELD',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // File Upload
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
} as const;

// ============================================================================
// HTTP Status Codes
// ============================================================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;
