/**
 * Standard API Response Helpers
 * Provides consistent response formatting across all API endpoints
 */

import { NextResponse } from 'next/server';
import { APIResponse, APIErrorCode, ValidationError } from './contracts';

/**
 * Generate unique request ID for tracing
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create successful API response
 */
export function createSuccessResponse<T>(
  data: T,
  options: {
    pagination?: APIResponse<T>['pagination'];
    meta?: Partial<APIResponse<T>['meta']>;
  } = {}
): NextResponse {
  const response: APIResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: generateRequestId(),
      version: '1.0',
      ...options.meta,
    },
  };

  if (options.pagination) {
    response.pagination = options.pagination;
  }

  return NextResponse.json(response);
}

/**
 * Create error API response
 */
export function createErrorResponse(
  code: APIErrorCode,
  message: string,
  options: {
    details?: unknown;
    statusCode?: number;
    validationErrors?: ValidationError[];
  } = {}
): NextResponse {
  const statusCode = options.statusCode || getStatusCodeForError(code);

  const response: APIResponse = {
    success: false,
    error: {
      code,
      message,
      details: options.details || options.validationErrors,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: generateRequestId(),
      version: '1.0',
    },
  };

  return NextResponse.json(response, { status: statusCode });
}

/**
 * Map error codes to HTTP status codes
 */
function getStatusCodeForError(code: APIErrorCode): number {
  const statusMap: Record<APIErrorCode, number> = {
    [APIErrorCode.UNAUTHORIZED]: 401,
    [APIErrorCode.FORBIDDEN]: 403,
    [APIErrorCode.TOKEN_EXPIRED]: 401,
    [APIErrorCode.INVALID_TOKEN]: 401,
    [APIErrorCode.VALIDATION_ERROR]: 400,
    [APIErrorCode.MISSING_REQUIRED_FIELDS]: 400,
    [APIErrorCode.INVALID_FORMAT]: 400,
    [APIErrorCode.QUOTA_EXCEEDED]: 429,
    [APIErrorCode.INSUFFICIENT_PERMISSIONS]: 403,
    [APIErrorCode.RESOURCE_NOT_FOUND]: 404,
    [APIErrorCode.DUPLICATE_RESOURCE]: 409,
    [APIErrorCode.DATABASE_ERROR]: 500,
    [APIErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
    [APIErrorCode.PAYMENT_FAILED]: 402,
    [APIErrorCode.EMAIL_SEND_FAILED]: 500,
    [APIErrorCode.RATE_LIMIT_EXCEEDED]: 429,
    [APIErrorCode.INTERNAL_SERVER_ERROR]: 500,
    [APIErrorCode.SERVICE_UNAVAILABLE]: 503,
  };

  return statusMap[code] || 500;
}

/**
 * Validation helper functions
 */
export class APIValidator {
  static validateRequired(
    data: Record<string, unknown>,
    requiredFields: string[]
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const field of requiredFields) {
      if (!data[field] || data[field] === '') {
        errors.push({
          field,
          message: `${field} is required`,
          code: 'REQUIRED',
          value: data[field],
        });
      }
    }

    return errors;
  }

  static validateEmail(email: string): ValidationError | null {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        field: 'email',
        message: 'Invalid email format',
        code: 'INVALID_EMAIL',
        value: email,
      };
    }
    return null;
  }

  static validateNumber(
    value: unknown,
    field: string,
    options: {
      min?: number;
      max?: number;
      integer?: boolean;
    } = {}
  ): ValidationError | null {
    if (typeof value !== 'number') {
      return {
        field,
        message: `${field} must be a number`,
        code: 'INVALID_TYPE',
        value,
      };
    }

    if (options.integer && !Number.isInteger(value)) {
      return {
        field,
        message: `${field} must be an integer`,
        code: 'INVALID_INTEGER',
        value,
      };
    }

    if (options.min !== undefined && value < options.min) {
      return {
        field,
        message: `${field} must be at least ${options.min}`,
        code: 'MIN_VALUE',
        value,
      };
    }

    if (options.max !== undefined && value > options.max) {
      return {
        field,
        message: `${field} must not exceed ${options.max}`,
        code: 'MAX_VALUE',
        value,
      };
    }

    return null;
  }

  static validateUUID(value: string, field: string): ValidationError | null {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      return {
        field,
        message: `${field} must be a valid UUID`,
        code: 'INVALID_UUID',
        value,
      };
    }
    return null;
  }

  static validateEnum<T extends string>(
    value: string,
    field: string,
    allowedValues: T[]
  ): ValidationError | null {
    if (!allowedValues.includes(value as T)) {
      return {
        field,
        message: `${field} must be one of: ${allowedValues.join(', ')}`,
        code: 'INVALID_ENUM',
        value,
      };
    }
    return null;
  }
}

/**
 * Middleware helper for request validation
 */
export async function validateRequest<T>(
  request: Request,
  validator: (data: unknown) => ValidationError[]
): Promise<{ data: T; errors: ValidationError[] }> {
  try {
    const body = await request.json();
    const errors = validator(body);
    return { data: body as T, errors };
  } catch (error) {
    return {
      data: {} as T,
      errors: [
        {
          field: 'body',
          message: 'Invalid JSON payload',
          code: 'INVALID_JSON',
          value: error,
        },
      ],
    };
  }
}

/**
 * Error handling wrapper for API routes
 */
export function withErrorHandling<T = any>(
  handler: (request: Request, context: T) => Promise<NextResponse>
) {
  return async (request: Request, context: T): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error('API Error:', error);

      // Handle different error types
      if (error instanceof Error) {
        if (error.message.includes('quota exceeded')) {
          return createErrorResponse(
            APIErrorCode.QUOTA_EXCEEDED,
            'API quota exceeded. Please upgrade your plan or wait for quota reset.',
            { details: { error: error.message } }
          );
        }

        if (error.message.includes('unauthorized') || error.message.includes('Unauthorized')) {
          return createErrorResponse(
            APIErrorCode.UNAUTHORIZED,
            'Authentication required',
            { details: { error: error.message } }
          );
        }

        if (error.message.includes('permission') || error.message.includes('forbidden')) {
          return createErrorResponse(
            APIErrorCode.FORBIDDEN,
            'Insufficient permissions to perform this action',
            { details: { error: error.message } }
          );
        }
      }

      // Default server error
      return createErrorResponse(
        APIErrorCode.INTERNAL_SERVER_ERROR,
        'An unexpected error occurred',
        {
          details: process.env.NODE_ENV === 'development' ? { error: error instanceof Error ? error.message : String(error) } : undefined,
        }
      );
    }
  };
}

/**
 * Rate limiting helper
 */
export function createRateLimitResponse(
  resetTime?: number
): NextResponse {
  return createErrorResponse(
    APIErrorCode.RATE_LIMIT_EXCEEDED,
    'Too many requests. Please try again later.',
    {
      statusCode: 429,
      details: {
        resetTime: resetTime || Date.now() + 60000, // Default 1 minute
      },
    }
  );
}
