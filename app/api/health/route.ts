import { createClient } from '@/lib/supabase/server';
import {
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling
} from '@/lib/api/responseHelpers';
import { APIErrorCode } from '@/lib/api/contracts';

/**
 * GET /api/health - Health check endpoint for Vercel and monitoring
 */
export const GET = withErrorHandling(async (request: Request) => {
  const startTime = Date.now();

  try {
    // Basic health checks
    const checks = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      region: process.env.VERCEL_REGION || 'unknown'
    };

    // Database connectivity check
    let databaseStatus = 'unknown';
    try {
      const supabase = await createClient();
      const { error } = await supabase.from('clinics').select('id').limit(1);
      databaseStatus = error ? 'error' : 'healthy';
    } catch (dbError) {
      console.error('Database health check failed:', dbError);
      databaseStatus = 'error';
    }

    // External services check
    const servicesStatus = {
      database: databaseStatus,
      stripe: process.env.STRIPE_SECRET_KEY ? 'configured' : 'not_configured',
      resend: process.env.RESEND_API_KEY ? 'configured' : 'not_configured',
      supabase: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'not_configured'
    };

    // Response time
    const responseTime = Date.now() - startTime;

    const isHealthy = databaseStatus === 'healthy';

    return createSuccessResponse({
      status: isHealthy ? 'healthy' : 'degraded',
      checks,
      services: servicesStatus,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Health check error:', error);
    return createErrorResponse(
      APIErrorCode.INTERNAL_SERVER_ERROR,
      'Health check failed',
      {
        details: error instanceof Error ? error.message : 'Unknown error',
        statusCode: 503
      }
    );
  }
});
