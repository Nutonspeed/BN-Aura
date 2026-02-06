import { NextRequest, NextResponse } from 'next/server';
import { QuotaManager } from '@/lib/quota/quotaManager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId') || 'a1b2c3d4-e5f6-7890-abcd-1234567890ab';
    const action = searchParams.get('action') || 'recommendations';

    switch (action) {
      case 'recommendations':
        // Test plan recommendations based on usage
        const recommendations = await QuotaManager.getRecommendations(clinicId);
        
        return NextResponse.json({
          success: true,
          action: 'recommendations',
          data: recommendations,
          message: 'Plan recommendations retrieved successfully'
        });

      case 'usage-stats':
        // Test usage statistics
        const stats = await QuotaManager.getUsageStats(clinicId, 'current');
        
        return NextResponse.json({
          success: true,
          action: 'usage-stats',
          data: stats,
          message: 'Usage statistics retrieved successfully'
        });

      case 'quota-config':
        // Test quota configuration
        const config = await QuotaManager.getQuotaConfig(clinicId);
        
        return NextResponse.json({
          success: true,
          action: 'quota-config',
          data: config,
          message: 'Quota configuration retrieved successfully'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: recommendations, usage-stats, or quota-config' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Billing test error:', error);
    return NextResponse.json(
      { error: 'Billing test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, clinicId, ...params } = body;

    switch (action) {
      case 'purchase-topup':
        // Test top-up purchase
        const { scanCount = 100 } = params;
        const topupResult = await QuotaManager.purchaseTopUp(clinicId, scanCount);
        
        return NextResponse.json({
          success: true,
          action: 'purchase-topup',
          data: topupResult,
          message: `Top-up purchase test completed for ${scanCount} scans`
        });

      case 'update-plan':
        // Test plan upgrade/downgrade
        const { newPlanId = 'premium' } = params;
        const planResult = await QuotaManager.updatePlan(clinicId, newPlanId);
        
        return NextResponse.json({
          success: true,
          action: 'update-plan',
          data: planResult,
          message: `Plan update test completed to ${newPlanId}`
        });

      case 'check-feature':
        // Test feature availability
        const { feature = 'advancedAnalysis' } = params;
        const hasFeature = await QuotaManager.hasFeature(clinicId, feature);
        
        return NextResponse.json({
          success: true,
          action: 'check-feature',
          data: { feature, hasFeature },
          message: `Feature check completed for ${feature}`
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: purchase-topup, update-plan, or check-feature' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Billing test POST error:', error);
    return NextResponse.json(
      { error: 'Billing test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
