import { NextRequest, NextResponse } from 'next/server';
import { QuotaManager } from '@/lib/quota/quotaManager';
import { handleAPIError, successResponse, validationError } from '@/lib/utils/errorHandler';
import { createClient } from '@/lib/supabase/client';
import { quotaUsageLimiter } from '@/lib/middleware/rateLimiter';

// Record AI scan usage
export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await quotaUsageLimiter(request, '/api/quota/usage');
  if (rateLimitResponse) {
    return rateLimitResponse;
  }
  
  try {
    const body = await request.json();
    const { clinicId, userId, scanType, successful, customerId, metadata } = body;

    if (!clinicId) throw validationError('clinicId', 'Clinic ID is required');
    if (!userId) throw validationError('userId', 'User ID is required');
    if (!scanType) throw validationError('scanType', 'Scan type is required');

    // Check quota before processing
    const quotaCheck = await QuotaManager.checkQuotaAvailability(clinicId);
    
    if (!quotaCheck.canScan) {
      return NextResponse.json(
        { 
          error: 'Cannot perform scan',
          message: quotaCheck.message,
          quotaExceeded: true
        },
        { status: 403 }
      );
    }

    // Record the usage
    const usageRecord = await QuotaManager.recordUsage(
      clinicId,
      userId,
      scanType,
      successful || false,
      {
        customerId,
        ...metadata
      }
    );

    // Update quota stats in database
    const supabase = createClient();
    const { error: dbError } = await supabase
      .from('ai_usage_logs')
      .insert({
        id: usageRecord.id,
        clinic_id: clinicId,
        user_id: userId,
        scan_type: scanType,
        cost: usageRecord.cost,
        successful: successful,
        customer_id: customerId,
        metadata: usageRecord.metadata,
        created_at: usageRecord.timestamp
      });

    if (dbError) {
      console.error('Error logging usage to database:', dbError);
    }

    // Get updated quota info
    const updatedQuota = await QuotaManager.getQuotaConfig(clinicId);

    if (!updatedQuota) {
      throw new Error('Failed to retrieve updated quota information');
    }

    const remaining = updatedQuota.monthlyQuota - updatedQuota.currentUsage;
    const willIncurCharge = remaining <= 0;

    return successResponse({
      usageRecord,
      quotaStatus: {
        remaining: Math.max(0, remaining),
        willIncurCharge,
        currentUsage: updatedQuota.currentUsage,
        monthlyQuota: updatedQuota.monthlyQuota,
        overage: updatedQuota.overage,
        plan: updatedQuota.plan
      }
    }, 'Usage recorded successfully');

  } catch (error) {
    console.error('Usage recording error:', error);
    return handleAPIError(error);
  }
}

// Get usage statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId');
    const period = searchParams.get('period') as 'current' | 'last30' | 'last90' || 'current';

    if (!clinicId) {
      return NextResponse.json(
        { error: 'Clinic ID is required' },
        { status: 400 }
      );
    }

    const quota = await QuotaManager.getQuotaConfig(clinicId);
    const usage = await QuotaManager.getUsageStats(clinicId, period);

    if (!quota) {
      return NextResponse.json(
        { error: 'Quota configuration not found' },
        { status: 404 }
      );
    }

    const planRecommendation = await QuotaManager.getRecommendations(clinicId);

    return NextResponse.json({
      success: true,
      quota,
      stats: usage,
      recommendations: planRecommendation,
      daysUntilReset: QuotaManager.getDaysUntilReset(quota.resetDate)
    });

  } catch (error) {
    return handleAPIError(error);
  }
}
