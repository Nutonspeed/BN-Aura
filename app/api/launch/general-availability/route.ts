import { NextRequest, NextResponse } from 'next/server';
import { GeneralAvailabilityLaunch } from '@/lib/launch/generalAvailabilityLaunch';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'config';

    switch (reportType) {
      case 'config':
        const config = GeneralAvailabilityLaunch.initializeGALaunch();
        return NextResponse.json({
          success: true,
          data: config,
          summary: {
            target: `${config.targetClinics} clinics`,
            duration: `${config.duration} days`,
            regions: config.regions.length,
            budget: `THB ${config.marketingBudget.toLocaleString()}`
          }
        });

      case 'metrics':
        const metrics = GeneralAvailabilityLaunch.getGAMetrics();
        return NextResponse.json({
          success: true,
          data: metrics,
          progress: `${metrics.totalAcquired}/${metrics.totalTarget} (${Math.round(metrics.totalAcquired/metrics.totalTarget*100)}%)`
        });

      case 'regional':
        const regional = GeneralAvailabilityLaunch.getRegionalPerformance();
        return NextResponse.json({ success: true, data: regional });

      case 'projections':
        const projections = GeneralAvailabilityLaunch.getGrowthProjections();
        return NextResponse.json({ success: true, data: projections });

      case 'executive':
        const execConfig = GeneralAvailabilityLaunch.initializeGALaunch();
        const execMetrics = GeneralAvailabilityLaunch.getGAMetrics();
        const execProjections = GeneralAvailabilityLaunch.getGrowthProjections();
        
        return NextResponse.json({
          success: true,
          data: {
            headline: 'BN-Aura Phase 3: General Availability Launch',
            launchDate: execConfig.launchDate,
            currentStatus: {
              clinics: execMetrics.totalAcquired,
              mrr: `THB ${execMetrics.mrr.toLocaleString()}`,
              satisfaction: `${execMetrics.customerSatisfaction}/5.0`,
              penetration: `${execMetrics.marketPenetration}%`
            },
            targets: {
              q2_2025: '100 clinics, THB 850K MRR',
              yearEnd: '200 clinics, THB 1.8M MRR',
              marketPenetration: '40% of Thailand beauty clinics'
            },
            keyInitiatives: [
              'National marketing campaign launch',
              'Regional sales team expansion (15 reps)',
              'Partner channel development',
              'Enterprise tier focus for large chains'
            ]
          }
        });

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to get data' }, { status: 500 });
  }
}
