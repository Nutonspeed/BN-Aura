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

    // 1. ดึง pending commissions ทั้งหมด
    const { data: pendingCommissions, error: commissionsError } = await supabase
      .from('sales_commissions')
      .select(`
        id,
        clinic_id,
        sales_staff_id,
        customer_id,
        transaction_type,
        base_amount,
        commission_rate,
        commission_amount,
        payment_status,
        transaction_date,
        workflow_id,
        created_at
      `)
      .eq('clinic_id', clinicId)
      .eq('payment_status', 'pending');

    if (commissionsError) {
      return NextResponse.json({ error: commissionsError.message }, { status: 500 });
    }

    if (!pendingCommissions || pendingCommissions.length === 0) {
      return NextResponse.json({ 
        message: 'No pending commissions found',
        processed: 0
      });
    }

    // 2. ประมวลผลค่าคอมมิชชั่นใหม่
    const processedCommissions = [];
    
    for (const commission of pendingCommissions) {
      // คำนวณค่าคอมมิชชั่นใหม่ตาม business rules
      const newCommissionAmount = calculateCommission(
        commission.base_amount,
        commission.transaction_type,
        commission.commission_rate
      );

      // อัพเดตค่าคอมมิชชั่น
      const { data: updatedCommission, error: updateError } = await supabase
        .from('sales_commissions')
        .update({
          commission_amount: newCommissionAmount,
          payment_status: 'calculated',
          updated_at: new Date().toISOString(),
          updated_by: user.id
        })
        .eq('id', commission.id)
        .select()
        .single();

      if (!updateError && updatedCommission) {
        // สร้าง notification สำหรับ sales staff
        await supabase
          .from('notifications')
          .insert({
            user_id: commission.sales_staff_id,
            clinic_id: commission.clinic_id,
            type: 'commission_calculated',
            title: 'ค่าคอมมิชชั่นถูกคำนวณแล้ว',
            message: `ค่าคอมมิชชั่น ฿${newCommissionAmount.toLocaleString()} จากการขาย ${getTransactionTypeName(commission.transaction_type)}`,
            action_url: `/th/sales/commissions/${commission.id}`,
            priority: 'medium',
            created_at: new Date().toISOString(),
            created_by: user.id
          });

        // อัพเดต workflow state ถ้ามี
        if (commission.workflow_id) {
          await supabase
            .from('workflow_states')
            .update({
              commission_calculated: true,
              actual_commission: newCommissionAmount,
              updated_at: new Date().toISOString()
            })
            .eq('id', commission.workflow_id);
        }

        processedCommissions.push({
          commissionId: commission.id,
          oldAmount: commission.commission_amount,
          newAmount: newCommissionAmount,
          salesStaffId: commission.sales_staff_id,
          transactionType: commission.transaction_type
        });
      }
    }

    return NextResponse.json({
      message: 'Commissions successfully processed',
      total_pending: pendingCommissions.length,
      processed: processedCommissions.length,
      commissions: processedCommissions
    });

  } catch (error) {
    console.error('Commission Processing Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// Helper functions
function calculateCommission(baseAmount: number, transactionType: string, currentRate: number): number {
  let commissionRate = currentRate;
  
  // ปรับ commission rate ตาม transaction type
  switch (transactionType) {
    case 'treatment_sale':
      commissionRate = Math.max(commissionRate, 0.10); // ขั้นต่ำ 10%
      break;
    case 'consultation':
      commissionRate = Math.max(commissionRate, 0.15); // ขั้นต่ำ 15%
      break;
    case 'product_sale':
      commissionRate = Math.max(commissionRate, 0.08); // ขั้นต่ำ 8%
      break;
    case 'membership':
      commissionRate = Math.max(commissionRate, 0.20); // ขั้นต่ำ 20%
      break;
    default:
      commissionRate = 0.10; // default 10%
  }

  // เพิ่ม bonus สำหรับยอดสูง
  let bonus = 0;
  if (baseAmount > 10000) {
    bonus = baseAmount * 0.02; // 2% bonus สำหรับยอด > 10k
  } else if (baseAmount > 5000) {
    bonus = baseAmount * 0.01; // 1% bonus สำหรับยอด > 5k
  }

  return Math.round((baseAmount * commissionRate) + bonus);
}

function getTransactionTypeName(transactionType: string): string {
  const typeNames = {
    'treatment_sale': 'ทรีทเมนต์',
    'consultation': 'การปรึกษา',
    'product_sale': 'ผลิตภัณฑ์',
    'membership': 'สมาชิก',
    'package': 'แพ็กเกจ'
  };
  
  return typeNames[transactionType] || transactionType;
}
