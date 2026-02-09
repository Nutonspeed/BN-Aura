import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';


import { requireAuth } from '@/lib/auth/withAuth';// GET: List commission payouts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinic_id');
    const staffId = searchParams.get('staff_id');
    const status = searchParams.get('status');

    const adminClient = createAdminClient();

    const { data: staff } = await adminClient
      .from('clinic_staff')
      .select('clinic_id, role')
      .eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();

    const targetClinicId = clinicId || staff?.clinic_id;

    let query = adminClient
      .from('commission_payouts')
      .select('*')
      .order('created_at', { ascending: false });

    if (targetClinicId) {
      query = query.eq('clinic_id', targetClinicId);
    }

    if (staffId) {
      query = query.eq('staff_id', staffId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: payouts, error } = await query;

    if (error) {
      console.error('Payouts fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 });
    }

    return NextResponse.json({ payouts });
  } catch (error) {
    console.error('Payouts API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a payout
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      clinicId,
      staffId,
      periodStart,
      periodEnd,
      commissionRecordIds = [],
      deductions = 0,
      adjustments = 0,
      notes
    } = body;

    if (!staffId || !periodStart || !periodEnd) {
      return NextResponse.json(
        { error: 'staffId, periodStart, and periodEnd are required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Verify admin access
    const { data: staff } = await adminClient
      .from('clinic_staff')
      .select('clinic_id, role')
      .eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();

    if (!staff || !['clinic_owner', 'clinic_admin'].includes(staff.role)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const targetClinicId = clinicId || staff.clinic_id;

    // Calculate total from commission records
    let totalAmount = 0;
    if (commissionRecordIds.length > 0) {
      const { data: records } = await adminClient
        .from('commission_records')
        .select('commission_amount')
        .in('id', commissionRecordIds);

      totalAmount = records?.reduce((sum, r) => sum + (r.commission_amount || 0), 0) || 0;
    } else {
      // Get all pending records for this staff in the period
      const { data: records } = await adminClient
        .from('commission_records')
        .select('id, commission_amount')
        .eq('staff_id', staffId)
        .eq('clinic_id', targetClinicId)
        .eq('status', 'pending')
        .gte('transaction_date', periodStart)
        .lte('transaction_date', periodEnd);

      if (records && records.length > 0) {
        totalAmount = records.reduce((sum, r) => sum + (r.commission_amount || 0), 0);
        commissionRecordIds.push(...records.map(r => r.id));
      }
    }

    const netAmount = totalAmount - deductions + adjustments;

    const { data: payout, error } = await adminClient
      .from('commission_payouts')
      .insert({
        clinic_id: targetClinicId,
        staff_id: staffId,
        period_start: periodStart,
        period_end: periodEnd,
        total_amount: totalAmount,
        deductions,
        adjustments,
        net_amount: netAmount,
        commission_record_ids: commissionRecordIds,
        status: 'pending',
        notes
      })
      .select()
      .single();

    if (error) {
      console.error('Payout creation error:', error);
      return NextResponse.json({ error: 'Failed to create payout' }, { status: 500 });
    }

    // Update commission records status to 'approved'
    if (commissionRecordIds.length > 0) {
      await adminClient
        .from('commission_records')
        .update({ status: 'approved' })
        .in('id', commissionRecordIds);
    }

    return NextResponse.json({
      success: true,
      payout
    });
  } catch (error) {
    console.error('Payout creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Update payout status
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { payoutId, status, paymentMethod, paymentReference } = body;

    if (!payoutId || !status) {
      return NextResponse.json(
        { error: 'payoutId and status are required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    const updateData: Record<string, unknown> = { status };

    if (status === 'approved') {
      updateData.approved_by = user.id;
      updateData.approved_at = new Date().toISOString();
    }

    if (status === 'paid') {
      updateData.paid_at = new Date().toISOString();
      if (paymentMethod) updateData.payment_method = paymentMethod;
      if (paymentReference) updateData.payment_reference = paymentReference;

      // Update related commission records to 'paid'
      const { data: payout } = await adminClient
        .from('commission_payouts')
        .select('commission_record_ids')
        .eq('id', payoutId)
        .single();

      if (payout?.commission_record_ids?.length > 0) {
        await adminClient
          .from('commission_records')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .in('id', payout!.commission_record_ids);
      }
    }

    const { data: updatedPayout, error } = await adminClient
      .from('commission_payouts')
      .update(updateData)
      .eq('id', payoutId)
      .select()
      .single();

    if (error) {
      console.error('Payout update error:', error);
      return NextResponse.json({ error: 'Failed to update payout' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      payout: updatedPayout
    });
  } catch (error) {
    console.error('Payout update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
