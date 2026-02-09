import { NextRequest, NextResponse } from 'next/server';
import { UATExecutionMonitoring } from '@/lib/testing/uatExecutionMonitoring';
import { devOnly } from '@/lib/auth/withAuth';

export async function POST(request: NextRequest) {
  const blocked = devOnly();
  if (blocked) return blocked;
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'start-session';
    const body = await request.json();

    switch (action) {
      case 'start-session':
        const session = UATExecutionMonitoring.startLiveTestingSession(body);
        return NextResponse.json({
          success: true,
          data: session,
          message: `Live UAT session started for ${session.participantRole}`,
          monitoring: {
            sessionId: session.sessionId,
            facilitator: session.facilitator,
            estimatedDuration: `${session.duration} minutes`,
            recordingEnabled: session.recordings.screenRecording,
            environment: session.environment
          }
        });

      case 'update-progress':
        const updatedSession = UATExecutionMonitoring.updateSessionProgress(body.sessionId, body.progressData);
        return NextResponse.json({
          success: true,
          data: updatedSession,
          message: updatedSession.status === 'completed' ? 
            'Session completed successfully' : 
            `Session progress: ${updatedSession.realTimeMetrics.completionRate}%`,
          progress: {
            currentStep: `${updatedSession.realTimeMetrics.currentStep}/${updatedSession.realTimeMetrics.totalSteps}`,
            completionRate: `${updatedSession.realTimeMetrics.completionRate}%`,
            averageResponseTime: updatedSession.realTimeMetrics.responseTime.length > 0 ? 
              `${Math.round(updatedSession.realTimeMetrics.responseTime.reduce((a, b) => a + b, 0) / updatedSession.realTimeMetrics.responseTime.length)}ms` : 
              'N/A',
            errorCount: updatedSession.realTimeMetrics.errorCount
          }
        });

      case 'validate-data':
        const validation = UATExecutionMonitoring.validateRealData(body.sessionId, body.validationData);
        return NextResponse.json({
          success: true,
          data: validation,
          message: validation.isValid ? 
            'Data validation passed successfully' : 
            'Data validation failed - discrepancies found',
          validation: {
            dataType: validation.dataType,
            status: validation.isValid ? 'PASSED' : 'FAILED',
            discrepancies: validation.discrepancies,
            validator: validation.validator
          }
        });

      case 'collect-feedback':
        const feedback = UATExecutionMonitoring.collectUserFeedback(body.sessionId, body.feedbackData);
        return NextResponse.json({
          success: true,
          data: feedback,
          message: `User feedback collected - Rating: ${feedback.rating}/5`,
          feedback: {
            type: feedback.feedbackType,
            rating: `${feedback.rating}/5`,
            severity: feedback.severity,
            category: feedback.category,
            suggestionsCount: feedback.suggestions.length
          }
        });

      case 'report-bug':
        const bug = UATExecutionMonitoring.trackBug(body.sessionId, body.bugData);
        return NextResponse.json({
          success: true,
          data: bug,
          message: `${bug.severity.toUpperCase()} priority bug reported: ${bug.title}`,
          bug: {
            bugId: bug.bugId,
            severity: bug.severity,
            priority: bug.priority,
            category: bug.category,
            assignedTo: bug.assignedTo,
            status: bug.status
          }
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'UAT execution monitoring operation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const blocked = devOnly();
  if (blocked) return blocked;
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'dashboard';

    switch (reportType) {
      case 'dashboard':
        const dashboard = UATExecutionMonitoring.getMonitoringDashboard();
        return NextResponse.json({
          success: true,
          data: dashboard,
          status: {
            overallHealth: dashboard.overallProgress.overallSatisfaction > 4.0 ? 'Excellent' : 'Good',
            testingProgress: `${dashboard.overallProgress.completedSessions}/${dashboard.overallProgress.totalSessions} sessions completed`,
            systemPerformance: dashboard.realTimeMetrics.systemPerformance.uptime > 99 ? 'Optimal' : 'Good',
            bugStatus: dashboard.bugStatus.criticalBugs === 0 ? 'No Critical Issues' : `${dashboard.bugStatus.criticalBugs} Critical Bugs`
          }
        });

      case 'live-sessions':
        return NextResponse.json({
          success: true,
          data: {
            activeSessions: [
              {
                sessionId: 'session_owner_001',
                participant: 'Dr. Siriporn Wellness Clinic',
                role: 'clinic_owner',
                scenario: 'clinic_setup',
                progress: '6/8 steps (75%)',
                duration: '45 minutes elapsed',
                satisfaction: '4.5/5',
                facilitator: 'UAT_Facilitator_01',
                environment: 'remote'
              },
              {
                sessionId: 'session_sales_001',
                participant: 'Napaporn Sangthong',
                role: 'sales_staff',
                scenario: 'ai_consultation',
                progress: '4/6 steps (67%)',
                duration: '28 minutes elapsed',
                satisfaction: '4.2/5',
                facilitator: 'UAT_Facilitator_02',
                environment: 'clinic'
              },
              {
                sessionId: 'session_customer_001',
                participant: 'Kulthida Manowong',
                role: 'customer',
                scenario: 'mobile_booking',
                progress: '5/5 steps (100%)',
                duration: '22 minutes completed',
                satisfaction: '4.8/5',
                facilitator: 'UAT_Facilitator_01',
                environment: 'remote'
              }
            ],
            summary: {
              totalActive: 3,
              averageProgress: 81,
              averageSatisfaction: 4.5,
              noIssues: true
            }
          }
        });

      case 'performance-metrics':
        return NextResponse.json({
          success: true,
          data: {
            realTime: {
              averageResponseTime: '185ms',
              systemUptime: '99.9%',
              errorRate: '0.2%',
              activeUsers: 15,
              peakConcurrentUsers: 23
            },
            dataValidation: {
              totalValidations: 45,
              passedValidations: 42,
              failedValidations: 3,
              passRate: '93.3%',
              criticalDataIssues: 0,
              categories: {
                customer_data: { total: 15, passed: 15, rate: '100%' },
                treatment_booking: { total: 18, passed: 16, rate: '88.9%' },
                payment_processing: { total: 8, passed: 8, rate: '100%' },
                inventory_management: { total: 4, passed: 3, rate: '75%' }
              }
            },
            userExperience: {
              averageTaskCompletionTime: '42 minutes',
              taskSuccessRate: '94.7%',
              userErrorRate: '5.3%',
              helpRequestRate: '12%',
              navigationEfficiency: '87%'
            }
          }
        });

      case 'feedback-analysis':
        return NextResponse.json({
          success: true,
          data: {
            summary: {
              totalFeedback: 28,
              averageRating: 4.3,
              responseRate: '89%',
              recommendationScore: 4.1
            },
            categorized: {
              usability: { count: 12, averageRating: 4.2, topIssue: 'Mobile responsiveness' },
              performance: { count: 8, averageRating: 4.5, topIssue: 'Load time on reports' },
              functionality: { count: 6, averageRating: 4.0, topIssue: 'AI accuracy concerns' },
              design: { count: 2, averageRating: 4.8, topIssue: 'Color contrast' }
            },
            positiveHighlights: [
              'AI consultation tool is revolutionary',
              'Mobile app very intuitive',
              'Real-time analytics impressive',
              'Staff management features comprehensive'
            ],
            improvementAreas: [
              'Mobile app loading speed needs optimization',
              'Report generation could be faster',
              'More AI skin analysis options needed',
              'Better offline mode for mobile app'
            ],
            featureRequests: [
              'Bulk customer import',
              'Advanced reporting dashboard',
              'Integration with accounting software',
              'Multi-language support'
            ]
          }
        });

      case 'bug-report':
        return NextResponse.json({
          success: true,
          data: {
            summary: {
              totalBugs: 12,
              criticalBugs: 0,
              highPriorityBugs: 2,
              mediumPriorityBugs: 7,
              lowPriorityBugs: 3,
              resolvedBugs: 8,
              openBugs: 4,
              averageResolutionTime: '2.5 hours'
            },
            criticalIssues: [],
            highPriorityIssues: [
              {
                bugId: 'bug_001',
                title: 'Mobile app crashes on iOS 14',
                severity: 'high',
                status: 'in_progress',
                reportedBy: 'Customer UAT Session',
                assignedTo: 'Mobile Development Team',
                estimatedFix: '24 hours'
              },
              {
                bugId: 'bug_002',
                title: 'Commission calculation incorrect for complex packages',
                severity: 'high',
                status: 'open',
                reportedBy: 'Sales Staff UAT Session',
                assignedTo: 'Backend Development Team',
                estimatedFix: '48 hours'
              }
            ],
            categories: {
              ui: 4,
              performance: 3,
              functionality: 3,
              data: 1,
              integration: 1
            },
            trendAnalysis: {
              bugDiscoveryRate: 'Decreasing',
              resolutionRate: 'Improving',
              qualityTrend: 'Positive'
            }
          }
        });

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get UAT execution data'
    }, { status: 500 });
  }
}
