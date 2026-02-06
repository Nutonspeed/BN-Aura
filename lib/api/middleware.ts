// API Middleware for common functionality
// Authentication, rate limiting, logging, etc.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { APIErrorHandler, type APIResponse } from './error-handler';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    role: string;
    clinic_id?: string;
  };
}

/**
 * Require authentication for API routes
 */
export async function requireAuth(
  req: NextRequest
): Promise<{ user: any; error: null } | { user: null; error: NextResponse<APIResponse> }> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        user: null,
        error: APIErrorHandler.unauthorized('Authentication required'),
      };
    }

    // Fetch user details from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role, clinic_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return {
        user: null,
        error: APIErrorHandler.unauthorized('User not found'),
      };
    }

    return { user: userData, error: null };
  } catch (error) {
    console.error('[v0] Auth middleware error:', error);
    return {
      user: null,
      error: APIErrorHandler.internalError('Authentication failed'),
    };
  }
}

/**
 * Require specific role(s) for API routes
 */
export function requireRole(
  user: any,
  allowedRoles: string[]
): { authorized: boolean; error: NextResponse<APIResponse> | null } {
  if (!user) {
    return {
      authorized: false,
      error: APIErrorHandler.unauthorized(),
    };
  }

  if (!allowedRoles.includes(user.role)) {
    return {
      authorized: false,
      error: APIErrorHandler.forbidden('Insufficient permissions'),
    };
  }

  return { authorized: true, error: null };
}

/**
 * Check if user belongs to clinic
 */
export function requireClinicAccess(
  user: any,
  clinicId: string
): { authorized: boolean; error: NextResponse<APIResponse> | null } {
  if (!user) {
    return {
      authorized: false,
      error: APIErrorHandler.unauthorized(),
    };
  }

  // Super admins have access to all clinics
  if (user.role === 'super_admin') {
    return { authorized: true, error: null };
  }

  // Check if user belongs to the clinic
  if (user.clinic_id !== clinicId) {
    return {
      authorized: false,
      error: APIErrorHandler.forbidden('Access denied to this clinic'),
    };
  }

  return { authorized: true, error: null };
}

/**
 * Parse and validate request body
 */
export async function parseBody<T>(req: NextRequest): Promise<T | null> {
  try {
    const body = await req.json();
    return body as T;
  } catch (error) {
    console.error('[v0] Failed to parse request body:', error);
    return null;
  }
}

/**
 * Log API request
 */
export function logRequest(req: NextRequest, user?: any) {
  const method = req.method;
  const url = req.url;
  const userId = user?.id || 'anonymous';
  const timestamp = new Date().toISOString();

  console.log(`[v0] [${timestamp}] ${method} ${url} - User: ${userId}`);
}

/**
 * CORS headers for API routes
 */
export function corsHeaders(origin?: string) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Handle OPTIONS request for CORS
 */
export function handleOptions(origin?: string): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

/**
 * Pagination helper
 */
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export function parsePagination(req: NextRequest): PaginationParams {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Create pagination metadata
 */
export function createPaginationMetadata(
  page: number,
  limit: number,
  total: number
) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasMore: page * limit < total,
  };
}

export default {
  requireAuth,
  requireRole,
  requireClinicAccess,
  parseBody,
  logRequest,
  corsHeaders,
  handleOptions,
  parsePagination,
  createPaginationMetadata,
};
