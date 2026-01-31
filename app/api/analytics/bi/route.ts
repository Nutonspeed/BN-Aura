import { NextResponse } from 'next/server';
import { biEngine } from '@/lib/analytics/businessIntelligence';
import { handleAPIError, successResponse } from '@/lib/utils/errorHandler';

/**
 * API for Business Intelligence & Executive Analytics
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId');
    const type = searchParams.get('type'); // 'revenue', 'staff', 'customers', 'all'

    if (!clinicId) {
      return NextResponse.json({ error: 'clinicId is required' }, { status: 400 });
    }

    const results: Record<string, unknown> = {};

    if (type === 'revenue' || type === 'all') {
      results.revenue = await biEngine.getRevenueAnalytics(clinicId);
    }

    if (type === 'staff' || type === 'all') {
      results.staff = await biEngine.getStaffPerformance(clinicId);
    }

    if (type === 'customers' || type === 'all') {
      results.customers = await biEngine.getCustomerInsights(clinicId);
    }

    if (type === 'predictive' || type === 'all') {
      results.predictive = await biEngine.getPredictiveAnalytics(clinicId);
    }

    return successResponse(results);
    
  } catch (error) {
    return handleAPIError(error);
  }
}
