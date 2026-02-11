/**
 * Clinic PromptPay Settings API
 * GET  - Get current PromptPay config
 * PUT  - Update PromptPay config (target number + account name)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isValidPromptPayTarget } from '@/lib/payments/promptpay';

// GET: Current config
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminClient = createAdminClient();
    const { data: staff } = await adminClient
      .from('clinic_staff')
      .select('clinic_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (!staff) return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });

    const { data: clinic } = await adminClient
      .from('clinics')
      .select('metadata')
      .eq('id', staff.clinic_id)
      .single();

    const pp = clinic?.metadata?.promptpay || {};

    return NextResponse.json({
      success: true,
      data: {
        target: pp.target || null,
        accountName: pp.accountName || null,
        type: pp.type || null,
        configured: !!pp.target,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Update config
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { target, accountName } = await request.json();

    if (!target) {
      return NextResponse.json({ error: 'กรุณาระบุเบอร์โทรหรือเลขประจำตัวผู้เสียภาษี' }, { status: 400 });
    }

    if (!isValidPromptPayTarget(target)) {
      return NextResponse.json({ error: 'เบอร์โทร (9-10 หลัก) หรือ Tax ID (13 หลัก) ไม่ถูกต้อง' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { data: staff } = await adminClient
      .from('clinic_staff')
      .select('clinic_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (!staff || !['clinic_owner', 'clinic_admin'].includes(staff.role)) {
      return NextResponse.json({ error: 'เฉพาะเจ้าของคลินิกเท่านั้น' }, { status: 403 });
    }

    // Get current metadata
    const { data: clinic } = await adminClient
      .from('clinics')
      .select('metadata')
      .eq('id', staff.clinic_id)
      .single();

    const cleaned = target.replace(/[^0-9]/g, '');
    const type = cleaned.length <= 10 ? 'phone' : 'taxid';

    const updatedMetadata = {
      ...(clinic?.metadata || {}),
      promptpay: {
        target: cleaned,
        accountName: accountName || null,
        type,
        updatedAt: new Date().toISOString(),
        updatedBy: user.id,
      },
    };

    const { error } = await adminClient
      .from('clinics')
      .update({ metadata: updatedMetadata })
      .eq('id', staff.clinic_id);

    if (error) {
      return NextResponse.json({ error: 'บันทึกไม่สำเร็จ' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: { target: cleaned, accountName, type },
      message: 'บันทึกการตั้งค่าพร้อมเพย์เรียบร้อย',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
