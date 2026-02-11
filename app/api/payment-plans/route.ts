import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';


// GET: List payment plans
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');
    const status = searchParams.get('status');

    const adminClient = createAdminClient();
    const { data: staff } = await adminClient.from('clinic_staff').select('clinic_id').eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();
    if (!staff) return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });

    let query = adminClient
      .from('payment_plans')
      .select('*, customer:customers(full_name, phone), installments:payment_plan_installments(*)')
      .eq('clinic_id', staff.clinic_id)
      .order('created_at', { ascending: false });

    if (customerId) query = query.eq('customer_id', customerId);
    if (status) query = query.eq('status', status);

    const { data: plans } = await query.limit(100);

    return NextResponse.json({ plans: plans || [] });
  } catch (error) {
    console.error('Payment plans error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create payment plan
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { customerId, totalAmount, downPayment = 0, installments, interestRate = 0, orderId, notes } = body;

    if (!customerId || !totalAmount || !installments) {
      return NextResponse.json({ error: 'customerId, totalAmount, and installments required' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { data: staff } = await adminClient.from('clinic_staff').select('clinic_id').eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();
    if (!staff) return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });

    const remaining = totalAmount - downPayment;
    const totalWithInterest = remaining * (1 + interestRate / 100);
    const installmentAmount = Math.ceil(totalWithInterest / installments);

    // Create plan
    const { data: plan, error: planError } = await adminClient
      .from('payment_plans')
      .insert({
        clinic_id: staff.clinic_id,
        customer_id: customerId,
        order_id: orderId,
        total_amount: totalAmount,
        down_payment: downPayment,
        remaining_amount: remaining,
        installments,
        installment_amount: installmentAmount,
        interest_rate: interestRate,
        status: 'active',
        notes
      })
      .select()
      .single();

    if (planError) return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });

    // Create installments
    const installmentRecords = [];
    const startDate = new Date();
    for (let i = 1; i <= installments; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      installmentRecords.push({
        plan_id: plan.id,
        installment_number: i,
        amount: installmentAmount,
        due_date: dueDate.toISOString().split('T')[0],
        status: 'pending'
      });
    }

    await adminClient.from('payment_plan_installments').insert(installmentRecords);

    // Update plan with next payment date
    await adminClient
      .from('payment_plans')
      .update({ next_payment_date: installmentRecords[0].due_date })
      .eq('id', plan.id);

    // Fetch complete plan
    const { data: completePlan } = await adminClient
      .from('payment_plans')
      .select('*, installments:payment_plan_installments(*)')
      .eq('id', plan.id)
      .single();

    return NextResponse.json({ success: true, plan: completePlan });
  } catch (error) {
    console.error('Create payment plan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Pay installment
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { installmentId, paidAmount, paymentMethod, transactionId } = body;

    if (!installmentId) return NextResponse.json({ error: 'installmentId required' }, { status: 400 });

    const adminClient = createAdminClient();

    const { data: installment, error } = await adminClient
      .from('payment_plan_installments')
      .update({
        paid_date: new Date().toISOString().split('T')[0],
        paid_amount: paidAmount,
        status: 'paid',
        payment_method: paymentMethod,
        transaction_id: transactionId
      })
      .eq('id', installmentId)
      .select('*, plan:payment_plans(*)')
      .single();

    if (error) return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });

    // Check if all installments paid
    const { data: remaining } = await adminClient
      .from('payment_plan_installments')
      .select('id')
      .eq('plan_id', installment.plan.id)
      .eq('status', 'pending');

    if (!remaining?.length) {
      await adminClient
        .from('payment_plans')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', installment.plan.id);
    } else {
      // Update next payment date
      const { data: next } = await adminClient
        .from('payment_plan_installments')
        .select('due_date')
        .eq('plan_id', installment.plan.id)
        .eq('status', 'pending')
        .order('due_date')
        .limit(1)
        .single();

      if (next) {
        await adminClient
          .from('payment_plans')
          .update({ next_payment_date: next.due_date })
          .eq('id', installment.plan.id);
      }
    }

    return NextResponse.json({ success: true, installment });
  } catch (error) {
    console.error('Pay installment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
