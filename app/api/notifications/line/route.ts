import { NextRequest, NextResponse } from 'next/server';
import { createLineNotifyService } from '@/lib/notifications/lineNotify';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data, accessToken } = body;

    if (!type || !data) {
      return NextResponse.json(
        { success: false, error: 'type and data are required' },
        { status: 400 }
      );
    }

    const lineService = createLineNotifyService(accessToken);
    let result;

    switch (type) {
      case 'analysis':
        result = await lineService.sendAnalysisResult(data);
        break;
      
      case 'appointment':
        result = await lineService.sendAppointmentReminder(data);
        break;
      
      case 'environment':
        result = await lineService.sendEnvironmentAlert(data);
        break;
      
      case 'new-customer':
        result = await lineService.sendNewCustomerAlert(data);
        break;
      
      case 'treatment-complete':
        result = await lineService.sendTreatmentComplete(data);
        break;
      
      case 'custom':
        result = await lineService.sendNotification({ message: data.message });
        break;
      
      default:
        return NextResponse.json(
          { success: false, error: `Unknown notification type: ${type}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: result.success,
      data: result,
    });
  } catch (error: any) {
    console.error('LINE notification error:', error);
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
      service: 'LINE Notify',
      endpoints: [
        { type: 'analysis', description: 'ส่งผลวิเคราะห์ผิว' },
        { type: 'appointment', description: 'แจ้งเตือนนัดหมาย' },
        { type: 'environment', description: 'แจ้งเตือนสภาพอากาศ' },
        { type: 'new-customer', description: 'แจ้งลูกค้าใหม่' },
        { type: 'treatment-complete', description: 'แจ้ง Treatment เสร็จ' },
        { type: 'custom', description: 'ส่งข้อความ custom' },
      ],
      setupInstructions: {
        th: [
          '1. ไปที่ https://notify-bot.line.me/',
          '2. Login ด้วย LINE Account',
          '3. สร้าง Token สำหรับ Group/1:1',
          '4. ตั้งค่า LINE_NOTIFY_TOKEN ใน .env',
        ],
        en: [
          '1. Go to https://notify-bot.line.me/',
          '2. Login with LINE Account',
          '3. Generate Token for Group/1:1',
          '4. Set LINE_NOTIFY_TOKEN in .env',
        ],
      },
    },
  });
}
