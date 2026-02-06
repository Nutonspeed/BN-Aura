import { NextRequest, NextResponse } from 'next/server';
import { MobileSalesApp } from '@/lib/mobile/mobileSalesApp';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'register-user';
    const body = await request.json();

    switch (action) {
      case 'register-user':
        const user = MobileSalesApp.registerUser(body);
        return NextResponse.json({
          success: true,
          data: user,
          message: `Mobile user ${user.profile.name} registered successfully`
        });

      case 'schedule-consultation':
        const consultation = MobileSalesApp.scheduleConsultation(
          body.customerId,
          body.salesStaffId,
          body.scheduledAt
        );
        return NextResponse.json({
          success: true,
          data: consultation,
          message: `Consultation scheduled for ${new Date(consultation.scheduledAt).toLocaleDateString('th-TH')}`
        });

      case 'book-treatment':
        const booking = MobileSalesApp.bookTreatment(
          body.customerId,
          body.treatmentName,
          body.scheduledDate,
          body.price
        );
        return NextResponse.json({
          success: true,
          data: booking,
          message: `Treatment ${booking.treatmentName} booked successfully`
        });

      case 'start-progress':
        const progress = MobileSalesApp.startProgressTracking(
          body.customerId,
          body.treatmentId,
          body.totalSessions
        );
        return NextResponse.json({
          success: true,
          data: progress,
          message: `Progress tracking started for ${progress.totalSessions} sessions`
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Mobile Sales App API failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const analytics = MobileSalesApp.getMobileAnalytics();
    
    return NextResponse.json({
      success: true,
      data: analytics,
      insights: {
        userGrowth: analytics.totalUsers > 50 ? 'High' : 'Growing',
        dailyActivity: analytics.consultationsToday > 10 ? 'Active' : 'Normal',
        conversionRate: `${Math.round((analytics.bookingsToday / analytics.consultationsToday) * 100)}%`,
        treatmentSuccess: `${analytics.averageImprovement}% improvement rate`
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get mobile analytics'
    }, { status: 500 });
  }
}
