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

    const { clinicId } = await request.json();

    if (!clinicId) {
      return NextResponse.json({ 
        error: 'Missing required field: clinicId' 
      }, { status: 400 });
    }

    // 1. สร้าง automation rules พื้นฐาน
    const baseRules = [
      {
        clinic_id: clinicId,
        rule_name: 'New Customer Welcome',
        trigger_stage: 'lead_created',
        trigger_action: 'customer_assigned',
        target_action: 'send_welcome_notification',
        target_data: {
          message: 'ยินดีต้อนรับสู่ BN-Aura! เราพร้อมให้คำปรึกษาผิวหน้าของคุณ',
          delay_minutes: 30,
          priority: 'high'
        },
        delay_minutes: 30,
        active: true
      },
      {
        clinic_id: clinicId,
        rule_name: 'AI Scan Follow-up',
        trigger_stage: 'scan_completed',
        trigger_action: 'analysis_ready',
        target_action: 'schedule_consultation',
        target_data: {
          message: 'ผลวิเคราะห์ผิวของคุณพร้อมแล้ว! นัดหมายเพื่อปรึกษาแบบละเอียด',
          delay_minutes: 60,
          priority: 'high'
        },
        delay_minutes: 60,
        active: true
      },
      {
        clinic_id: clinicId,
        rule_name: 'Treatment Reminder',
        trigger_stage: 'consultation_scheduled',
        trigger_action: 'appointment_booked',
        target_action: 'send_appointment_reminder',
        target_data: {
          message: 'แจ้งเตือนนัดหมายวันทรีทเมนต์ของคุณ',
          delay_minutes: 1440, // 24 hours before
          priority: 'medium'
        },
        delay_minutes: 1440,
        active: true
      },
      {
        clinic_id: clinicId,
        rule_name: 'Post Treatment Follow-up',
        trigger_stage: 'treatment_completed',
        trigger_action: 'session_finished',
        target_action: 'schedule_follow_up',
        target_data: {
          message: 'วันทรีทเมนต์เสร็จสิ้น! นัดหมายติดตามผลใน 7 วัน',
          delay_minutes: 10080, // 7 days
          priority: 'medium'
        },
        delay_minutes: 10080,
        active: true
      },
      {
        clinic_id: clinicId,
        rule_name: 'Commission Notification',
        trigger_stage: 'payment_completed',
        trigger_action: 'transaction_paid',
        target_action: 'notify_commission_earned',
        target_data: {
          message: 'คุณได้รับค่าคอมมิชชั่นจากการขายล่าสุด!',
          delay_minutes: 5,
          priority: 'low'
        },
        delay_minutes: 5,
        active: true
      },
      {
        clinic_id: clinicId,
        rule_name: 'Inactive Customer Re-engagement',
        trigger_stage: 'customer_inactive',
        trigger_action: 'no_activity_30_days',
        target_action: 'send_re_engagement_offer',
        target_data: {
          message: 'พบกับอีกครั้ง! มีข้อเสนอพิเศษสำหรับคุณ',
          delay_minutes: 0,
          priority: 'low'
        },
        delay_minutes: 0,
        active: true
      }
    ];

    // 2. ตรวจสอบว่ามี rules อยู่แล้วหรือไม่
    const { data: existingRules, error: existingError } = await supabase
      .from('automation_rules')
      .select('rule_name')
      .eq('clinic_id', clinicId);

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    const existingRuleNames = new Set(existingRules?.map(r => r.rule_name) || []);
    const rulesToCreate = baseRules.filter(rule => !existingRuleNames.has(rule.rule_name));

    if (rulesToCreate.length === 0) {
      return NextResponse.json({
        message: 'All automation rules already exist',
        created: 0,
        total: baseRules.length
      });
    }

    // 3. สร้าง automation rules
    const { data: createdRules, error: createError } = await supabase
      .from('automation_rules')
      .insert(rulesToCreate)
      .select();

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    // 4. สร้าง notification templates ที่เกี่ยวข้อง
    const notificationTemplates = [
      {
        clinic_id: clinicId,
        template_name: 'welcome_template',
        type: 'welcome',
        title: 'ยินดีต้อนรับสู่ BN-Aura',
        message_template: 'สวัสดี {customer_name}! ยินดีต้อนรับสู่ BN-Aura คลินิกความงามครบวงจร เราพร้อมดูแลความงามของคุณ',
        auto_variables: ['customer_name'],
        created_at: new Date().toISOString()
      },
      {
        clinic_id: clinicId,
        template_name: 'consultation_reminder_template',
        type: 'appointment_reminder',
        title: 'แจ้งเตือนนัดหมาย',
        message_template: 'แจ้งเตือนนัดหมายของคุณ {customer_name} ในวันที่ {appointment_date} เวลา {appointment_time}',
        auto_variables: ['customer_name', 'appointment_date', 'appointment_time'],
        created_at: new Date().toISOString()
      },
      {
        clinic_id: clinicId,
        template_name: 'commission_template',
        type: 'commission',
        title: 'ค่าคอมมิชชั่น',
        message_template: 'ยินดีด้วย! คุณได้รับค่าคอมมิชชั่น ฿{commission_amount} จากการขาย {transaction_type}',
        auto_variables: ['commission_amount', 'transaction_type'],
        created_at: new Date().toISOString()
      }
    ];

    // สร้าง notification templates (ถ้ามี table นี้)
    try {
      await supabase
        .from('notification_templates')
        .insert(notificationTemplates);
    } catch (templateError) {
      // ไม่ต้องทำอะไรถ้า table ไม่มี
      console.log('Notification templates table may not exist:', templateError);
    }

    return NextResponse.json({
      message: 'Automation rules successfully created',
      created: createdRules?.length || 0,
      total: baseRules.length,
      rules: createdRules
    });

  } catch (error) {
    console.error('Automation Rules Creation Error:', error);
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

    if (!clinicId) {
      return NextResponse.json({ 
        error: 'Missing required parameter: clinicId' 
      }, { status: 400 });
    }

    // ดึง automation rules ทั้งหมด
    const { data: rules, error: rulesError } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false });

    if (rulesError) {
      return NextResponse.json({ error: rulesError.message }, { status: 500 });
    }

    return NextResponse.json({
      rules: rules || [],
      total: rules?.length || 0
    });

  } catch (error) {
    console.error('Get Automation Rules Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
