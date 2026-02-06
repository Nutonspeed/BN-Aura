import { NextRequest, NextResponse } from 'next/server';
import { UserTrainingSystem } from '@/lib/training/userTrainingSystem';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'enroll-user';
    const body = await request.json();

    switch (action) {
      case 'enroll-user':
        const enrolled = UserTrainingSystem.enrollUser(body.userId, body.moduleId);
        return NextResponse.json({
          success: enrolled,
          data: { userId: body.userId, moduleId: body.moduleId },
          message: `User enrolled in training module: ${body.moduleId}`
        });

      case 'complete-module':
        const progress = UserTrainingSystem.completeModule(
          body.userId,
          body.moduleId,
          body.score
        );
        
        const passed = body.score >= 80; // General passing score
        return NextResponse.json({
          success: true,
          data: progress,
          message: passed ? 'Module completed successfully!' : 'Module completed but score below passing threshold',
          achievement: progress.certificates.length > 0 ? 'Certificate awarded!' : null
        });

      case 'create-onboarding':
        const onboardingSteps = UserTrainingSystem.createOnboardingFlow(body.role);
        return NextResponse.json({
          success: true,
          data: {
            role: body.role,
            steps: onboardingSteps,
            totalSteps: onboardingSteps.length,
            estimatedDuration: calculateOnboardingDuration(body.role)
          },
          message: `Onboarding flow created for ${body.role}`
        });

      case 'initialize-modules':
        const modules = UserTrainingSystem.initializeTrainingModules();
        return NextResponse.json({
          success: true,
          data: modules,
          summary: {
            totalModules: modules.length,
            roleSpecific: categorizeModulesByRole(modules),
            totalDuration: modules.reduce((sum, m) => sum + m.duration, 0)
          },
          message: 'Training modules initialized successfully'
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'User Training System failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'summary';

    switch (reportType) {
      case 'summary':
        const summary = UserTrainingSystem.getTrainingSummary();
        return NextResponse.json({
          success: true,
          data: summary,
          insights: {
            completionTrend: summary.averageCompletionRate > 75 ? 'High Engagement' : 'Needs Improvement',
            topSkillGap: summary.skillGaps[0]?.skill || 'No gaps identified',
            recommendedFocus: summary.averageCompletionRate < 60 ? 'Improve onboarding' : 'Advanced training'
          }
        });

      case 'modules':
        const modules = UserTrainingSystem.initializeTrainingModules();
        return NextResponse.json({
          success: true,
          data: modules,
          categories: {
            beginner: modules.filter(m => m.duration <= 45).length,
            intermediate: modules.filter(m => m.duration > 45 && m.duration <= 75).length,
            advanced: modules.filter(m => m.duration > 75).length
          }
        });

      case 'onboarding-flows':
        const flows = {
          sales_staff: UserTrainingSystem.createOnboardingFlow('sales_staff'),
          clinic_owner: UserTrainingSystem.createOnboardingFlow('clinic_owner'),
          customer: UserTrainingSystem.createOnboardingFlow('customer')
        };

        return NextResponse.json({
          success: true,
          data: flows,
          summary: {
            totalFlows: Object.keys(flows).length,
            averageSteps: Object.values(flows).reduce((sum, flow) => sum + flow.length, 0) / Object.keys(flows).length,
            roles: Object.keys(flows)
          }
        });

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get training data'
    }, { status: 500 });
  }
}

function calculateOnboardingDuration(role: string): number {
  const durations = {
    sales_staff: 180,
    clinic_owner: 240,
    customer: 60,
    beautician: 120,
    admin: 300
  };
  
  return durations[role as keyof typeof durations] || 120;
}

function categorizeModulesByRole(modules: any[]): Record<string, number> {
  return modules.reduce((acc, module) => {
    acc[module.targetRole] = (acc[module.targetRole] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}
