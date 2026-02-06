/**
 * BN-Aura Security Middleware
 * Rate limiting, CSRF protection, and security headers
 */

import { NextRequest, NextResponse } from 'next/server';

// Rate limiting store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

// Rate limiter
export function rateLimit(config: RateLimitConfig = { maxRequests: 100, windowMs: 60000 }) {
  return (ip: string): { allowed: boolean; remaining: number; resetTime: number } => {
    const now = Date.now();
    const key = ip;
    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
      return { allowed: true, remaining: config.maxRequests - 1, resetTime: now + config.windowMs };
    }

    if (record.count >= config.maxRequests) {
      return { allowed: false, remaining: 0, resetTime: record.resetTime };
    }

    record.count++;
    return { allowed: true, remaining: config.maxRequests - record.count, resetTime: record.resetTime };
  };
}

// Security headers
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-DNS-Prefetch-Control': 'on',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(self), microphone=(), geolocation=(self)',
  };
}

// Apply security headers to response
export function withSecurityHeaders(response: NextResponse): NextResponse {
  const headers = getSecurityHeaders();
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

// Validate clinic access
export function validateClinicAccess(userClinicId: string, requestedClinicId: string): boolean {
  return userClinicId === requestedClinicId;
}

// API key validation
export function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key');
  const validKey = process.env.API_SECRET_KEY;
  return apiKey === validKey && !!validKey;
}

// CORS configuration
export function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',');
  const isAllowed = origin && allowedOrigins.includes(origin);

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : '',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  rateLimit,
  getSecurityHeaders,
  withSecurityHeaders,
  sanitizeInput,
  validateClinicAccess,
  validateApiKey,
  getCorsHeaders,
};
