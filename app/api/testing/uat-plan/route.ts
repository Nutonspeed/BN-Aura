import { NextRequest, NextResponse } from 'next/server';
import { UATTestPlan } from '@/lib/testing/uatTestPlan';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'create-plan';
    const body = await request.json();

    switch (action) {
      case 'create-plan':
        const plan = UATTestPlan.createComprehensiveUATTestPlan();
        return NextResponse.json({
          success: true,
          data: plan,
          message: 'UAT test plan created successfully',
          insights: {
            totalTestUsers: plan.targetUsers.reduce((sum, user) => sum + user.count, 0),
            totalScenarios: plan.testScenarios.length,
            estimatedDuration: `${Math.max(...plan.targetUsers.map(u => u.testDuration))} hours per user`,
            criticalScenarios: plan.testScenarios.filter(s => s.priority === 'critical').length,
            testingPhases: plan.timeline.phases.length
          }
        });

      case 'execute-test':
        const testResult = UATTestPlan.executeUATTest(
          body.planId,
          body.scenarioId,
          body.userId
        );
        
        return NextResponse.json({
          success: true,
          data: testResult,
          message: testResult.status === 'passed' ? 
            'UAT test completed successfully' : 
            'UAT test failed - review required',
          performance: {
            completionTime: `${testResult.completionTime} minutes`,
            userSatisfaction: `${testResult.userSatisfaction}/5.0`,
            bugCount: testResult.bugs.length
          }
        });

      case 'submit-feedback':
        return NextResponse.json({
          success: true,
          data: {
            feedbackId: `feedback_${Date.now()}`,
            userId: body.userId,
            feedback: body.feedback,
            rating: body.rating,
            suggestions: body.suggestions || []
          },
          message: 'User feedback recorded successfully'
        });

      case 'report-bug':
        const bugReport = {
          bugId: `bug_${Date.now()}`,
          severity: body.severity || 'medium',
          title: body.title,
          description: body.description,
          scenario: body.scenario,
          reportedBy: body.userId,
          status: 'open',
          timestamp: new Date().toISOString()
        };

        return NextResponse.json({
          success: true,
          data: bugReport,
          message: `${bugReport.severity.toUpperCase()} priority bug reported`,
          escalation: bugReport.severity === 'critical' ? 'Immediate attention required' : 'Standard review process'
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'UAT test plan operation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'summary';
    const planId = searchParams.get('planId') || 'default';

    switch (reportType) {
      case 'summary':
        const summary = UATTestPlan.getUATSummary(planId);
        return NextResponse.json({
          success: true,
          data: summary,
          status: {
            testingProgress: summary.totalTests > 0 ? 'Active' : 'Not Started',
            overallHealth: summary.averageUserSatisfaction > 4.0 ? 'Excellent' : 'Good',
            readiness: summary.readinessAssessment === 'ready' ? 'Production Ready' : 'Needs Improvement'
          }
        });

      case 'user-scenarios':
        return NextResponse.json({
          success: true,
          data: {
            clinicOwner: [
              {
                scenario: 'Complete Clinic Setup',
                description: 'Register clinic, configure services, add staff, review reports',
                estimatedTime: '90 minutes',
                priority: 'Critical',
                successMetrics: ['Setup completed', 'Staff can login', 'Reports accurate']
              },
              {
                scenario: 'Multi-Location Management',
                description: 'Manage multiple clinic locations with centralized reporting',
                estimatedTime: '60 minutes',
                priority: 'High',
                successMetrics: ['Cross-clinic visibility', 'Consolidated reports', 'Staff permissions']
              }
            ],
            salesStaff: [
              {
                scenario: 'AI-Powered Consultation',
                description: 'Conduct customer consultation using AI analysis tools',
                estimatedTime: '45 minutes',
                priority: 'Critical',
                successMetrics: ['AI recommendations relevant', 'Booking completed', 'Commission tracked']
              },
              {
                scenario: 'Mobile Sales Workflow',
                description: 'Use mobile app for customer management and bookings',
                estimatedTime: '30 minutes',
                priority: 'High',
                successMetrics: ['Mobile responsiveness', 'Offline capability', 'Data sync']
              }
            ],
            customer: [
              {
                scenario: 'Mobile App Experience',
                description: 'Download app, book treatment, track progress',
                estimatedTime: '30 minutes',
                priority: 'High',
                successMetrics: ['Easy registration', 'Smooth booking', 'Progress visibility']
              },
              {
                scenario: 'Treatment Journey',
                description: 'Complete customer journey from consultation to completion',
                estimatedTime: '120 minutes',
                priority: 'Critical',
                successMetrics: ['Seamless experience', 'Clear communication', 'Satisfaction rating']
              }
            ]
          }
        });

      case 'test-environment':
        return NextResponse.json({
          success: true,
          data: {
            environment: 'UAT Environment',
            status: 'Ready',
            configuration: {
              database: 'Production Mirror',
              apiEndpoints: 'All Active',
              externalIntegrations: 'Sandbox Mode',
              monitoring: 'Enhanced Logging Enabled'
            },
            testData: {
              clinics: 5,
              users: 25,
              customers: 100,
              treatments: 50,
              products: 200
            },
            supportTeam: {
              available: true,
              hours: '8:00 AM - 6:00 PM Bangkok Time',
              response: 'Within 15 minutes',
              channels: ['Chat', 'Email', 'Phone']
            }
          }
        });

      case 'recruitment-criteria':
        return NextResponse.json({
          success: true,
          data: {
            clinicOwner: {
              required: 5,
              criteria: [
                'Active beauty clinic owner with 2+ years experience',
                'Currently managing 3+ sales staff',
                'Handles 50+ customers monthly',
                'Experience with clinic management systems',
                'Available for 8-hour testing session'
              ],
              compensation: 'THB 5,000 + system access',
              commitment: '2 weeks testing period'
            },
            salesStaff: {
              required: 10,
              criteria: [
                'Beauty clinic sales professional',
                'Customer consultation experience',
                'Comfortable with mobile devices',
                'Beauty treatment knowledge',
                'Available for 6-hour testing session'
              ],
              compensation: 'THB 2,500 + commission during testing',
              commitment: '1 week testing period'
            },
            customer: {
              required: 8,
              criteria: [
                'Beauty treatment experience (last 6 months)',
                'Regular mobile app user',
                'Age 25-45',
                'Available for follow-up sessions',
                'Willing to provide detailed feedback'
              ],
              compensation: 'Free treatment voucher (THB 3,000 value)',
              commitment: '3 testing sessions over 2 weeks'
            }
          }
        });

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get UAT data'
    }, { status: 500 });
  }
}
