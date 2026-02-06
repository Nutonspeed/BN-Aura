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

    const { scanId, customerId, clinicId } = await request.json();

    if (!scanId || !customerId || !clinicId) {
      return NextResponse.json({ 
        error: 'Missing required fields: scanId, customerId, clinicId' 
      }, { status: 400 });
    }

    // 1. ดึง AI scan results
    const { data: scanData, error: scanError } = await supabase
      .from('skin_analyses')
      .select('*')
      .eq('id', scanId)
      .eq('user_id', customerId)
      .single();

    if (scanError || !scanData) {
      return NextResponse.json({ 
        error: 'Skin analysis not found' 
      }, { status: 404 });
    }

    // 2. ดึง customer data
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .eq('clinic_id', clinicId)
      .single();

    if (customerError || !customerData) {
      return NextResponse.json({ 
        error: 'Customer not found' 
      }, { status: 404 });
    }

    // 3. สร้าง treatment recommendations based on scan results
    const treatmentPlan = generateTreatmentPlan(scanData);

    // 4. สร้างหรืออัพเดท workflow state
    const { data: existingWorkflow } = await supabase
      .from('workflow_states')
      .select('*')
      .eq('customer_id', customerId)
      .eq('clinic_id', clinicId)
      .single();

    let workflowData;

    if (existingWorkflow) {
      // อัพเดท existing workflow
      const { data: updatedWorkflow, error: updateError } = await supabase
        .from('workflow_states')
        .update({
          current_stage: 'scan_completed',
          scan_results: scanData,
          treatment_plan: treatmentPlan,
          updated_at: new Date().toISOString(),
          assigned_sales_id: customerData.assigned_sales_id
        })
        .eq('id', existingWorkflow.id)
        .select()
        .single();

      if (updateError) {
        console.error('Update workflow error:', updateError);
        return NextResponse.json({ 
          error: 'Failed to update workflow' 
        }, { status: 500 });
      }

      workflowData = updatedWorkflow;
    } else {
      // สร้าง new workflow
      const { data: newWorkflow, error: createError } = await supabase
        .from('workflow_states')
        .insert({
          clinic_id: clinicId,
          customer_id: customerId,
          current_stage: 'scan_completed',
          assigned_sales_id: customerData.assigned_sales_id,
          scan_results: scanData,
          treatment_plan: treatmentPlan,
          metadata: {
            scan_integration_date: new Date().toISOString(),
            automated: true
          }
        })
        .select()
        .single();

      if (createError) {
        console.error('Create workflow error:', createError);
        return NextResponse.json({ 
          error: 'Failed to create workflow' 
        }, { status: 500 });
      }

      workflowData = newWorkflow;
    }

    // 5. สร้าง customer treatment journey
    const { error: journeyError } = await supabase
      .from('customer_treatment_journeys')
      .upsert({
        customer_id: customerId,
        sales_staff_id: customerData.assigned_sales_id,
        clinic_id: clinicId,
        workflow_state_id: workflowData.id,
        journey_status: 'consultation_needed',
        initial_scan_results: scanData,
        treatment_plan: treatmentPlan,
        consultation_date: null,
        metadata: {
          auto_created_from_scan: true,
          scan_id: scanId
        }
      }, {
        onConflict: 'customer_id,clinic_id'
      });

    if (journeyError) {
      console.error('Journey creation error:', journeyError);
    }

    // 6. คำนวณ estimated commission
    const estimatedCommission = calculateEstimatedCommission(treatmentPlan, clinicId);
    
    if (estimatedCommission > 0) {
      await supabase
        .from('workflow_states')
        .update({
          estimated_commission: estimatedCommission,
          commission_rate: 0.15, // 15% default rate
        })
        .eq('id', workflowData.id);
    }

    // 7. สร้าง notification สำหรับ sales staff
    if (customerData.assigned_sales_id) {
      await supabase
        .from('notifications')
        .insert({
          user_id: customerData.assigned_sales_id,
          clinic_id: clinicId,
          title: 'New AI Scan Results Available',
          message: `Customer ${customerData.full_name} has completed AI skin analysis. Treatment recommendations ready for consultation.`,
          type: 'workflow_update',
          metadata: {
            customer_id: customerId,
            workflow_id: workflowData.id,
            scan_id: scanId
          }
        });
    }

    return NextResponse.json({
      success: true,
      workflow: workflowData,
      treatmentPlan,
      estimatedCommission
    });

  } catch (error) {
    console.error('Workflow integration error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// Helper function to generate treatment plan from scan results
function generateTreatmentPlan(scanData: any) {
  const recommendations = [];
  
  // Based on scan scores, recommend treatments
  if (scanData.spots_score < 70) {
    recommendations.push({
      treatment_type: 'pigmentation_treatment',
      priority: 'high',
      estimated_sessions: 3,
      estimated_cost: 15000,
      reason: 'High pigmentation detected'
    });
  }
  
  if (scanData.wrinkles_score < 75) {
    recommendations.push({
      treatment_type: 'anti_aging_treatment', 
      priority: 'medium',
      estimated_sessions: 4,
      estimated_cost: 20000,
      reason: 'Wrinkle prevention needed'
    });
  }
  
  if (scanData.texture_score < 70) {
    recommendations.push({
      treatment_type: 'skin_resurfacing',
      priority: 'medium', 
      estimated_sessions: 2,
      estimated_cost: 12000,
      reason: 'Texture improvement needed'
    });
  }

  if (scanData.pores_score < 75) {
    recommendations.push({
      treatment_type: 'pore_refinement',
      priority: 'low',
      estimated_sessions: 2,
      estimated_cost: 8000,
      reason: 'Pore size reduction'
    });
  }

  return {
    recommendations,
    total_estimated_cost: recommendations.reduce((sum, rec) => sum + rec.estimated_cost, 0),
    total_estimated_sessions: recommendations.reduce((sum, rec) => sum + rec.estimated_sessions, 0),
    priority_level: recommendations.some(r => r.priority === 'high') ? 'high' : 
                   recommendations.some(r => r.priority === 'medium') ? 'medium' : 'low'
  };
}

// Helper function to calculate estimated commission
function calculateEstimatedCommission(treatmentPlan: any, clinicId: string) {
  const baseCommissionRate = 0.15; // 15%
  return treatmentPlan.total_estimated_cost * baseCommissionRate;
}
