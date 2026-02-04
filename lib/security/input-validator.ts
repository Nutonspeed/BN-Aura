// Input Validation and Sanitization for BN-Aura
// Protects against XSS, SQL injection, and other injection attacks

import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import { ErrorHandler } from '@/lib/monitoring/sentry';

// Common validation schemas
export const commonSchemas = {
  // UUID validation
  uuid: z.string().uuid('Invalid ID format'),
  
  // Email validation
  email: z.string().email('Invalid email address'),
  
  // Phone validation (Thai format)
  phone: z.string().regex(/^0[0-9]{9}$/, 'Invalid phone number format'),
  
  // Thai ID validation
  thaiId: z.string().regex(/^[0-9]{13}$/, 'Invalid Thai ID format'),
  
  // Password validation
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  // Name validation
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Zก-๙\s.-]+$/, 'Name contains invalid characters'),
  
  // Address validation
  address: z.string()
    .max(500, 'Address must be less than 500 characters')
    .regex(/^[a-zA-Z0-9ก-๙\s.,#-]+$/, 'Address contains invalid characters'),
  
  // URL validation
  url: z.string().url('Invalid URL format'),
  
  // Date validation
  date: z.string().datetime('Invalid date format'),
  
  // Pagination validation
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
    offset: z.number().int().min(0).optional()
  }),
  
  // Sort validation
  sort: z.object({
    field: z.string(),
    direction: z.enum(['asc', 'desc']).default('desc')
  })
};

// Business-specific validation schemas
export const businessSchemas = {
  // Clinic validation
  clinic: z.object({
    display_name: z.object({
      en: z.string().min(1).max(200),
      th: z.string().min(1).max(200)
    }),
    clinic_code: z.string().min(3).max(10).regex(/^[A-Z0-9]+$/),
    phone: commonSchemas.phone,
    email: commonSchemas.email,
    address: commonSchemas.address,
    province: z.string().min(1).max(100),
    subscription_tier: z.enum(['basic', 'professional', 'enterprise']),
    is_active: z.boolean().default(true)
  }),
  
  // User validation
  user: z.object({
    email: commonSchemas.email,
    display_name: commonSchemas.name,
    phone: commonSchemas.phone.optional(),
    role: z.enum(['super_admin', 'clinic_owner', 'clinic_staff', 'beautician', 'customer']),
    clinic_id: commonSchemas.uuid.optional(),
    tier: z.string().optional(),
    is_active: z.boolean().default(true)
  }),
  
  // Customer validation
  customer: z.object({
    first_name: commonSchemas.name,
    last_name: commonSchemas.name,
    email: commonSchemas.email,
    phone: commonSchemas.phone,
    thai_id: commonSchemas.thaiId.optional(),
    date_of_birth: commonSchemas.date.optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    address: commonSchemas.address.optional(),
    notes: z.string().max(1000).optional(),
    assigned_sales_staff_id: commonSchemas.uuid.optional(),
    clinic_id: commonSchemas.uuid
  }),
  
  // Treatment validation
  treatment: z.object({
    customer_id: commonSchemas.uuid,
    treatment_type: z.string().min(1).max(100),
    treatment_date: commonSchemas.date,
    staff_id: commonSchemas.uuid,
    notes: z.string().max(2000).optional(),
    price: z.number().min(0),
    status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).default('scheduled')
  }),
  
  // AI Analysis validation
  aiAnalysis: z.object({
    customer_id: commonSchemas.uuid,
    image_url: commonSchemas.url,
    analysis_type: z.enum(['skin_analysis', 'face_analysis', 'recommendation']),
    results: z.record(z.string(), z.any()).optional(),
    confidence_score: z.number().min(0).max(1).optional(),
    staff_id: commonSchemas.uuid.optional()
  })
};

class InputValidator {
  private static instance: InputValidator;

  static getInstance(): InputValidator {
    if (!InputValidator.instance) {
      InputValidator.instance = new InputValidator();
    }
    return InputValidator.instance;
  }

  /**
   * Validate input against a Zod schema
   */
  validate<T>(data: unknown, schema: z.ZodSchema<T>): {
    success: boolean;
    data?: T;
    errors?: string[];
  } {
    try {
      const result = schema.safeParse(data);
      
      if (result.success) {
        return {
          success: true,
          data: result.data
        };
      } else {
        const errors = result.error.issues.map((err: any) => err.message);
        return {
          success: false,
          errors
        };
      }
    } catch (error) {
      ErrorHandler.captureException(error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        errors: ['Validation failed due to server error']
      };
    }
  }

  /**
   * Sanitize HTML content to prevent XSS
   */
  sanitizeHtml(html: string, options?: {
    allowedTags?: string[];
    allowedAttributes?: Record<string, string[]>;
  }): string {
    try {
      const defaultOptions = {
        ALLOWED_TAGS: [
          'p', 'br', 'strong', 'em', 'u', 'i', 'b',
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'ul', 'ol', 'li', 'a', 'span', 'div'
        ],
        ALLOWED_ATTR: [
          'href', 'title', 'alt', 'class', 'id'
        ]
      };

      const config = {
        ALLOWED_TAGS: options?.allowedTags || defaultOptions.ALLOWED_TAGS,
        ALLOWED_ATTR: options?.allowedAttributes || defaultOptions.ALLOWED_ATTR
      };

      return DOMPurify.sanitize(html, config as any) as unknown as string;
    } catch (error) {
      ErrorHandler.captureException(error instanceof Error ? error : new Error(String(error)));
      return ''; // Return empty string if sanitization fails
    }
  }

  /**
   * Sanitize string input
   */
  sanitizeString(input: string, options?: {
    maxLength?: number;
    allowHtml?: boolean;
    trim?: boolean;
  }): string {
    try {
      let sanitized = input;
      
      // Trim whitespace
      if (options?.trim !== false) {
        sanitized = sanitized.trim();
      }
      
      // Enforce maximum length
      if (options?.maxLength && sanitized.length > options.maxLength) {
        sanitized = sanitized.substring(0, options.maxLength);
      }
      
      // Remove potentially dangerous characters
      sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
      
      // Handle HTML
      if (options?.allowHtml) {
        sanitized = this.sanitizeHtml(sanitized);
      } else {
        // Remove all HTML tags
        sanitized = sanitized.replace(/<[^>]*>/g, '');
        // Decode HTML entities
        sanitized = sanitized.replace(/&amp;/g, '&')
                           .replace(/&lt;/g, '<')
                           .replace(/&gt;/g, '>')
                           .replace(/&quot;/g, '"')
                           .replace(/&#39;/g, "'");
      }
      
      return sanitized;
    } catch (error) {
      ErrorHandler.captureException(error instanceof Error ? error : new Error(String(error)));
      return '';
    }
  }

  /**
   * Validate and sanitize file upload
   */
  validateFile(file: File, options?: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
    allowedExtensions?: string[];
  }): {
    valid: boolean;
    errors?: string[];
  } {
    const errors: string[] = [];
    const maxSize = options?.maxSize || 10 * 1024 * 1024; // 10MB default
    const allowedTypes = options?.allowedTypes || [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif'
    ];
    const allowedExtensions = options?.allowedExtensions || ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

    // Check file size
    if (file.size > maxSize) {
      errors.push(`File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`);
    }

    // Check MIME type
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }

    // Check file extension
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      errors.push(`File extension ${fileExtension} is not allowed`);
    }

    // Check for malicious file names
    if (file.name.includes('../') || file.name.includes('..\\')) {
      errors.push('Invalid file name');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Validate API key format
   */
  validateApiKey(apiKey: string): boolean {
    // API keys should be at least 32 characters long and contain only alphanumeric characters
    const apiKeyRegex = /^[a-zA-Z0-9]{32,}$/;
    return apiKeyRegex.test(apiKey);
  }

  /**
   * Validate SQL query parameters (basic protection)
   */
  validateSqlParams(params: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string') {
        // Remove potential SQL injection patterns
        sanitized[key] = value
          .replace(/['"\\;]/g, '')
          .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b/gi, '');
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? this.sanitizeString(item) : item
        );
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  /**
   * Validate JSON input
   */
  validateJson(input: string): {
    valid: boolean;
    data?: any;
    error?: string;
  } {
    try {
      const parsed = JSON.parse(input);
      return {
        valid: true,
        data: parsed
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid JSON format'
      };
    }
  }

  /**
   * Check for common attack patterns
   */
  detectAttackPatterns(input: string): {
    safe: boolean;
    threats: string[];
  } {
    const threats: string[] = [];
    
    // XSS patterns
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b[^>]*>/gi,
      /<object\b[^>]*>/gi,
      /<embed\b[^>]*>/gi
    ];
    
    // SQL injection patterns
    const sqlPatterns = [
      /('|;|--|(\s+(or|and)\s+.*(=|like)))/gi,
      /\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b/gi,
      /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN|INNER|OUTER|LEFT|RIGHT|GROUP|ORDER|BY|HAVING|LIMIT|OFFSET)\b)/gi
    ];
    
    // Command injection patterns
    const cmdPatterns = [
      /[;&|`$(){}[\]]/gi,
      /\b(curl|wget|nc|netcat|telnet|ssh|ftp)\b/gi
    ];
    
    // Check for XSS
    xssPatterns.forEach(pattern => {
      if (pattern.test(input)) {
        threats.push('XSS');
      }
    });
    
    // Check for SQL injection
    sqlPatterns.forEach(pattern => {
      if (pattern.test(input)) {
        threats.push('SQL Injection');
      }
    });
    
    // Check for command injection
    cmdPatterns.forEach(pattern => {
      if (pattern.test(input)) {
        threats.push('Command Injection');
      }
    });
    
    return {
      safe: threats.length === 0,
      threats: [...new Set(threats)] // Remove duplicates
    };
  }
}

/**
 * Middleware for validating request bodies
 */
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return function(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function(req: Request, ...args: any[]) {
      try {
        const body = await req.json();
        const validator = InputValidator.getInstance();
        const result = validator.validate(body, schema);
        
        if (!result.success) {
          return Response.json(
            {
              error: 'Validation failed',
              details: result.errors
            },
            { status: 400 }
          );
        }
        
        // Add validated data to request
        (req as any).validatedBody = result.data;
        
        return method.apply(this, [req, ...args]);
      } catch (error) {
        return Response.json(
          {
            error: 'Invalid request body'
          },
          { status: 400 }
        );
      }
    };
  };
}

/**
 * Sanitize query parameters
 */
export function sanitizeQueryParams(req: Request): Record<string, string> {
  const url = new URL(req.url);
  const validator = InputValidator.getInstance();
  const sanitized: Record<string, string> = {};
  
  for (const [key, value] of url.searchParams) {
    sanitized[key] = validator.sanitizeString(value);
  }
  
  return sanitized;
}

export default InputValidator.getInstance();
