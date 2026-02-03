// Security middleware application for critical endpoints
// Apply rate limiting and audit logging to API routes

import { withRateLimit } from '@/lib/security/rate-limiter';
import { withAuditLogging } from '@/lib/security/audit-logger';
import { validateBody } from '@/lib/security/input-validator';
import { businessSchemas } from '@/lib/security/input-validator';

// Authentication endpoints with strict rate limiting
export const authMiddleware = withRateLimit('auth', {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000 // 15 minutes
});

// API endpoints with moderate rate limiting
export const apiMiddleware = withRateLimit('api', {
  maxRequests: 100,
  windowMs: 1 * 60 * 1000 // 1 minute
});

// File upload endpoints with strict rate limiting
export const uploadMiddleware = withRateLimit('upload', {
  maxRequests: 10,
  windowMs: 10 * 60 * 1000 // 10 minutes
});

// WebSocket connections with moderate rate limiting
export const websocketMiddleware = withRateLimit('websocket', {
  maxRequests: 30,
  windowMs: 1 * 60 * 1000 // 1 minute
});

// Decorator for audit logging user actions
export const logUserAction = (action: string, resourceType: string) => {
  return withAuditLogging({
    action,
    resourceType,
    category: 'data_modification',
    getUserId: (req) => {
      // Extract user ID from JWT token
      try {
        const authHeader = req.headers.get('authorization');
        if (authHeader) {
          const token = authHeader.replace('Bearer ', '');
          const payload = JSON.parse(atob(token.split('.')[1]));
          return payload.userId;
        }
      } catch {
        return undefined;
      }
    },
    getClinicId: (req) => {
      // Extract clinic ID from JWT token
      try {
        const authHeader = req.headers.get('authorization');
        if (authHeader) {
          const token = authHeader.replace('Bearer ', '');
          const payload = JSON.parse(atob(token.split('.')[1]));
          return payload.clinicId;
        }
      } catch {
        return undefined;
      }
    }
  });
};

// Validation decorators for common operations
export const validateUserCreation = validateBody(businessSchemas.user);
export const validateClinicCreation = validateBody(businessSchemas.clinic);
export const validateCustomerCreation = validateBody(businessSchemas.customer);
export const validateTreatmentCreation = validateBody(businessSchemas.treatment);

// Combined middleware for common patterns
export const secureEndpoint = (options?: {
  rateLimitType?: 'auth' | 'api' | 'upload' | 'websocket';
  auditAction?: string;
  auditResourceType?: string;
  validationSchema?: any;
}) => {
  return function(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    // Create wrapped method
    descriptor.value = async function(req: Request, ...args: any[]) {
      // Apply rate limiting check (simplified)
      if (options?.rateLimitType) {
        // Rate limiting would be applied here
        console.log(`Rate limiting: ${options.rateLimitType}`);
      }
      
      // Apply validation
      if (options?.validationSchema) {
        try {
          const body = await req.json();
          const validator = require('./input-validator').InputValidator.getInstance();
          const validation = validator.validate(body, options.validationSchema);
          
          if (!validation.success) {
            return Response.json(
              { error: 'Validation failed', details: validation.errors },
              { status: 400 }
            );
          }
        } catch (error) {
          return Response.json(
            { error: 'Invalid request body' },
            { status: 400 }
          );
        }
      }
      
      // Execute original method
      return originalMethod.apply(this, [req, ...args]);
    };
  };
};
