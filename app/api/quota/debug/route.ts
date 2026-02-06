import { NextRequest, NextResponse } from 'next/server';
import { QuotaManager } from '@/lib/quota/quotaManager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId') || 'a1b2c3d4-e5f6-7890-abcd-1234567890ab';

    console.log(`🔍 DEBUG: Fetching quota config for clinic: ${clinicId}`);

    // Test QuotaManager.getQuotaConfig directly
    const quotaConfig = await QuotaManager.getQuotaConfig(clinicId);
    
    console.log('🔍 DEBUG: QuotaManager result:', quotaConfig);

    // Test database direct query
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    
    const { data: directQuery, error: directError } = await supabase
      .from('clinic_quotas')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('quota_type', 'ai_scans')
      .eq('is_active', true);

    console.log('🔍 DEBUG: Direct database query:', { directQuery, directError });

    return NextResponse.json({
      success: true,
      debug: {
        clinicId,
        quotaManagerResult: quotaConfig,
        directDatabaseQuery: directQuery,
        directDatabaseError: directError
      }
    });

  } catch (error) {
    console.error('DEBUG endpoint error:', error);
    return NextResponse.json(
      { error: 'Debug failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
