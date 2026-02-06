import { NextRequest, NextResponse } from 'next/server';
import { APIMarketplacePlatform } from '@/lib/marketplace/apiMarketplacePlatform';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'integrations';

    switch (reportType) {
      case 'integrations':
        const integrations = APIMarketplacePlatform.getIntegrations();
        return NextResponse.json({
          success: true,
          data: integrations,
          summary: {
            total: integrations.length,
            available: integrations.filter(i => i.status === 'available').length,
            featured: integrations.filter(i => i.featured).length
          }
        });

      case 'documentation':
        const docs = APIMarketplacePlatform.getAPIDocumentation();
        return NextResponse.json({ success: true, data: docs });

      case 'developer':
        const devMetrics = APIMarketplacePlatform.getDeveloperMetrics();
        return NextResponse.json({ success: true, data: devMetrics });

      case 'stats':
        const stats = APIMarketplacePlatform.getMarketplaceStats();
        return NextResponse.json({ success: true, data: stats });

      case 'executive':
        const executive = APIMarketplacePlatform.getExecutiveSummary();
        return NextResponse.json({ success: true, data: executive });

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to get data' }, { status: 500 });
  }
}
