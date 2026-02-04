import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// POST: Validate a gift card code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, clinicId } = body;

    if (!code || !clinicId) {
      return NextResponse.json(
        { error: 'code and clinicId are required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    const { data: giftCard, error } = await adminClient
      .from('gift_cards')
      .select(`
        id,
        code,
        type,
        initial_value,
        current_balance,
        service_id,
        service_quantity,
        discount_percentage,
        max_discount_amount,
        valid_from,
        valid_until,
        is_active,
        bookable_services:service_id(name)
      `)
      .eq('code', code.toUpperCase())
      .eq('clinic_id', clinicId)
      .single();

    if (error || !giftCard) {
      return NextResponse.json(
        { valid: false, error: 'Gift card not found' },
        { status: 404 }
      );
    }

    // Check if active
    if (!giftCard.is_active) {
      return NextResponse.json({
        valid: false,
        error: 'This gift card has been deactivated'
      });
    }

    // Check validity dates
    const now = new Date();
    if (giftCard.valid_from && new Date(giftCard.valid_from) > now) {
      return NextResponse.json({
        valid: false,
        error: 'This gift card is not yet valid'
      });
    }

    if (giftCard.valid_until && new Date(giftCard.valid_until) < now) {
      return NextResponse.json({
        valid: false,
        error: 'This gift card has expired'
      });
    }

    // Check balance for value-type cards
    if (giftCard.type === 'value' && giftCard.current_balance <= 0) {
      return NextResponse.json({
        valid: false,
        error: 'This gift card has no remaining balance'
      });
    }

    return NextResponse.json({
      valid: true,
      giftCard: {
        id: giftCard.id,
        code: giftCard.code,
        type: giftCard.type,
        balance: giftCard.current_balance,
        discountPercentage: giftCard.discount_percentage,
        maxDiscount: giftCard.max_discount_amount,
        serviceName: Array.isArray(giftCard.bookable_services) 
          ? giftCard.bookable_services[0]?.name 
          : (giftCard.bookable_services as { name?: string } | null)?.name,
        validUntil: giftCard.valid_until
      }
    });
  } catch (error) {
    console.error('Gift card validation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
