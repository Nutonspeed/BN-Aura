/**
 * PromptPay QR Payment API
 * GET  - Get clinic's PromptPay config
 * POST - Create a payment request (generate QR data)
 * PATCH - Confirm payment received (manual)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generatePromptPayPayload, isValidPromptPayTarget } from '@/lib/payments/promptpay';

// GET: Get PromptPay config for clinic
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminClient = createAdminClient();
    const { data: staff } = await adminClient
      .from('clinic_staff')
      .select('clinic_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (!staff) return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });

    // Get clinic's PromptPay settings from metadata
    const { data: clinic } = await adminClient
      .from('clinics')
      .select('id, display_name, metadata')
      .eq('id', staff.clinic_id)
      .single();

    const promptpay = clinic?.metadata?.promptpay || null;

    return NextResponse.json({
      success: true,
      data: {
        configured: !!promptpay?.target,
        target: promptpay?.target || null,
        accountName: promptpay?.accountName || null,
        type: promptpay?.type || null, // 'phone' or 'taxid'
      },
    });
  } catch (error: any) {
    console.error('[PromptPay] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create payment request with QR
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { amount, customerId, description, transactionId } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'จำนวนเงินไม่ถูกต้อง' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { data: staff } = await adminClient
      .from('clinic_staff')
      .select('clinic_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (!staff) return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });

    // Get PromptPay target from clinic settings
    const { data: clinic } = await adminClient
      .from('clinics')
      .select('metadata, display_name')
      .eq('id', staff.clinic_id)
      .single();

    const promptpay = clinic?.metadata?.promptpay;
    if (!promptpay?.target) {
      return NextResponse.json({
        error: 'ยังไม่ได้ตั้งค่าพร้อมเพย์ กรุณาไปที่ ตั้งค่า > การชำระเงิน',
        setupUrl: '/clinic/settings',
      }, { status: 400 });
    }

    // Generate QR payload
    const qrPayload = generatePromptPayPayload({
      target: promptpay.target,
      amount,
    });

    // Create payment record
    const { data: payment, error: insertError } = await adminClient
      .from('payments')
      .insert({
        clinic_id: staff.clinic_id,
        customer_id: customerId || null,
        transaction_id: transactionId || null,
        amount,
        currency: 'THB',
        method: 'promptpay',
        status: 'pending',
        description: description || 'ชำระเงินผ่านพร้อมเพย์',
        metadata: {
          promptpay_target: promptpay.target,
          account_name: promptpay.accountName,
          qr_generated_at: new Date().toISOString(),
        },
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[PromptPay] Insert error:', insertError);
      return NextResponse.json({ error: 'ไม่สามารถสร้างรายการชำระเงินได้' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentId: payment.id,
        qrPayload,
        amount,
        accountName: promptpay.accountName || 'คลินิก',
        status: 'pending',
        expiresIn: 15 * 60, // 15 minutes
        message: `สแกน QR เพื่อชำระ ฿${amount.toLocaleString()} ผ่านพร้อมเพย์`,
      },
    });
  } catch (error: any) {
    console.error('[PromptPay] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Confirm payment received (manual)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { paymentId, action, note } = await request.json();
    if (!paymentId) return NextResponse.json({ error: 'paymentId required' }, { status: 400 });

    const adminClient = createAdminClient();
    const { data: staff } = await adminClient
      .from('clinic_staff')
      .select('clinic_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (!staff) return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });

    // Verify payment belongs to this clinic
    const { data: payment } = await adminClient
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .eq('clinic_id', staff.clinic_id)
      .single();

    if (!payment) return NextResponse.json({ error: 'ไม่พบรายการชำระเงิน' }, { status: 404 });

    if (action === 'confirm') {
      // Mark as paid
      const { data: updated, error } = await adminClient
        .from('payments')
        .update({
          status: 'completed',
          metadata: {
            ...payment.metadata,
            confirmed_by: user.id,
            confirmed_at: new Date().toISOString(),
            confirmation_note: note || null,
          },
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) return NextResponse.json({ error: 'อัปเดตไม่สำเร็จ' }, { status: 500 });

      // If linked to a transaction, update transaction status too
      if (payment.transaction_id) {
        await adminClient
          .from('pos_transactions')
          .update({ payment_status: 'paid' })
          .eq('id', payment.transaction_id);
      }

      return NextResponse.json({
        success: true,
        data: {
          paymentId: updated.id,
          status: 'completed',
          amount: updated.amount,
          confirmedBy: user.id,
          confirmedAt: updated.metadata?.confirmed_at,
        },
        message: `ยืนยันรับชำระ ฿${updated.amount.toLocaleString()} เรียบร้อย`,
      });
    }

    if (action === 'cancel') {
      await adminClient
        .from('payments')
        .update({
          status: 'cancelled',
          metadata: {
            ...payment.metadata,
            cancelled_by: user.id,
            cancelled_at: new Date().toISOString(),
            cancel_reason: note || null,
          },
        })
        .eq('id', paymentId);

      return NextResponse.json({
        success: true,
        message: 'ยกเลิกรายการชำระเงินแล้ว',
      });
    }

    return NextResponse.json({ error: 'action ต้องเป็น confirm หรือ cancel' }, { status: 400 });
  } catch (error: any) {
    console.error('[PromptPay] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
