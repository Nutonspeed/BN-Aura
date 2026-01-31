// Centralized Error Handling for BN-Aura System
import { NextResponse } from 'next/server';

export interface APIError {
  code: string;
  message: string;
  details?: unknown;
  statusCode: number;
}

export class BNAuraError extends Error {
  code: string;
  statusCode: number;
  details?: unknown;

  constructor(code: string, message: string, statusCode: number = 500, details?: unknown) {
    super(message);
    this.name = 'BNAuraError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

// Common Error Codes
export const ERROR_CODES = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

  // Database
  DATABASE_ERROR: 'DATABASE_ERROR',
  RECORD_NOT_FOUND: 'RECORD_NOT_FOUND',
  CONSTRAINT_VIOLATION: 'CONSTRAINT_VIOLATION',

  // Business Logic
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  INVALID_OPERATION: 'INVALID_OPERATION',
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // External Services
  EMAIL_SERVICE_ERROR: 'EMAIL_SERVICE_ERROR',
  AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
  PAYMENT_ERROR: 'PAYMENT_ERROR',

  // System
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
} as const;

// Error Handler Function
export function handleAPIError(error: unknown): NextResponse {
  console.error('🚨 API Error:', error);

  if (error instanceof BNAuraError) {
    return NextResponse.json(
      {
        error: true,
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp: new Date().toISOString()
      },
      { status: error.statusCode }
    );
  }

  // Supabase Errors
  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = error as { message?: string };
    return NextResponse.json(
      {
        error: true,
        code: ERROR_CODES.DATABASE_ERROR,
        message: 'Database operation failed',
        details: supabaseError.message || 'Unknown database error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }

  // Generic JavaScript Errors
  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: true,
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }

  // Unknown Error
  return NextResponse.json(
    {
      error: true,
      code: ERROR_CODES.INTERNAL_ERROR,
      message: 'Unknown error occurred',
      timestamp: new Date().toISOString()
    },
    { status: 500 }
  );
}

// Success Response Helper
export function successResponse<T>(data: T, message?: string, statusCode: number = 200) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    },
    { status: statusCode }
  );
}

// Validation Error Helper
export function validationError(field: string, message: string) {
  return new BNAuraError(
    ERROR_CODES.VALIDATION_ERROR,
    `Validation failed: ${field} - ${message}`,
    400,
    { field, validationMessage: message }
  );
}

// Auth Error Helpers
export function unauthorizedError(message: string = 'Unauthorized access') {
  return new BNAuraError(ERROR_CODES.UNAUTHORIZED, message, 401);
}

export function forbiddenError(message: string = 'Access forbidden') {
  return new BNAuraError(ERROR_CODES.FORBIDDEN, message, 403);
}

// Database Error Helpers
export function notFoundError(resource: string = 'Resource') {
  return new BNAuraError(
    ERROR_CODES.RECORD_NOT_FOUND,
    `${resource} not found`,
    404
  );
}

// Business Logic Error Helpers
export function quotaExceededError(currentUsage: number, limit: number) {
  return new BNAuraError(
    ERROR_CODES.QUOTA_EXCEEDED,
    'Monthly quota exceeded',
    402,
    { currentUsage, limit }
  );
}

// Rate Limiting Helper
export function rateLimitError(retryAfter: number) {
  return new BNAuraError(
    ERROR_CODES.RATE_LIMIT_EXCEEDED,
    'Rate limit exceeded',
    429,
    { retryAfter }
  );
}

// Service Unavailable Helper
export function serviceUnavailableError(service: string) {
  return new BNAuraError(
    ERROR_CODES.SERVICE_UNAVAILABLE,
    `${service} is currently unavailable`,
    503,
    { service }
  );
}
