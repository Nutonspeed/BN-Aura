import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get auth user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clinicId, notificationType, recipients, message, priority = 'medium' } = await request.json();

    if (!clinicId || !notificationType || !recipients || !message) {
      return NextResponse.json({ 
        error: 'Missing required fields: clinicId, notificationType, recipients, message' 
      }, { status: 400 });
    }

    // 1. สร้าง notifications สำหรับแต่ละ recipient
    const notifications = recipients.map((recipient: any) => ({
      user_id: recipient.userId,
      clinic_id: clinicId,
      type: notificationType,
      title: recipient.title || getNotificationTitle(notificationType),
      message: recipient.customMessage || message,
      link: recipient.link || getDefaultLink(notificationType),
      action_url: recipient.actionUrl || getDefaultActionUrl(notificationType),
      priority: recipient.priority || priority,
      metadata: recipient.metadata || {},
      created_at: new Date().toISOString(),
      created_by: user.id
    }));

    // 2. บันทึก notifications
    const { data: createdNotifications, error: createError } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    // 3. สร้าง scheduled notifications ถ้ามีการกำหนดเวลา
    if (recipients.some((r: any) => r.scheduledAt)) {
      const scheduledNotifications = recipients
        .filter((r: any) => r.scheduledAt)
        .map((recipient: any) => ({
          user_id: recipient.userId,
          clinic_id: clinicId,
          type: notificationType,
          title: recipient.title || getNotificationTitle(notificationType),
          message: recipient.customMessage || message,
          scheduled_at: recipient.scheduledAt,
          priority: recipient.priority || priority,
          metadata: recipient.metadata || {},
          created_at: new Date().toISOString(),
          created_by: user.id
        }));

      await supabase
        .from('scheduled_notifications')
        .insert(scheduledNotifications);
    }

    // 4. ส่ง real-time notifications (ถ้ามีระบบ)
    try {
      // ส่งผ่าน WebSocket หรือ real-time service
      createdNotifications?.forEach(notification => {
        // TODO: Implement real-time notification sending
        console.log('Real-time notification sent:', notification);
      });
    } catch (realtimeError) {
      console.log('Real-time notification failed:', realtimeError);
    }

    return NextResponse.json({
      message: 'Notifications successfully created',
      created: createdNotifications?.length || 0,
      notifications: createdNotifications
    });

  } catch (error) {
    console.error('Notification Creation Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get auth user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId');
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!clinicId) {
      return NextResponse.json({ 
        error: 'Missing required parameter: clinicId' 
      }, { status: 400 });
    }

    // สร้าง query
    let query = supabase
      .from('notifications')
      .select(`
        *,
        users!inner(
          id,
          email,
          user_metadata
        )
      `)
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (status) {
      query = query.eq('is_read', status === 'read');
    }

    const { data: notifications, error: notificationsError } = await query;

    if (notificationsError) {
      return NextResponse.json({ error: notificationsError.message }, { status: 500 });
    }

    return NextResponse.json({
      notifications: notifications || [],
      total: notifications?.length || 0
    });

  } catch (error) {
    console.error('Get Notifications Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// Helper functions
function getNotificationTitle(type: string): string {
  const titles: Record<string, string> = {
    'welcome': 'ยินดีต้อนรับสู่ BN-Aura',
    'appointment_reminder': 'แจ้งเตือนนัดหมาย',
    'treatment_completed': 'การรักษาเสร็จสิ้น',
    'commission_earned': 'ได้รับค่าคอมมิชชั่น',
    'payment_received': 'ได้รับการชำระเงิน',
    'follow_up_required': 'ต้องการติดตาม',
    'system_alert': 'แจ้งเตือนระบบ',
    'promotion': 'โปรโมชั่นพิเศษ',
    'birthday': 'สุขสันติวันเกิด'
  };
  
  return titles[type] || 'การแจ้งเตือน';
}

function getDefaultLink(type: string): string {
  const links = {
    'welcome': '/th/customer',
    'appointment_reminder': '/th/customer/appointments',
    'treatment_completed': '/th/customer/treatments',
    'commission_earned': '/th/sales/commissions',
    'payment_received': '/th/clinic/payments',
    'follow_up_required': '/th/sales/customers',
    'system_alert': '/th/admin',
    'promotion': '/th/promotions',
    'birthday': '/th/customer/rewards'
  };
  
  // @ts-ignore
  return links[type] || '/th/dashboard';
}

function getDefaultActionUrl(type: string): string {
  const actionUrls = {
    'welcome': '/th/customer/profile',
    'appointment_reminder': '/th/customer/appointments/book',
    'treatment_completed': '/th/customer/review',
    'commission_earned': '/th/sales/commissions/claim',
    'payment_received': '/th/clinic/receipts',
    'follow_up_required': '/th/sales/customers/{id}',
    'system_alert': '/th/admin/alerts',
    'promotion': '/th/promotions/claim',
    'birthday': '/th/customer/birthday-offer'
  };
  
  // @ts-ignore
  return actionUrls[type] || '/th/dashboard';
}
