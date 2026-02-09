import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

import { requireAuth } from '@/lib/auth/withAuth';import { nanoid } from 'nanoid';

// GET: List gift cards for a clinic
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinic_id');
    const status = searchParams.get('status'); // 'active', 'expired', 'depleted'
    const code = searchParams.get('code');

    const adminClient = createAdminClient();

    // Verify staff access
    const { data: staff } = await adminClient
      .from('clinic_staff')
      .select('clinic_id, role')
      .eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();

    if (!staff) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const targetClinicId = clinicId || staff.clinic_id;

    let query = adminClient
      .from('gift_cards')
      .select(`
        *,
        purchased_by:customers!purchased_by_customer_id(id, full_name, email)
      `)
      .eq('clinic_id', targetClinicId)
      .order('created_at', { ascending: false });

    if (code) {
      query = query.eq('code', code.toUpperCase());
    }

    if (status === 'active') {
      query = query.eq('is_active', true).gt('current_balance', 0);
    } else if (status === 'expired') {
      query = query.lt('valid_until', new Date().toISOString());
    } else if (status === 'depleted') {
      query = query.eq('current_balance', 0);
    }

    const { data: giftCards, error } = await query.limit(100);

    if (error) {
      console.error('Gift cards fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch gift cards' }, { status: 500 });
    }

    return NextResponse.json({ giftCards });
  } catch (error) {
    console.error('Gift cards API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new gift card
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
      type = 'value',
      value,
      serviceId,
      serviceQuantity,
      discountPercentage,
      maxDiscountAmount,
      validDays = 365,
      recipientName,
      recipientEmail,
      recipientPhone,
      personalMessage,
      deliveryMethod = 'email',
      templateId = 'default',
      purchaseAmount
    } = body;

    const adminClient = createAdminClient();

    // Verify staff access
    const { data: staff } = await adminClient
      .from('clinic_staff')
      .select('clinic_id, role')
      .eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();

    if (!staff) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const targetClinicId = clinicId || staff.clinic_id;

    // Generate unique code
    const code = `GC-${nanoid(8).toUpperCase()}`;

    // Calculate validity
    const validFrom = new Date();
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validDays);

    const giftCardData: Record<string, unknown> = {
      clinic_id: targetClinicId,
      code,
      type,
      initial_value: value || 0,
      current_balance: value || 0,
      valid_from: validFrom.toISOString(),
      valid_until: validUntil.toISOString(),
      is_active: true,
      recipient_name: recipientName,
      recipient_email: recipientEmail,
      recipient_phone: recipientPhone,
      personal_message: personalMessage,
      delivery_method: deliveryMethod,
      template_id: templateId,
      purchase_amount: purchaseAmount || value
    };

    if (type === 'service' && serviceId) {
      giftCardData.service_id = serviceId;
      giftCardData.service_quantity = serviceQuantity || 1;
    }

    if (type === 'percentage') {
      giftCardData.discount_percentage = discountPercentage;
      giftCardData.max_discount_amount = maxDiscountAmount;
    }

    const { data: giftCard, error } = await adminClient
      .from('gift_cards')
      .insert(giftCardData)
      .select()
      .single();

    if (error) {
      console.error('Gift card creation error:', error);
      return NextResponse.json({ error: 'Failed to create gift card' }, { status: 500 });
    }

    // Record purchase transaction
    await adminClient
      .from('gift_card_transactions')
      .insert({
        gift_card_id: giftCard.id,
        type: 'purchase',
        amount: value || 0,
        balance_after: value || 0,
        staff_id: user.id,
        notes: 'Initial purchase'
      });

    // Gift card notification sent via notification service
    // if (deliveryMethod === 'email' && recipientEmail) { ... }

    return NextResponse.json({
      success: true,
      giftCard: {
        id: giftCard.id,
        code: giftCard.code,
        type: giftCard.type,
        value: giftCard.initial_value,
        validUntil: giftCard.valid_until
      }
    });
  } catch (error) {
    console.error('Gift card creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
