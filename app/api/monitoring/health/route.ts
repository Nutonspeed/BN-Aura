import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency?: number;
  message?: string;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const checks: HealthCheck[] = [];

  // 1. Database Health Check
  try {
    const dbStart = Date.now();
    const supabase = await createClient();
    const { error } = await supabase.from('clinics').select('id').limit(1);
    const dbLatency = Date.now() - dbStart;
    
    checks.push({
      service: 'database',
      status: error ? 'unhealthy' : dbLatency > 1000 ? 'degraded' : 'healthy',
      latency: dbLatency,
      message: error?.message,
    });
  } catch (error) {
    checks.push({
      service: 'database',
      status: 'unhealthy',
      message: 'Connection failed',
    });
  }

  // 2. AI Gateway Health Check
  try {
    const aiStart = Date.now();
    const hasAIKey = !!process.env.AI_GATEWAY_API_KEY || !!process.env.GOOGLE_AI_API_KEY;
    const aiLatency = Date.now() - aiStart;
    
    checks.push({
      service: 'ai_gateway',
      status: hasAIKey ? 'healthy' : 'degraded',
      latency: aiLatency,
      message: hasAIKey ? 'API key configured' : 'No API key configured',
    });
  } catch {
    checks.push({
      service: 'ai_gateway',
      status: 'unhealthy',
      message: 'Check failed',
    });
  }

  // 3. Storage Health Check
  try {
    const storageStart = Date.now();
    const hasStorageConfig = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const storageLatency = Date.now() - storageStart;
    
    checks.push({
      service: 'storage',
      status: hasStorageConfig ? 'healthy' : 'degraded',
      latency: storageLatency,
      message: hasStorageConfig ? 'Supabase configured' : 'No storage configured',
    });
  } catch {
    checks.push({
      service: 'storage',
      status: 'unhealthy',
      message: 'Check failed',
    });
  }

  // 4. Email Service Health Check
  checks.push({
    service: 'email',
    status: process.env.RESEND_API_KEY ? 'healthy' : 'degraded',
    message: process.env.RESEND_API_KEY ? 'Resend configured' : 'No email service',
  });

  // 5. SMS Service Health Check
  checks.push({
    service: 'sms',
    status: process.env.THAI_SMS_PLUS_API_KEY ? 'healthy' : 'degraded',
    message: process.env.THAI_SMS_PLUS_API_KEY ? 'ThaiSMS configured' : 'No SMS service',
  });

  // Calculate overall status
  const unhealthyCount = checks.filter(c => c.status === 'unhealthy').length;
  const degradedCount = checks.filter(c => c.status === 'degraded').length;
  
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  if (unhealthyCount > 0) {
    overallStatus = 'unhealthy';
  } else if (degradedCount > 1) {
    overallStatus = 'degraded';
  } else {
    overallStatus = 'healthy';
  }

  const totalLatency = Date.now() - startTime;

  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    latency: totalLatency,
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV,
    checks,
  }, {
    status: overallStatus === 'unhealthy' ? 503 : 200,
  });
}
