import { NextRequest, NextResponse } from 'next/server';
import { PilotLaunchExecution } from '@/lib/launch/pilotLaunchExecution';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'initialize';
    const body = await request.json();

    switch (action) {
      case 'initialize':
        const pilots = PilotLaunchExecution.initializePilotLaunch();
        return NextResponse.json({
          success: true,
          data: pilots,
          message: `Pilot launch initialized with ${pilots.length} clinics`,
          timeline: {
            phase: 'Pilot Launch',
            duration: '30 days',
            startDate: '2025-02-17',
            endDate: '2025-03-19',
            clinics: pilots.map(p => ({ name: p.clinicName, goLive: p.goLiveDate }))
          }
        });

      case 'update-onboarding':
        const checklist = PilotLaunchExecution.updateOnboardingStep(
          body.clinicId, body.stepId, body.status, body.notes
        );
        return NextResponse.json({
          success: true,
          data: checklist,
          message: `Onboarding step updated: ${body.stepId}`,
          progress: {
            completionRate: `${checklist.completionRate}%`,
            estimatedCompletion: checklist.estimatedCompletion,
            remainingSteps: checklist.steps.filter(s => s.status !== 'completed').length
          }
        });

      case 'update-metrics':
        const clinic = PilotLaunchExecution.updateClinicMetrics(body.clinicId, body.metrics);
        return NextResponse.json({
          success: true,
          data: clinic,
          message: `Metrics updated for ${clinic.clinicName}`,
          health: {
            score: clinic.healthScore,
            status: clinic.healthScore >= 80 ? 'Healthy' : clinic.healthScore >= 60 ? 'Fair' : 'Needs Attention'
          }
        });

      case 'go-live':
        const liveClinic = PilotLaunchExecution.goLiveClinic(body.clinicId);
        return NextResponse.json({
          success: true,
          data: liveClinic,
          message: `${liveClinic.clinicName} is now LIVE!`,
          celebration: {
            status: 'Production Live',
            phase: liveClinic.currentPhase,
            nextSteps: ['Monitor real-time metrics', 'Provide dedicated support', 'Collect user feedback']
          }
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Pilot launch execution operation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'dashboard';

    switch (reportType) {
      case 'dashboard':
        const metrics = PilotLaunchExecution.getPilotMetrics();
        return NextResponse.json({
          success: true,
          data: metrics,
          status: {
            launchStatus: metrics.liveClinics > 0 ? 'Active' : 'Preparing',
            healthIndicator: metrics.overallHealth,
            recommendation: metrics.criticalIssues > 0 ? 
              'Address critical issues immediately' : 
              'Continue monitoring and support'
          }
        });

      case 'clinic-status':
        return NextResponse.json({
          success: true,
          data: {
            clinics: [
              {
                clinicId: 'pilot_bangkok_001',
                name: 'Elite Beauty Bangkok',
                location: 'Bangkok, Sukhumvit',
                status: 'Onboarding In Progress',
                phase: 'Training',
                onboardingProgress: 67,
                goLiveDate: '2025-02-17',
                healthScore: 95,
                keyMetrics: {
                  dataImported: '850 customers',
                  staffTrained: '8/12 staff',
                  systemTests: 'Passed',
                  readinessScore: '85%'
                }
              },
              {
                clinicId: 'pilot_phuket_001',
                name: 'Phuket Beauty Center',
                location: 'Phuket, Patong',
                status: 'Onboarding Started',
                phase: 'Data Migration',
                onboardingProgress: 33,
                goLiveDate: '2025-02-19',
                healthScore: 100,
                keyMetrics: {
                  dataImported: '320 customers',
                  staffTrained: '2/6 staff',
                  systemTests: 'Pending',
                  readinessScore: '45%'
                }
              },
              {
                clinicId: 'pilot_chiangmai_001',
                name: 'Northern Aesthetics',
                location: 'Chiang Mai, Nimman',
                status: 'Onboarding Scheduled',
                phase: 'Setup',
                onboardingProgress: 17,
                goLiveDate: '2025-02-21',
                healthScore: 100,
                keyMetrics: {
                  dataImported: '0 customers',
                  staffTrained: '0/4 staff',
                  systemTests: 'Pending',
                  readinessScore: '20%'
                }
              }
            ],
            summary: {
              totalClinics: 3,
              onboardingComplete: 0,
              inProgress: 2,
              scheduled: 1,
              averageProgress: 39
            }
          }
        });

      case 'onboarding-progress':
        return NextResponse.json({
          success: true,
          data: {
            overview: {
              totalSteps: 18,
              completedSteps: 7,
              inProgressSteps: 3,
              pendingSteps: 8,
              blockedSteps: 0,
              overallProgress: 39
            },
            byClinic: [
              {
                clinicId: 'pilot_bangkok_001',
                clinicName: 'Elite Beauty Bangkok',
                progress: 67,
                currentStep: 'Staff Training Session',
                nextStep: 'Go-Live Verification',
                blockers: [],
                estimatedCompletion: '2025-02-16'
              },
              {
                clinicId: 'pilot_phuket_001',
                clinicName: 'Phuket Beauty Center',
                progress: 33,
                currentStep: 'Data Migration',
                nextStep: 'Integration Testing',
                blockers: [],
                estimatedCompletion: '2025-02-18'
              },
              {
                clinicId: 'pilot_chiangmai_001',
                clinicName: 'Northern Aesthetics',
                progress: 17,
                currentStep: 'System Account Setup',
                nextStep: 'Data Migration',
                blockers: [],
                estimatedCompletion: '2025-02-20'
              }
            ],
            upcomingMilestones: [
              { date: '2025-02-16', milestone: 'Elite Beauty Bangkok Go-Live Verification' },
              { date: '2025-02-17', milestone: 'Elite Beauty Bangkok LIVE' },
              { date: '2025-02-19', milestone: 'Phuket Beauty Center LIVE' },
              { date: '2025-02-21', milestone: 'Northern Aesthetics LIVE' }
            ]
          }
        });

      case 'support-status':
        return NextResponse.json({
          success: true,
          data: {
            supportTeam: {
              dedicatedAgents: 3,
              availability: '24/7',
              responseTime: 'Under 15 minutes',
              escalationPath: 'Agent -> Team Lead -> Engineering -> CTO'
            },
            activeTickets: {
              total: 5,
              critical: 0,
              high: 1,
              medium: 3,
              low: 1,
              averageResolutionTime: '2.3 hours'
            },
            recentTickets: [
              { ticketId: 'TKT-001', clinic: 'Elite Beauty Bangkok', issue: 'Data import formatting question', priority: 'medium', status: 'resolved' },
              { ticketId: 'TKT-002', clinic: 'Elite Beauty Bangkok', issue: 'Staff training schedule adjustment', priority: 'low', status: 'resolved' },
              { ticketId: 'TKT-003', clinic: 'Phuket Beauty Center', issue: 'Customer data export format', priority: 'medium', status: 'in_progress' },
              { ticketId: 'TKT-004', clinic: 'Elite Beauty Bangkok', issue: 'AI consultation demo request', priority: 'medium', status: 'in_progress' },
              { ticketId: 'TKT-005', clinic: 'Phuket Beauty Center', issue: 'Integration with existing POS', priority: 'high', status: 'in_progress' }
            ],
            satisfaction: {
              responseTimeSatisfaction: 4.8,
              resolutionQuality: 4.6,
              overallSupport: 4.7
            }
          }
        });

      case 'success-metrics':
        return NextResponse.json({
          success: true,
          data: {
            pilotTargets: {
              satisfactionScore: { target: 4.5, current: 0, status: 'Pending Go-Live' },
              systemUptime: { target: 99.5, current: 99.9, status: 'Exceeded' },
              onboardingTime: { target: 7, current: 5, unit: 'days', status: 'On Track' },
              criticalBugs: { target: 0, current: 0, status: 'Met' },
              userAdoption: { target: 100, current: 0, unit: 'percentage', status: 'Pending Go-Live' }
            },
            readinessChecklist: {
              technicalReadiness: { score: 95, items: ['Infrastructure ready', 'Backup systems active', 'Monitoring enabled'] },
              operationalReadiness: { score: 85, items: ['Support team trained', 'Escalation paths defined', 'Communication channels set'] },
              businessReadiness: { score: 90, items: ['Pricing confirmed', 'Contracts signed', 'Success metrics agreed'] }
            },
            riskIndicators: {
              technicalRisk: 'Low',
              operationalRisk: 'Low',
              businessRisk: 'Low',
              overallRisk: 'Low'
            }
          }
        });

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get pilot launch execution data'
    }, { status: 500 });
  }
}
