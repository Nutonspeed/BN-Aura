import { NextRequest, NextResponse } from 'next/server';
import { QuotaManager } from '@/lib/quota/quotaManager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId');

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinicId is required' },
        { status: 400 }
      );
    }

    const quotaConfig = await QuotaManager.getQuotaConfig(clinicId);
    
    if (!quotaConfig) {
      return NextResponse.json(
        { error: 'Quota not found for clinic' },
        { status: 404 }
      );
    }

    const quotaRemaining = quotaConfig.monthlyQuota - quotaConfig.currentUsage;
    const usagePercent = (quotaConfig.currentUsage / quotaConfig.monthlyQuota) * 100;
    const daysUntilReset = QuotaManager.getDaysUntilReset(quotaConfig.resetDate);

    return NextResponse.json({
      quotaRemaining: Math.max(0, quotaRemaining),
      quotaLimit: quotaConfig.monthlyQuota,
      currentUsage: quotaConfig.currentUsage,
      usagePercent: Math.min(100, usagePercent),
      daysUntilReset,
      plan: quotaConfig.plan.charAt(0).toUpperCase() + quotaConfig.plan.slice(1),
      willIncurCharge: quotaRemaining <= 0,
      overageRate: quotaConfig.overageRate,
      overage: quotaConfig.overage,
      features: quotaConfig.features,
      resetDate: quotaConfig.resetDate,
    });
  } catch (error) {
    console.error('Error fetching quota status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quota status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clinicId, action, data } = body;

    if (!clinicId || !action) {
      return NextResponse.json(
        { error: 'clinicId and action are required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'check': {
        const availability = await QuotaManager.checkQuotaAvailability(clinicId);
        return NextResponse.json(availability);
      }

      case 'record': {
        const { userId, scanType, successful, metadata } = data || {};
        if (!userId || !scanType) {
          return NextResponse.json(
            { error: 'userId and scanType are required for recording usage' },
            { status: 400 }
          );
        }
        const record = await QuotaManager.recordUsage(
          clinicId,
          userId,
          scanType,
          successful ?? true,
          metadata
        );
        return NextResponse.json({ success: true, record });
      }

      case 'upgrade': {
        const { planId } = data || {};
        if (!planId) {
          return NextResponse.json(
            { error: 'planId is required for upgrade' },
            { status: 400 }
          );
        }
        const result = await QuotaManager.updatePlan(clinicId, planId);
        return NextResponse.json(result);
      }

      case 'topup': {
        const { scanCount } = data || {};
        if (!scanCount || scanCount <= 0) {
          return NextResponse.json(
            { error: 'Valid scanCount is required for top-up' },
            { status: 400 }
          );
        }
        const result = await QuotaManager.purchaseTopUp(clinicId, scanCount);
        return NextResponse.json(result);
      }

      case 'stats': {
        const { period } = data || {};
        const stats = await QuotaManager.getUsageStats(clinicId, period || 'current');
        return NextResponse.json(stats);
      }

      case 'recommendations': {
        const recommendations = await QuotaManager.getRecommendations(clinicId);
        return NextResponse.json(recommendations);
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing quota action:', error);
    return NextResponse.json(
      { error: 'Failed to process quota action' },
      { status: 500 }
    );
  }
}
