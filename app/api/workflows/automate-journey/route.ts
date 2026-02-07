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

    const { customerId, clinicId, triggerEvent } = await request.json();

    if (!customerId || !clinicId || !triggerEvent) {
      return NextResponse.json({ 
        error: 'Missing required fields: customerId, clinicId, triggerEvent' 
      }, { status: 400 });
    }

    // ดึงข้อมูล customer และ workflow state
    const [customerResult, workflowResult] = await Promise.all([
      supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .eq('clinic_id', clinicId)
        .single(),
      
      supabase
        .from('workflow_states')
        .select('*')
        .eq('customer_id', customerId)
        .eq('clinic_id', clinicId)
        .single()
    ]);

    if (customerResult.error || !customerResult.data) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const customer = customerResult.data;
    const workflow = workflowResult.data;

    let automationResults = [];

    // ดำเนินการ automation ตาม trigger event
    switch (triggerEvent) {
      case 'customer_created':
        automationResults.push(await handleCustomerCreated(supabase, customer));
        break;
      
      case 'scan_completed':
        automationResults.push(await handleScanCompleted(supabase, customer, workflow));
        break;
      
      case 'consultation_scheduled':
        automationResults.push(await handleConsultationScheduled(supabase, customer, workflow));
        break;
      
      case 'treatment_completed':
        automationResults.push(await handleTreatmentCompleted(supabase, customer, workflow));
        break;
      
      case 'follow_up_reminder':
        automationResults.push(await handleFollowUpReminder(supabase, customer, workflow));
        break;
      
      default:
        return NextResponse.json({ error: 'Invalid trigger event' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      automationResults,
      customer: customer.full_name,
      triggerEvent
    });

  } catch (error: any) {
    console.error('Journey automation error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// Handle customer creation automation
async function handleCustomerCreated(supabase: any, customer: any) {
  try {
    // 1. สร้าง welcome notification
    await supabase
      .from('notifications')
      .insert({
        user_id: customer.assigned_sales_id,
        clinic_id: customer.clinic_id,
        title: 'New Customer Assigned',
        message: `New customer ${customer.full_name} has been assigned to you. Schedule initial consultation.`,
        type: 'new_customer',
        metadata: {
          customer_id: customer.id,
          action_required: 'schedule_consultation'
        }
      });

    // 2. สร้าง initial workflow state
    await supabase
      .from('workflow_states')
      .upsert({
        clinic_id: customer.clinic_id,
        customer_id: customer.id,
        current_stage: 'initial_contact',
        assigned_sales_id: customer.assigned_sales_id,
        metadata: {
          automated: true,
          created_date: new Date().toISOString()
        }
      }, {
        onConflict: 'customer_id,clinic_id'
      });

    // 3. สร้าง follow-up reminder สำหรับ 24 ชั่วโมง
    await supabase
      .from('followup_sequences')
      .insert({
        clinic_id: customer.clinic_id,
        customer_id: customer.id,
        sequence_type: 'welcome_series',
        trigger_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        status: 'scheduled',
        message_template: 'welcome_new_customer',
        metadata: {
          automated: true,
          step: 1
        }
      });

    return {
      action: 'customer_created',
      success: true,
      message: 'Welcome workflow initiated'
    };

  } catch (error: any) {
    console.error('Customer creation automation error:', error);
    return {
      action: 'customer_created',
      success: false,
      error: error.message
    };
  }
}

// Handle scan completion automation
async function handleScanCompleted(supabase: any, customer: any, workflow: any) {
  try {
    // 1. อัพเดท workflow stage
    await supabase
      .from('workflow_states')
      .update({
        current_stage: 'scan_completed',
        updated_at: new Date().toISOString()
      })
      .eq('customer_id', customer.id);

    // 2. สร้าง consultation booking notification
    await supabase
      .from('notifications')
      .insert({
        user_id: customer.assigned_sales_id,
        clinic_id: customer.clinic_id,
        title: 'AI Scan Results Ready',
        message: `${customer.full_name}'s skin analysis is complete. Schedule consultation to discuss results.`,
        type: 'scan_ready',
        metadata: {
          customer_id: customer.id,
          workflow_id: workflow?.id,
          action_required: 'schedule_consultation'
        }
      });

    // 3. สร้าง auto follow-up sequence
    await supabase
      .from('followup_sequences')
      .insert({
        clinic_id: customer.clinic_id,
        customer_id: customer.id,
        sequence_type: 'post_scan_followup',
        trigger_date: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
        status: 'scheduled',
        message_template: 'scan_results_available',
        metadata: {
          automated: true,
          scan_integration: true
        }
      });

    return {
      action: 'scan_completed',
      success: true,
      message: 'Post-scan automation triggered'
    };

  } catch (error: any) {
    console.error('Scan completion automation error:', error);
    return {
      action: 'scan_completed', 
      success: false,
      error: error.message
    };
  }
}

// Handle consultation scheduling automation
async function handleConsultationScheduled(supabase: any, customer: any, workflow: any) {
  try {
    // 1. อัพเดท workflow stage
    await supabase
      .from('workflow_states')
      .update({
        current_stage: 'consultation_scheduled',
        updated_at: new Date().toISOString()
      })
      .eq('customer_id', customer.id);

    // 2. สร้าง reminder notifications
    const consultationDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
    
    // Reminder 1 hour before
    await supabase
      .from('followup_sequences')
      .insert({
        clinic_id: customer.clinic_id,
        customer_id: customer.id,
        sequence_type: 'appointment_reminder',
        trigger_date: new Date(consultationDate.getTime() - 60 * 60 * 1000),
        status: 'scheduled',
        message_template: 'consultation_reminder_1h',
        metadata: {
          automated: true,
          reminder_type: '1_hour_before'
        }
      });

    // Follow-up if no show
    await supabase
      .from('followup_sequences')
      .insert({
        clinic_id: customer.clinic_id,
        customer_id: customer.id,
        sequence_type: 'no_show_followup',
        trigger_date: new Date(consultationDate.getTime() + 30 * 60 * 1000),
        status: 'scheduled',
        message_template: 'consultation_no_show',
        metadata: {
          automated: true,
          conditional: 'if_no_show'
        }
      });

    return {
      action: 'consultation_scheduled',
      success: true,
      message: 'Consultation reminders scheduled'
    };

  } catch (error: any) {
    console.error('Consultation scheduling automation error:', error);
    return {
      action: 'consultation_scheduled',
      success: false,
      error: error.message
    };
  }
}

// Handle treatment completion automation  
async function handleTreatmentCompleted(supabase: any, customer: any, workflow: any) {
  try {
    // 1. อัพเดท workflow และ journey
    await Promise.all([
      supabase
        .from('workflow_states')
        .update({
          current_stage: 'treatment_completed',
          updated_at: new Date().toISOString()
        })
        .eq('customer_id', customer.id),
      
      supabase
        .from('customer_treatment_journeys')
        .update({
          journey_status: 'treatment_completed',
          actual_completion_date: new Date().toISOString(),
          next_follow_up_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        })
        .eq('customer_id', customer.id)
    ]);

    // 2. คำนวณ actual commission
    const { data: commissionData } = await supabase
      .from('sales_commissions')
      .select('*')
      .eq('customer_id', customer.id)
      .eq('workflow_id', workflow?.id);

    if (commissionData && commissionData.length > 0) {
      await supabase
        .from('workflow_states')
        .update({
          commission_calculated: true,
          actual_commission: workflow?.estimated_commission || 0
        })
        .eq('customer_id', customer.id);
    }

    // 3. สร้าง follow-up sequence
    const followUpDates = [
      { days: 1, template: 'treatment_followup_day1' },
      { days: 7, template: 'treatment_followup_week1' },
      { days: 30, template: 'treatment_followup_month1' }
    ];

    for (const followUp of followUpDates) {
      await supabase
        .from('followup_sequences')
        .insert({
          clinic_id: customer.clinic_id,
          customer_id: customer.id,
          sequence_type: 'post_treatment_care',
          trigger_date: new Date(Date.now() + followUp.days * 24 * 60 * 60 * 1000),
          status: 'scheduled',
          message_template: followUp.template,
          metadata: {
            automated: true,
            follow_up_day: followUp.days
          }
        });
    }

    return {
      action: 'treatment_completed',
      success: true,
      message: 'Post-treatment automation initiated'
    };

  } catch (error: any) {
    console.error('Treatment completion automation error:', error);
    return {
      action: 'treatment_completed',
      success: false,
      error: error.message
    };
  }
}

// Handle follow-up reminder automation
async function handleFollowUpReminder(supabase: any, customer: any, workflow: any) {
  try {
    // 1. ส่ง follow-up notification
    await supabase
      .from('notifications')
      .insert({
        user_id: customer.assigned_sales_id,
        clinic_id: customer.clinic_id,
        title: 'Customer Follow-up Required',
        message: `Follow up with ${customer.full_name} about their treatment progress.`,
        type: 'follow_up_reminder',
        metadata: {
          customer_id: customer.id,
          workflow_id: workflow?.id,
          automated: true
        }
      });

    // 2. อัพเดท next follow-up date
    await supabase
      .from('customer_treatment_journeys')
      .update({
        next_follow_up_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // Next 2 weeks
      })
      .eq('customer_id', customer.id);

    return {
      action: 'follow_up_reminder',
      success: true,
      message: 'Follow-up reminder sent'
    };

  } catch (error: any) {
    console.error('Follow-up automation error:', error);
    return {
      action: 'follow_up_reminder',
      success: false,
      error: error.message
    };
  }
}
