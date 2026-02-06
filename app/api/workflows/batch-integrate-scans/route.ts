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

    // 1. ดึง AI scans ทั้งหมดที่ยังไม่ได้เชื่อมกับ workflow
    const { data: unlinkedScans, error: scansError } = await supabase
      .from('skin_analyses')
      .select(`
        id,
        user_id,
        clinic_id,
        overall_score,
        skin_health_grade,
        recommendations,
        analyzed_at
      `)
      .eq('clinic_id', clinicId)
      .not('overall_score', 'is', null);

    if (scansError) {
      return NextResponse.json({ error: scansError.message }, { status: 500 });
    }

    if (!unlinkedScans || unlinkedScans.length === 0) {
      return NextResponse.json({ 
        message: 'No AI scans found',
        processed: 0
      });
    }

    // 2. ดึงข้อมูล customers ที่เกี่ยวข้อง
    const userIds = unlinkedScans.map(scan => scan.user_id);
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, assigned_sales_id, clinic_id')
      .in('id', userIds)
      .not('assigned_sales_id', 'is', null);

    if (customersError) {
      return NextResponse.json({ error: customersError.message }, { status: 500 });
    }

    // 3. กรองเฉพาะ scans ที่มี sales staff assignment
    const customerMap = new Map(customers?.map(c => [c.id, c]) || []);
    const validScans = unlinkedScans.filter(scan => 
      customerMap.has(scan.user_id) && customerMap.get(scan.user_id)?.assigned_sales_id
    );

    // 2. สร้าง workflow states สำหรับแต่ละ AI scan
    const workflowCreations = [];
    
    for (const scan of validScans) {
      const customer = customerMap.get(scan.user_id);
      
      if (!customer || !customer.assigned_sales_id) {
        continue; // Skip if no customer or sales assignment
      }
      
      // สร้าง workflow state
      const { data: workflow, error: workflowError } = await supabase
        .from('workflow_states')
        .insert({
          clinic_id: scan.clinic_id,
          customer_id: scan.user_id,
          current_stage: 'consultation_scheduled',
          assigned_sales_id: customer.assigned_sales_id,
          scan_results: {
            overall_score: scan.overall_score,
            skin_health_grade: scan.skin_health_grade,
            recommendations: scan.recommendations,
            analyzed_at: scan.analyzed_at
          },
          treatment_plan: generateTreatmentPlan(scan.recommendations, scan.overall_score),
          commission_calculated: false,
          estimated_commission: calculateEstimatedCommission(scan.overall_score),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (!workflowError && workflow) {
        // อัพเดต AI scan ให้ชี้ไปที่ workflow
        await supabase
          .from('skin_analyses')
          .update({
            metadata: {
              workflow_id: workflow.id,
              integrated_at: new Date().toISOString()
            }
          })
          .eq('id', scan.id);

        // สร้าง customer treatment journey
        await supabase
          .from('customer_treatment_journeys')
          .insert({
            customer_id: scan.user_id,
            sales_staff_id: customer.assigned_sales_id,
            clinic_id: scan.clinic_id,
            journey_status: 'active',
            initial_scan_results: {
              overall_score: scan.overall_score,
              skin_health_grade: scan.skin_health_grade,
              recommendations: scan.recommendations
            },
            treatment_plan: generateTreatmentPlan(scan.recommendations, scan.overall_score),
            consultation_date: new Date().toISOString(),
            next_follow_up_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
            workflow_state_id: workflow.id,
            created_at: new Date().toISOString()
          });

        workflowCreations.push({
          scanId: scan.id,
          workflowId: workflow.id,
          customerId: scan.user_id,
          salesId: customer.assigned_sales_id
        });
      }
    }

    return NextResponse.json({
      message: 'AI scans successfully integrated with workflows',
      processed: workflowCreations.length,
      workflows: workflowCreations
    });

  } catch (error) {
    console.error('AI Scan Integration Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// Helper functions
function generateTreatmentPlan(recommendations: any, overallScore: number): any {
  if (!recommendations || typeof recommendations !== 'object') {
    return {
      recommended_treatments: ['basic_facial'],
      priority: 'low',
      estimated_sessions: 1,
      total_duration_minutes: 60
    };
  }

  const treatments = [];
  let priority = 'low';
  let sessions = 1;
  let duration = 60;

  if (overallScore >= 80) {
    priority = 'high';
    sessions = 3;
    duration = 90;
    treatments.push('advanced_rejuvenation', 'deep_cleaning', 'hydration_boost');
  } else if (overallScore >= 60) {
    priority = 'medium';
    sessions = 2;
    duration = 75;
    treatments.push('standard_facial', 'spot_treatment');
  } else {
    treatments.push('basic_facial', 'consultation');
  }

  return {
    recommended_treatments: treatments,
    priority: priority,
    estimated_sessions: sessions,
    total_duration_minutes: duration,
    based_on_score: overallScore
  };
}

function calculateEstimatedCommission(overallScore: number): number {
  // คำนวณค่าคอมมิชชั่นโดยประมาณตามคะแนน
  const baseCommission = 500; // ฿500 base
  const scoreBonus = Math.floor(overallScore / 10) * 100; // ฿100 per 10 points
  return baseCommission + scoreBonus;
}
