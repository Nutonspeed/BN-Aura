import { NextRequest, NextResponse } from 'next/server';
import { PilotMonitoringDashboard } from '@/lib/monitoring/pilotMonitoringDashboard';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'initialize';
    const body = await request.json();

    switch (action) {
      case 'initialize':
        const init = PilotMonitoringDashboard.initializeMonitoring();
        return NextResponse.json({
          success: true,
          data: init,
          message: 'Pilot monitoring dashboard initialized',
          capabilities: ['Real-time metrics', 'Alert management', 'Performance tracking', 'Satisfaction monitoring']
        });

      case 'update-metrics':
        const updated = PilotMonitoringDashboard.updateMetrics(body.clinicId, body.metrics);
        return NextResponse.json({
          success: true,
          data: updated,
          message: `Metrics updated for ${updated.clinicName}`
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Monitoring operation failed'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'dashboard';
    const clinicId = searchParams.get('clinicId');

    switch (reportType) {
      case 'dashboard':
        const dashboard = PilotMonitoringDashboard.getDashboardData();
        return NextResponse.json({
          success: true,
          data: dashboard,
          status: { health: dashboard.summary.systemHealth, alerts: dashboard.summary.activeAlerts }
        });

      case 'clinic-detail':
        return NextResponse.json({
          success: true,
          data: {
            clinic: {
              id: clinicId || 'pilot_bangkok_001',
              name: 'Elite Beauty Bangkok',
              status: 'Live',
              goLiveDate: '2025-02-17',
              daysSinceLaunch: 0
            },
            operational: {
              todayBookings: 38,
              weeklyBookings: 245,
              monthlyBookings: 0,
              activeCustomers: 270,
              aiConsultations: 23,
              treatmentsCompleted: 31,
              todayRevenue: 127500,
              weeklyRevenue: 892000
            },
            performance: {
              responseTime: { current: 142, target: 200, status: 'Good' },
              appLoadTime: { current: 2.1, target: 3.0, status: 'Good' },
              errorRate: { current: 0.15, target: 0.5, status: 'Excellent' },
              uptime: { current: 99.87, target: 99.5, status: 'Excellent' }
            },
            engagement: {
              staffUsage: { active: 10, total: 12, percentage: 83 },
              customerApp: { downloads: 156, activeUsers: 89, percentage: 57 },
              featureAdoption: { ai: 78, mobile: 85, analytics: 62, average: 75 },
              training: { completed: 10, total: 12, percentage: 83 }
            },
            satisfaction: {
              owner: { rating: 4.7, feedback: 'Very impressed with AI features' },
              staff: { rating: 4.3, feedback: 'Easy to use after training' },
              customer: { rating: 4.6, feedback: 'Love the mobile booking' },
              nps: 58
            }
          }
        });

      case 'alerts':
        return NextResponse.json({
          success: true,
          data: {
            active: [],
            resolved: [
              { alertId: 'alert_001', clinic: 'Phuket Beauty Center', type: 'warning', message: 'High response time detected', resolvedAt: '2025-02-06T08:30:00Z', resolution: 'Cache optimization applied' }
            ],
            summary: { critical: 0, warning: 0, info: 1, total: 1 }
          }
        });

      case 'performance-trends':
        return NextResponse.json({
          success: true,
          data: {
            hourly: {
              labels: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00'],
              bookings: [3, 5, 8, 12, 6, 4, 7],
              responseTime: [135, 142, 158, 165, 148, 140, 145],
              activeUsers: [5, 8, 12, 15, 10, 8, 11]
            },
            daily: {
              labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
              revenue: [85000, 92000, 78000, 105000, 115000, 135000, 95000],
              satisfaction: [4.5, 4.6, 4.4, 4.7, 4.5, 4.8, 4.6]
            },
            comparison: {
              vsTarget: { bookings: '+15%', revenue: '+22%', satisfaction: '+8%' },
              vsLastWeek: { bookings: 'N/A', revenue: 'N/A', satisfaction: 'N/A' }
            }
          }
        });

      case 'executive-summary':
        return NextResponse.json({
          success: true,
          data: {
            pilotStatus: 'On Track',
            overallHealth: 'Excellent',
            keyMetrics: {
              totalBookings: 95,
              totalRevenue: 'THB 297,500',
              avgSatisfaction: '4.5/5.0',
              systemUptime: '99.85%'
            },
            highlights: [
              'Elite Beauty Bangkok exceeding all targets',
              'AI consultation adoption at 78% - above 70% target',
              'Zero critical incidents since launch',
              'Customer satisfaction 4.5/5.0 - above 4.0 target'
            ],
            concerns: [],
            recommendations: [
              'Continue current support level',
              'Prepare for Phase 2 early adopter recruitment',
              'Document success stories for marketing'
            ],
            nextMilestones: [
              { date: '2025-02-19', milestone: 'Phuket Beauty Center Go-Live' },
              { date: '2025-02-21', milestone: 'Northern Aesthetics Go-Live' },
              { date: '2025-03-01', milestone: 'Phase 1 Review Meeting' }
            ]
          }
        });

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get monitoring data'
    }, { status: 500 });
  }
}
