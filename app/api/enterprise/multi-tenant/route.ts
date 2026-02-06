import { NextRequest, NextResponse } from 'next/server';
import { MultiTenantArchitecture } from '@/lib/enterprise/multiTenantArchitecture';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'organizations';
    const orgId = searchParams.get('orgId');

    switch (reportType) {
      case 'organizations':
        const orgs = MultiTenantArchitecture.getOrganizations();
        return NextResponse.json({
          success: true,
          data: orgs,
          summary: {
            total: orgs.length,
            totalLocations: orgs.reduce((sum, o) => sum + o.locations, 0),
            totalMRR: orgs.reduce((sum, o) => sum + o.mrr, 0)
          }
        });

      case 'hierarchy':
        const hierarchy = MultiTenantArchitecture.getLocationHierarchy(orgId || 'ORG-001');
        return NextResponse.json({ success: true, data: hierarchy });

      case 'metrics':
        const metrics = MultiTenantArchitecture.getEnterpriseMetrics();
        return NextResponse.json({ success: true, data: metrics });

      case 'features':
        const features = MultiTenantArchitecture.getFeaturesMatrix();
        return NextResponse.json({ success: true, data: features });

      case 'executive':
        const executive = MultiTenantArchitecture.getExecutiveSummary();
        return NextResponse.json({ success: true, data: executive });

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to get data' }, { status: 500 });
  }
}
