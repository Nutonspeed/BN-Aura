// Standardized Error Handling for API Routes
// Provides consistent error responses across the application

import { NextResponse } from 'next/server';

export enum ErrorCode {
  // Authentication errors (401)
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  // Authorization errors (403)
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Validation errors (400)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Resource errors (404)
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  
  // Conflict errors (409)
  CONFLICT = 'CONFLICT',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  
  // Rate limiting (429)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Server errors (500)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
}

export interface APIError {
  code: ErrorCode;
  message: string;
  details?: any;
  timestamp: string;
  path?: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  metadata?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

/**
 * Create a standardized success response
 */
export function successResponse<T>(
  data: T,
  metadata?: APIResponse['metadata']
): NextResponse<APIResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    metadata,
  });
}

/**
 * Create a standardized error response
 */
export function errorResponse(
  code: ErrorCode,
  message: string,
  details?: any,
  status: number = 500
): NextResponse<APIResponse> {
  const error: APIError = {
    code,
    message,
    details,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  );
}

/**
 * Handle common API errors with appropriate status codes
 */
export class APIErrorHandler {
  static unauthorized(message: string = 'Unauthorized'): NextResponse<APIResponse> {
    return errorResponse(
      ErrorCode.UNAUTHORIZED,
      message,
      undefined,
      401
    );
  }

  static forbidden(message: string = 'Forbidden'): NextResponse<APIResponse> {
    return errorResponse(
      ErrorCode.FORBIDDEN,
      message,
      undefined,
      403
    );
  }

  static notFound(resource: string = 'Resource'): NextResponse<APIResponse> {
    return errorResponse(
      ErrorCode.NOT_FOUND,
      `${resource} not found`,
      undefined,
      404
    );
  }

  static validationError(details: any): NextResponse<APIResponse> {
    return errorResponse(
      ErrorCode.VALIDATION_ERROR,
      'Validation failed',
      details,
      400
    );
  }

  static conflict(message: string = 'Resource conflict'): NextResponse<APIResponse> {
    return errorResponse(
      ErrorCode.CONFLICT,
      message,
      undefined,
      409
    );
  }

  static rateLimitExceeded(): NextResponse<APIResponse> {
    return errorResponse(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      'Rate limit exceeded',
      undefined,
      429
    );
  }

  static internalError(
    message: string = 'Internal server error',
    details?: any
  ): NextResponse<APIResponse> {
    console.error('[v0] Internal error:', message, details);
    return errorResponse(
      ErrorCode.INTERNAL_SERVER_ERROR,
      message,
      process.env.NODE_ENV === 'development' ? details : undefined,
      500
    );
  }

  static databaseError(error: any): NextResponse<APIResponse> {
    console.error('[v0] Database error:', error);
    return errorResponse(
      ErrorCode.DATABASE_ERROR,
      'Database operation failed',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }

  /**
   * Handle Supabase errors with appropriate responses
   */
  static handleSupabaseError(error: any): NextResponse<APIResponse> {
    const message = error?.message || 'Database error';
    const code = error?.code;

    // Common Supabase error codes
    switch (code) {
      case '23505': // Unique violation
        return this.conflict('Duplicate entry');
      
      case '23503': // Foreign key violation
        return this.validationError({
          message: 'Referenced resource does not exist',
        });
      
      case 'PGRST116': // No rows returned
        return this.notFound();
      
      case '42501': // Insufficient privilege (RLS)
        return this.forbidden('Access denied by security policy');
      
      default:
        return this.databaseError(error);
    }
  }

  /**
   * Generic error handler for try-catch blocks
   */
  static handle(error: any): NextResponse<APIResponse> {
    if (error instanceof Error) {
      // Check for known error types
      if (error.message.includes('not found')) {
        return this.notFound();
      }
      if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
        return this.unauthorized();
      }
      if (error.message.includes('forbidden') || error.message.includes('permission')) {
        return this.forbidden();
      }
    }

    return this.internalError(
      error instanceof Error ? error.message : 'Unknown error',
      error
    );
  }
}

/**
 * Async error handler wrapper for API routes
 */
export function withErrorHandler<T>(
  handler: (req: Request, context?: any) => Promise<NextResponse<APIResponse<T>>>
) {
  return async (req: Request, context?: any): Promise<NextResponse<APIResponse<T>>> => {
    try {
      return await handler(req, context);
    } catch (error) {
      console.error('[v0] Unhandled error in API route:', error);
      return APIErrorHandler.handle(error) as NextResponse<APIResponse<T>>;
    }
  };
}

/**
 * Validation helper
 */
export function validateRequired(
  data: any,
  requiredFields: string[]
): { isValid: boolean; missing: string[] } {
  const missing = requiredFields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });

  return {
    isValid: missing.length === 0,
    missing,
  };
}

export default APIErrorHandler;
