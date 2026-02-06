import { NextRequest, NextResponse } from 'next/server';
import { createEmailService } from '@/lib/notifications/emailService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json(
        { success: false, error: 'type and data are required' },
        { status: 400 }
      );
    }

    const emailService = createEmailService();
    let result;

    switch (type) {
      case 'analysis-report':
        result = await emailService.sendAnalysisReport(data);
        break;
      
      case 'appointment-reminder':
        result = await emailService.sendAppointmentReminder(data);
        break;
      
      case 'treatment-summary':
        result = await emailService.sendTreatmentSummary(data);
        break;
      
      default:
        return NextResponse.json(
          { success: false, error: `Unknown email type: ${type}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: result.success,
      data: result,
    });
  } catch (error: any) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      service: 'Email Service',
      endpoints: [
        { type: 'analysis-report', description: 'ส่งรายงานวิเคราะห์ผิว' },
        { type: 'appointment-reminder', description: 'แจ้งเตือนนัดหมาย' },
        { type: 'treatment-summary', description: 'สรุป Treatment' },
      ],
    },
  });
}
