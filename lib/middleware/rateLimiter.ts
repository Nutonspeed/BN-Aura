// Rate Limiting Middleware for BN-Aura API Routes
import { NextRequest, NextResponse } from 'next/server';

// Rate limit store (in production, use Redis or database)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: NextRequest) => string;
}

// Default rate limit configurations for different API routes
export const rateLimitConfigs = {
  // AI Analysis - more restrictive due to cost
  '/api/ai/analyze': {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many AI analysis requests, please try again later.'
  },
  
  // Quota usage - moderate limiting
  '/api/quota/usage': {
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many quota requests, please try again later.'
  },
  
  // Staff invitations - prevent spam
  '/api/staff/invite': {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many invitation requests, please try again later.'
  },
  
  // General API routes
  '/api/': {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many API requests, please try again later.'
  }
} as const;

// Generate rate limit key based on clinic ID and IP
function generateKey(req: NextRequest, route: string): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';
  
  // Try to get clinic ID from request body or headers
  let clinicId = req.headers.get('x-clinic-id');
  
  // If no clinic ID in headers, try to extract from common request patterns
  const url = new URL(req.url);
  const clinicIdParam = url.searchParams.get('clinicId');
  if (clinicIdParam) {
    clinicId = clinicIdParam;
  }
  
  // Create composite key for rate limiting by clinic + IP
  const baseKey = clinicId ? `clinic:${clinicId}` : `ip:${ip}`;
  return `ratelimit:${route}:${baseKey}`;
}

// Clean up expired entries
function cleanup() {
  const now = Date.now();
  for (const [key, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      requestCounts.delete(key);
    }
  }
}

// Rate limiter middleware
export function createRateLimiter(config: RateLimitConfig) {
  return async (req: NextRequest, route: string): Promise<NextResponse | null> => {
    // Clean up expired entries periodically
    if (Math.random() < 0.01) { // 1% chance to cleanup
      cleanup();
    }

    const key = config.keyGenerator ? config.keyGenerator(req) : generateKey(req, route);
    const now = Date.now();
    
    const existing = requestCounts.get(key);
    
    if (!existing || now > existing.resetTime) {
      // First request or window expired, reset counter
      requestCounts.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      });
      
      return null; // Allow request
    }
    
    if (existing.count >= config.maxRequests) {
      // Rate limit exceeded
      const resetTime = new Date(existing.resetTime).toISOString();
      const retryAfter = Math.ceil((existing.resetTime - now) / 1000);
      
      return NextResponse.json(
        {
          error: true,
          code: 'RATE_LIMIT_EXCEEDED',
          message: config.message || 'Too many requests',
          retryAfter,
          resetTime,
          limit: config.maxRequests,
          windowMs: config.windowMs
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': existing.resetTime.toString(),
            'Retry-After': retryAfter.toString()
          }
        }
      );
    }
    
    // Increment counter
    existing.count++;
    requestCounts.set(key, existing);
    
    return null; // Allow request
  };
}

// Pre-configured rate limiters
export const aiAnalysisLimiter = createRateLimiter(rateLimitConfigs['/api/ai/analyze']);
export const quotaUsageLimiter = createRateLimiter(rateLimitConfigs['/api/quota/usage']);
export const staffInviteLimiter = createRateLimiter(rateLimitConfigs['/api/staff/invite']);
export const generalApiLimiter = createRateLimiter(rateLimitConfigs['/api/']);

// Rate limiter for specific clinic operations
export const clinicSpecificLimiter = (maxRequests: number, windowMs: number) => {
  return createRateLimiter({
    maxRequests,
    windowMs,
    keyGenerator: (req: NextRequest) => {
      const clinicId = req.headers.get('x-clinic-id') || 'unknown';
      return `clinic-ops:${clinicId}`;
    }
  });
};

// Advanced rate limiter with different limits for different user roles
export function createTieredRateLimiter(configs: Record<string, RateLimitConfig>) {
  return async (req: NextRequest, route: string): Promise<NextResponse | null> => {
    // Try to determine user tier from request
    const userTier = req.headers.get('x-user-tier') || 'basic';
    const config = configs[userTier] || configs['basic'];
    
    const limiter = createRateLimiter(config);
    return limiter(req, route);
  };
}

// Export rate limiting stats for monitoring
export function getRateLimitStats(): {
  totalKeys: number;
  activeRequests: number;
  topConsumers: Array<{ key: string; count: number; resetTime: number }>;
} {
  cleanup();
  
  const now = Date.now();
  const activeEntries = Array.from(requestCounts.entries())
    .filter(([, data]) => now <= data.resetTime)
    .map(([key, data]) => ({ key, count: data.count, resetTime: data.resetTime }))
    .sort((a, b) => b.count - a.count);
  
  return {
    totalKeys: requestCounts.size,
    activeRequests: activeEntries.reduce((sum, entry) => sum + entry.count, 0),
    topConsumers: activeEntries.slice(0, 10)
  };
}
