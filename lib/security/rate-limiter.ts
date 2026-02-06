// Rate Limiting Middleware for BN-Aura
// Protects against DDoS attacks and API abuse

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

class RateLimiter {
  private static instance: RateLimiter;
  private adminClient = createAdminClient();
  
  // Default configurations for different endpoint types
  public configs = {
    // Authentication endpoints - very strict
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // 5 attempts per 15 minutes
      message: 'Too many authentication attempts. Please try again later.',
      skipSuccessfulRequests: false,
      skipFailedRequests: false
    },
    
    // API endpoints - moderate
    api: {
      windowMs: 1 * 60 * 1000, // 1 minute
      maxRequests: 100, // 100 requests per minute
      message: 'Rate limit exceeded. Please slow down your requests.',
      skipSuccessfulRequests: false,
      skipFailedRequests: true
    },
    
    // File uploads - very strict
    upload: {
      windowMs: 10 * 60 * 1000, // 10 minutes
      maxRequests: 10, // 10 uploads per 10 minutes
      message: 'Too many upload attempts. Please try again later.',
      skipSuccessfulRequests: false,
      skipFailedRequests: false
    },
    
    // WebSocket connections - moderate
    websocket: {
      windowMs: 1 * 60 * 1000, // 1 minute
      maxRequests: 30, // 30 connections per minute
      message: 'Too many connection attempts. Please try again later.',
      skipSuccessfulRequests: false,
      skipFailedRequests: false
    },
    
    // General requests - lenient
    general: {
      windowMs: 1 * 60 * 1000, // 1 minute
      maxRequests: 200, // 200 requests per minute
      message: 'Rate limit exceeded. Please try again later.',
      skipSuccessfulRequests: false,
      skipFailedRequests: true
    }
  };

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  /**
   * Check rate limit for a given identifier
   */
  async checkRateLimit(
    identifier: string,
    configKey: keyof typeof RateLimiter.prototype.configs = 'general',
    customConfig?: Partial<RateLimitConfig>
  ): Promise<RateLimitResult> {
    try {
      const config = { ...this.configs[configKey], ...customConfig };
      const now = Date.now();
      const windowStart = now - config.windowMs;
      
      // Clean up old entries
      await this.cleanupOldEntries(windowStart);
      
      // Get current request count for this identifier
      const { data: existingRequests, error } = await this.adminClient
        .from('rate_limits')
        .select('id, timestamp, success')
        .eq('identifier', identifier)
        .gte('timestamp', new Date(windowStart).toISOString())
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Rate limit check failed:', error);
        // Fail open - allow the request if rate limiting fails
        return {
          success: true,
          limit: config.maxRequests,
          remaining: config.maxRequests,
          resetTime: now + config.windowMs
        };
      }

      // Filter based on success/failure settings
      let filteredRequests = existingRequests || [];
      if (config.skipSuccessfulRequests) {
        filteredRequests = filteredRequests.filter(req => !req.success);
      }
      if (config.skipFailedRequests) {
        filteredRequests = filteredRequests.filter(req => req.success);
      }

      const currentCount = filteredRequests.length;
      const remaining = Math.max(0, config.maxRequests - currentCount);
      const resetTime = now + config.windowMs;

      if (currentCount >= config.maxRequests) {
        // Rate limit exceeded
        const oldestRequest = filteredRequests[filteredRequests.length - 1];
        const retryAfter = oldestRequest ? 
          Math.ceil((new Date(oldestRequest.timestamp).getTime() + config.windowMs - now) / 1000) : 
          Math.ceil(config.windowMs / 1000);

        return {
          success: false,
          limit: config.maxRequests,
          remaining: 0,
          resetTime,
          retryAfter
        };
      }

      return {
        success: true,
        limit: config.maxRequests,
        remaining,
        resetTime
      };
    } catch (error) {
      console.error('Rate limit check error:', error);
      // Fail open - allow the request if rate limiting fails
      return {
        success: true,
        limit: this.configs.general.maxRequests,
        remaining: this.configs.general.maxRequests,
        resetTime: Date.now() + this.configs.general.windowMs
      };
    }
  }

  /**
   * Record a request for rate limiting
   */
  async recordRequest(
    identifier: string,
    success: boolean = true,
    metadata?: any
  ): Promise<void> {
    try {
      await this.adminClient
        .from('rate_limits')
        .insert({
          identifier,
          timestamp: new Date().toISOString(),
          success,
          metadata: metadata || {}
        });
    } catch (error) {
      // Don't fail the request if rate limit recording fails
      console.error('Failed to record rate limit:', error);
    }
  }

  /**
   * Clean up old rate limit entries
   */
  private async cleanupOldEntries(cutoffTime: number): Promise<void> {
    try {
      await this.adminClient
        .from('rate_limits')
        .delete()
        .lt('timestamp', new Date(cutoffTime).toISOString());
    } catch (error) {
      console.error('Failed to cleanup old rate limit entries:', error);
    }
  }

  /**
   * Get rate limit statistics
   */
  async getRateLimitStats(identifier?: string): Promise<{
    totalRequests: number;
    blockedRequests: number;
    topIdentifiers: Array<{ identifier: string; requests: number }>;
  }> {
    try {
      const now = Date.now();
      const dayAgo = now - (24 * 60 * 60 * 1000);

      let query = this.adminClient
        .from('rate_limits')
        .select('identifier, success')
        .gte('timestamp', new Date(dayAgo).toISOString());

      if (identifier) {
        query = query.eq('identifier', identifier);
      }

      const { data: requests, error } = await query;

      if (error || !requests) {
        return {
          totalRequests: 0,
          blockedRequests: 0,
          topIdentifiers: []
        };
      }

      const totalRequests = requests.length;
      const blockedRequests = requests.filter(req => !req.success).length;

      // Get top identifiers by request count
      const identifierCounts = requests.reduce((acc, req) => {
        acc[req.identifier] = (acc[req.identifier] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topIdentifiers = Object.entries(identifierCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([identifier, requests]) => ({ identifier, requests }));

      return {
        totalRequests,
        blockedRequests,
        topIdentifiers
      };
    } catch (error) {
      console.error('Rate limit stats error:', error);
      return {
        totalRequests: 0,
        blockedRequests: 0,
        topIdentifiers: []
      };
    }
  }
}

/**
 * Rate limiting middleware for Next.js API routes
 */
export function withRateLimit(
  configKey: keyof typeof RateLimiter.prototype.configs = 'general',
  customConfig?: Partial<RateLimitConfig>
) {
  return function(handler: (req: NextRequest, context?: any) => Promise<NextResponse>) {
    return async (req: NextRequest, context?: any): Promise<NextResponse> => {
      const rateLimiter = RateLimiter.getInstance();
      
      // Get identifier from IP, user ID, or API key
      const identifier = getIdentifier(req);
      
      // Check rate limit
      const rateLimitResult = await rateLimiter.checkRateLimit(
        identifier,
        configKey,
        customConfig
      );

      // Record the attempt (will be updated with success/failure later)
      await rateLimiter.recordRequest(identifier, true);

      if (!rateLimitResult.success) {
        // Rate limit exceeded
        const config = { ...rateLimiter['configs'][configKey], ...customConfig };
        
        return NextResponse.json(
          {
            error: config.message || 'Rate limit exceeded',
            retryAfter: rateLimitResult.retryAfter,
            limit: rateLimitResult.limit,
            remaining: rateLimitResult.remaining,
            resetTime: rateLimitResult.resetTime
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': rateLimitResult.limit.toString(),
              'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
              'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
              'Retry-After': (rateLimitResult.retryAfter || 60).toString()
            }
          }
        );
      }

      // Add rate limit headers to successful responses
      const response = await handler(req, context);
      
      response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
      response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());

      return response;
    };
  };
}

/**
 * Get identifier for rate limiting
 */
function getIdentifier(req: NextRequest): string {
  // Try to get user ID from authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    try {
      // Extract user ID from JWT token (simplified)
      const token = authHeader.replace('Bearer ', '');
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.userId) {
        return `user:${payload.userId}`;
      }
    } catch {
      // Invalid token, fall back to IP
    }
  }

  // Fall back to IP address
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwarded ? forwarded.split(',')[0] : realIp || 'unknown';
  return `ip:${ip}`;
}

/**
 * Rate limiting for specific user actions
 */
export async function checkUserRateLimit(
  userId: string,
  action: string,
  maxRequests: number = 10,
  windowMs: number = 60 * 1000
): Promise<RateLimitResult> {
  const rateLimiter = RateLimiter.getInstance();
  const identifier = `user:${userId}:${action}`;
  
  return rateLimiter.checkRateLimit(identifier, 'general', {
    maxRequests,
    windowMs,
    message: `Too many ${action} attempts. Please try again later.`
  });
}

export default RateLimiter.getInstance();
