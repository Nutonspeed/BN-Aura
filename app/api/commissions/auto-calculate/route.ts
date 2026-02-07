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

    const { workflowId, customerId, clinicId, transactionType = 'treatment_sale' } = await request.json();

    if (!customerId || !clinicId) {
      return NextResponse.json({ 
        error: 'Missing required fields: customerId, clinicId' 
      }, { status: 400 });
    }

    // ดึงข้อมูล workflow และ customer
    const [workflowResult, customerResult] = await Promise.all([
      workflowId ? supabase
        .from('workflow_states')
        .select('*')
        .eq('id', workflowId)
        .single() : { data: null, error: null },
      
      supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .eq('clinic_id', clinicId)
        .single()
    ]);

    if (customerResult.error || !customerResult.data) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const customer = customerResult.data;
    const workflow = workflowResult.data;

    // ดึง commission rules สำหรับ clinic
    const { data: commissionRules, error: rulesError } = await supabase
      .from('commission_rules')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true);

    if (rulesError) {
      console.error('Commission rules error:', rulesError);
      return NextResponse.json({ 
        error: 'Failed to fetch commission rules' 
      }, { status: 500 });
    }

    // คำนวณ commission ตาม transaction type
    let calculationResult;

    switch (transactionType) {
      case 'treatment_sale':
        calculationResult = await calculateTreatmentCommission(supabase, customer, workflow, commissionRules);
        break;
      
      case 'consultation_fee':
        calculationResult = await calculateConsultationCommission(supabase, customer, workflow, commissionRules);
        break;
      
      case 'product_sale':
        calculationResult = await calculateProductCommission(supabase, customer, workflow, commissionRules);
        break;
      
      case 'membership_sale':
        calculationResult = await calculateMembershipCommission(supabase, customer, workflow, commissionRules);
        break;
      
      default:
        return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 });
    }

    if (!calculationResult.success) {
      return NextResponse.json({ 
        error: calculationResult.error 
      }, { status: 500 });
    }

    // บันทึก commission record
    const { data: commissionRecord, error: commissionError } = await supabase
      .from('sales_commissions')
      .insert({
        clinic_id: clinicId,
        sales_staff_id: customer.assigned_sales_id,
        customer_id: customerId,
        workflow_id: workflowId,
        transaction_type: transactionType,
        base_amount: calculationResult.baseAmount,
        commission_rate: calculationResult.rate,
        commission_amount: (calculationResult!.amount || 0),
        payment_status: 'pending',
        transaction_date: new Date().toISOString(),
        created_by: user.id
      })
      .select()
      .single();

    if (commissionError) {
      console.error('Commission record error:', commissionError);
      return NextResponse.json({ 
        error: 'Failed to create commission record' 
      }, { status: 500 });
    }

    // อัพเดท workflow state ถ้ามี
    if (workflow) {
      await supabase
        .from('workflow_states')
        .update({
          commission_calculated: true,
          actual_commission: calculationResult!.amount,
          commission_rate: calculationResult.rate,
          updated_at: new Date().toISOString()
        })
        .eq('id', workflowId);
    }

    // สร้าง notification สำหรับ sales staff
    await supabase
      .from('notifications')
      .insert({
        user_id: customer.assigned_sales_id,
        clinic_id: clinicId,
        title: 'Commission Calculated',
        // @ts-ignore
        message: `New commission of ฿${calculationResult.amount.toLocaleString()} calculated for customer ${customer.full_name}`,
        type: 'commission_update',
        metadata: {
          customer_id: customerId,
          commission_id: commissionRecord.id,
          amount: calculationResult.amount,
          transaction_type: transactionType
        }
      });

    return NextResponse.json({
      success: true,
      commission: commissionRecord,
      calculation: calculationResult,
      customer: customer.full_name
    });

  } catch (error: any) {
    console.error('Commission calculation error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// Calculate treatment commission
async function calculateTreatmentCommission(supabase: any, customer: any, workflow: any, rules: any[]) {
  try {
    // หา treatment rule ที่เหมาะสม
    const treatmentRule = rules.find(rule => 
      rule.commission_type === 'treatment' || 
      rule.commission_type === 'default'
    );

    if (!treatmentRule) {
      return {
        success: false,
        error: 'No treatment commission rule found'
      };
    }

    // คำนวณ base amount จาก treatment plan
    let baseAmount = 0;
    
    if (workflow?.treatment_plan?.total_estimated_cost) {
      baseAmount = workflow.treatment_plan.total_estimated_cost;
    } else {
      // ใช้ค่าเฉลี่ย treatment cost
      baseAmount = 15000; // Default treatment cost
    }

    // คำนวณ commission rate ตาม tier และ performance
    let commissionRate = treatmentRule.base_rate || 0.15; // 15% default

    // Tier-based adjustment
    if (treatmentRule.tier_multipliers) {
      const tierMultiplier = treatmentRule.tier_multipliers[customer.tier] || 1.0;
      commissionRate *= tierMultiplier;
    }

    // Performance-based bonus
    const performanceBonus = await calculatePerformanceBonus(supabase, customer.assigned_sales_id);
    commissionRate += performanceBonus;

    // คำนวณ final commission amount
    const commissionAmount = baseAmount * commissionRate;

    return {
      success: true,
      baseAmount,
      rate: commissionRate,
      amount: Math.round(commissionAmount * 100) / 100, // Round to 2 decimals
      rule: treatmentRule.rule_name,
      performanceBonus
    };

  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Calculate consultation commission
async function calculateConsultationCommission(supabase: any, customer: any, workflow: any, rules: any[]) {
  try {
    const consultationRule = rules.find(rule => rule.commission_type === 'consultation');
    
    if (!consultationRule) {
      return {
        success: false,
        error: 'No consultation commission rule found'
      };
    }

    const baseAmount = consultationRule.fixed_amount || 500; // Fixed consultation fee
    const commissionRate = consultationRule.base_rate || 0.30; // 30% of consultation fee
    
    return {
      success: true,
      baseAmount,
      rate: commissionRate,
      amount: Math.round(baseAmount * commissionRate),
      rule: consultationRule.rule_name
    };

  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Calculate product commission
async function calculateProductCommission(supabase: any, customer: any, workflow: any, rules: any[]) {
  try {
    const productRule = rules.find(rule => rule.commission_type === 'product');
    
    if (!productRule) {
      return {
        success: false,
        error: 'No product commission rule found'
      };
    }

    // ดึงข้อมูล POS transactions ล่าสุด
    const { data: recentTransactions } = await supabase
      .from('pos_transactions')
      .select('total_amount')
      .eq('customer_id', customer.id)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .order('created_at', { ascending: false })
      .limit(1);

    const baseAmount = recentTransactions?.[0]?.total_amount || 2000; // Default product sale
    const commissionRate = productRule.base_rate || 0.10; // 10% for products
    
    return {
      success: true,
      baseAmount,
      rate: commissionRate,
      amount: Math.round(baseAmount * commissionRate),
      rule: productRule.rule_name
    };

  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Calculate membership commission
async function calculateMembershipCommission(supabase: any, customer: any, workflow: any, rules: any[]) {
  try {
    const membershipRule = rules.find(rule => rule.commission_type === 'membership');
    
    if (!membershipRule) {
      return {
        success: false,
        error: 'No membership commission rule found'
      };
    }

    // ดึงข้อมูล membership
    const { data: membership } = await supabase
      .from('memberships')
      .select('*')
      .eq('customer_id', customer.id)
      .eq('status', 'active')
      .single();

    const baseAmount = membership?.total_value || 10000; // Default membership value
    const commissionRate = membershipRule.base_rate || 0.05; // 5% for membership
    
    return {
      success: true,
      baseAmount,
      rate: commissionRate,
      amount: Math.round(baseAmount * commissionRate),
      rule: membershipRule.rule_name
    };

  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Calculate performance bonus
async function calculatePerformanceBonus(supabase: any, salesStaffId: string) {
  try {
    // ดึงข้อมูล performance ในเดือนปัจจุบัน
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthlyPerformance } = await supabase
      .from('sales_commissions')
      .select('commission_amount')
      .eq('sales_staff_id', salesStaffId)
      .gte('created_at', startOfMonth.toISOString())
      .eq('payment_status', 'paid');

    if (!monthlyPerformance || monthlyPerformance.length === 0) {
      return 0;
    }

    const totalCommissions = monthlyPerformance.reduce((sum: number, record: any) => 
      sum + parseFloat(record.commission_amount), 0);

    // Performance tiers
    if (totalCommissions >= 50000) {
      return 0.05; // 5% bonus for top performers
    } else if (totalCommissions >= 30000) {
      return 0.03; // 3% bonus for good performers
    } else if (totalCommissions >= 15000) {
      return 0.01; // 1% bonus for average performers
    }

    return 0; // No bonus

  } catch (error: any) {
    console.error('Performance calculation error:', error);
    return 0;
  }
}
