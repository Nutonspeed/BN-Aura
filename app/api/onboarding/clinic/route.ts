import { NextRequest, NextResponse } from 'next/server';
import { ClinicOnboardingSystem } from '@/lib/onboarding/clinicOnboardingSystem';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'create-workflow';
    const body = await request.json();

    switch (action) {
      case 'create-workflow':
        const workflow = ClinicOnboardingSystem.createOnboardingWorkflow(body);
        return NextResponse.json({
          success: true,
          data: workflow,
          message: `Onboarding workflow created for ${workflow.clinicName}`,
          summary: {
            workflowId: workflow.workflowId,
            totalStages: workflow.totalStages,
            automatedTasks: workflow.automatedTasks.length,
            manualTasks: workflow.manualTasks.length,
            teamSize: workflow.assignedTeam.length,
            targetGoLive: workflow.targetGoLiveDate
          }
        });

      case 'execute-automated':
        const tasks = ClinicOnboardingSystem.executeAutomatedTasks(body.workflowId);
        return NextResponse.json({
          success: true,
          data: tasks,
          message: `Automated tasks executed for workflow`,
          results: {
            total: tasks.length,
            completed: tasks.filter(t => t.status === 'completed').length,
            failed: tasks.filter(t => t.status === 'failed').length
          }
        });

      case 'complete-task':
        const task = ClinicOnboardingSystem.completeManualTask(
          body.workflowId, body.taskId, body.completedBy, body.notes
        );
        return NextResponse.json({
          success: true,
          data: task,
          message: `Task completed: ${task.taskName}`,
          completedBy: task.completedBy,
          completedAt: task.completedAt
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Clinic onboarding operation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'overview';

    switch (reportType) {
      case 'overview':
        return NextResponse.json({
          success: true,
          data: {
            activeOnboardings: 3,
            completedOnboardings: 0,
            averageProgress: 45,
            clinics: [
              {
                clinicName: 'Elite Beauty Bangkok',
                status: 'in_progress',
                progress: 67,
                currentStage: 'Training & Certification',
                targetGoLive: '2025-02-17',
                daysRemaining: 11,
                healthScore: 95
              },
              {
                clinicName: 'Phuket Beauty Center',
                status: 'in_progress',
                progress: 40,
                currentStage: 'Data Migration',
                targetGoLive: '2025-02-19',
                daysRemaining: 13,
                healthScore: 90
              },
              {
                clinicName: 'Northern Aesthetics',
                status: 'in_progress',
                progress: 28,
                currentStage: 'Account & System Setup',
                targetGoLive: '2025-02-21',
                daysRemaining: 15,
                healthScore: 100
              }
            ],
            upcomingTasks: [
              { task: 'Elite Beauty Bangkok - Staff Training', dueDate: '2025-02-12', assignee: 'Training Coordinator' },
              { task: 'Phuket Beauty Center - Data Migration Review', dueDate: '2025-02-13', assignee: 'Technical Specialist' },
              { task: 'Northern Aesthetics - Owner Training', dueDate: '2025-02-14', assignee: 'Training Coordinator' }
            ]
          }
        });

      case 'workflow-details':
        return NextResponse.json({
          success: true,
          data: {
            stages: [
              { stage: 'Account & System Setup', duration: '4 hours', tasks: 3, automationLevel: '80%' },
              { stage: 'Data Migration', duration: '8 hours', tasks: 3, automationLevel: '90%' },
              { stage: 'Integration & Testing', duration: '6 hours', tasks: 3, automationLevel: '70%' },
              { stage: 'Training & Certification', duration: '8 hours', tasks: 3, automationLevel: '20%' },
              { stage: 'Go-Live Verification', duration: '4 hours', tasks: 3, automationLevel: '50%' }
            ],
            totalDuration: '30 hours',
            averageCompletionTime: '5-7 days',
            successRate: '98%',
            automatedTasksRatio: '62%'
          }
        });

      case 'team-assignments':
        return NextResponse.json({
          success: true,
          data: {
            teams: [
              {
                clinic: 'Elite Beauty Bangkok',
                team: [
                  { name: 'Somchai P.', role: 'Onboarding Manager', tasks: 4, completed: 3 },
                  { name: 'Pranee K.', role: 'Technical Specialist', tasks: 5, completed: 4 },
                  { name: 'Wichai S.', role: 'Training Coordinator', tasks: 3, completed: 1 }
                ]
              },
              {
                clinic: 'Phuket Beauty Center',
                team: [
                  { name: 'Somchai P.', role: 'Onboarding Manager', tasks: 4, completed: 1 },
                  { name: 'Pranee K.', role: 'Technical Specialist', tasks: 5, completed: 2 },
                  { name: 'Wichai S.', role: 'Training Coordinator', tasks: 3, completed: 0 }
                ]
              }
            ],
            workload: {
              'Somchai P.': { totalTasks: 12, completed: 5, capacity: 'Normal' },
              'Pranee K.': { totalTasks: 15, completed: 8, capacity: 'High' },
              'Wichai S.': { totalTasks: 9, completed: 2, capacity: 'Normal' }
            }
          }
        });

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get clinic onboarding data'
    }, { status: 500 });
  }
}
