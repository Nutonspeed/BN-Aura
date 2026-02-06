import { NextRequest, NextResponse } from 'next/server';
import { EarlyAdopterLaunch } from '@/lib/launch/earlyAdopterLaunch';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'initialize';
    const body = await request.json();

    switch (action) {
      case 'initialize':
        const campaign = EarlyAdopterLaunch.initializePhase2Campaign();
        return NextResponse.json({
          success: true,
          data: campaign,
          message: 'Phase 2 Early Adopter campaign initialized',
          targets: {
            clinics: campaign.targetClinics,
            duration: campaign.duration,
            weeklyRate: '4 clinics/week'
          }
        });

      case 'register':
        const clinic = EarlyAdopterLaunch.registerApplication(body);
        return NextResponse.json({
          success: true,
          data: clinic,
          message: `Application registered for ${clinic.clinicName}`,
          nextSteps: ['Sales rep assignment', 'Qualification call', 'Proposal delivery']
        });

      case 'approve':
        const approved = EarlyAdopterLaunch.approveApplication(body.clinicId, body.goLiveDate);
        return NextResponse.json({
          success: true,
          data: approved,
          message: `${approved.clinicName} approved for Early Adopter program`,
          onboarding: { startDate: 'Immediately', goLiveDate: approved.goLiveDate }
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Operation failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'metrics';

    switch (reportType) {
      case 'metrics':
        const metrics = EarlyAdopterLaunch.getPhase2Metrics();
        return NextResponse.json({
          success: true,
          data: metrics,
          progress: `${metrics.recruitedClinics}/${metrics.targetClinics} clinics (${Math.round(metrics.recruitedClinics/metrics.targetClinics*100)}%)`
        });

      case 'pipeline':
        const pipeline = EarlyAdopterLaunch.getRecruitmentPipeline();
        return NextResponse.json({ success: true, data: pipeline });

      case 'dashboard':
        return NextResponse.json({
          success: true,
          data: {
            phase2Status: 'Active',
            progress: { target: 20, current: 12, percentage: 60 },
            timeline: { startDate: '2025-02-20', endDate: '2025-04-05', daysRemaining: 38 },
            financials: {
              targetMRR: 'THB 150,000',
              currentMRR: 'THB 89,900',
              projectedMRR: 'THB 165,000'
            },
            clinicBreakdown: {
              starter: { target: 8, current: 5, revenue: 14950 },
              professional: { target: 10, current: 6, revenue: 59940 },
              enterprise: { target: 2, current: 1, revenue: 39990 }
            },
            weeklyTrend: [
              { week: 'W1', target: 4, actual: 5, cumulative: 5 },
              { week: 'W2', target: 4, actual: 4, cumulative: 9 },
              { week: 'W3', target: 4, actual: 3, cumulative: 12 },
              { week: 'W4', target: 4, actual: 0, cumulative: 12 },
              { week: 'W5', target: 4, actual: 0, cumulative: 12 }
            ],
            topPerformingChannels: [
              { channel: 'Pilot Referrals', conversions: 6, rate: '75%' },
              { channel: 'Industry Events', conversions: 3, rate: '60%' },
              { channel: 'Direct Sales', conversions: 2, rate: '40%' },
              { channel: 'Digital Marketing', conversions: 1, rate: '25%' }
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
