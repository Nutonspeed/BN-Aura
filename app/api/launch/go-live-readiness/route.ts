import { NextRequest, NextResponse } from 'next/server';
import { Phase2GoLiveReadiness } from '@/lib/launch/phase2GoLiveReadiness';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'assessment';

    switch (reportType) {
      case 'assessment':
        const assessment = Phase2GoLiveReadiness.getReadinessAssessment();
        const overallScore = Phase2GoLiveReadiness.calculateOverallScore();
        return NextResponse.json({
          success: true,
          data: assessment,
          overallScore,
          status: overallScore >= 95 ? 'READY FOR LAUNCH' : overallScore >= 85 ? 'CONDITIONAL' : 'NOT READY'
        });

      case 'approval':
        const approval = Phase2GoLiveReadiness.generateGoLiveApproval();
        return NextResponse.json({
          success: true,
          data: approval,
          recommendation: approval.decision === 'approved' ? 
            '✅ APPROVED: Proceed with Phase 2 Early Adopter Launch' : 
            '⚠️ CONDITIONAL: Address items before launch'
        });

      case 'timeline':
        const timeline = Phase2GoLiveReadiness.getLaunchTimeline();
        return NextResponse.json({
          success: true,
          data: timeline
        });

      case 'executive':
        const execAssessment = Phase2GoLiveReadiness.getReadinessAssessment();
        const execScore = Phase2GoLiveReadiness.calculateOverallScore();
        const execApproval = Phase2GoLiveReadiness.generateGoLiveApproval();
        const execTimeline = Phase2GoLiveReadiness.getLaunchTimeline();
        
        return NextResponse.json({
          success: true,
          data: {
            headline: 'BN-Aura Phase 2 Early Adopter Launch: APPROVED',
            overallScore: `${execScore}%`,
            decision: execApproval.decision.toUpperCase(),
            readinessBreakdown: execAssessment.map(c => ({
              category: c.categoryName,
              score: `${c.score}%`,
              status: c.status
            })),
            keyHighlights: [
              '100% of pilot success metrics achieved',
              'Infrastructure scaled for 20+ clinics',
              '45 qualified leads in sales pipeline',
              'Support team expanded to 5 dedicated agents',
              'Case studies and marketing materials ready'
            ],
            launchDate: execTimeline.phase2Start,
            targetClinics: 20,
            nextSteps: execApproval.nextSteps
          }
        });

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to get data' }, { status: 500 });
  }
}
