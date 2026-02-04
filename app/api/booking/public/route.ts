import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: Fetch public booking data for a clinic
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinic_id');
    const token = searchParams.get('token');

    if (!clinicId) {
      return NextResponse.json({ error: 'clinic_id is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify token if provided
    if (token) {
      const { data: tokenData } = await supabase
        .from('booking_tokens')
        .select('*')
        .eq('token', token)
        .eq('clinic_id', clinicId)
        .eq('is_active', true)
        .single();

      if (!tokenData) {
        return NextResponse.json({ error: 'Invalid booking token' }, { status: 401 });
      }
    }

    // Fetch booking settings
    const { data: settings } = await supabase
      .from('booking_settings')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('widget_enabled', true)
      .single();

    if (!settings) {
      return NextResponse.json({ error: 'Booking not available for this clinic' }, { status: 404 });
    }

    // Fetch bookable services
    const { data: services } = await supabase
      .from('bookable_services')
      .select(`
        id,
        name,
        description,
        duration_minutes,
        price,
        deposit_required,
        category,
        image_url,
        sort_order
      `)
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .eq('online_booking_enabled', true)
      .order('sort_order', { ascending: true });

    // Fetch clinic info
    const { data: clinic } = await supabase
      .from('clinics')
      .select('id, display_name, clinic_code')
      .eq('id', clinicId)
      .single();

    return NextResponse.json({
      clinic,
      settings: {
        minAdvanceHours: settings.min_advance_hours,
        maxAdvanceDays: settings.max_advance_days,
        slotDuration: settings.slot_duration_minutes,
        workingHours: settings.working_hours,
        requireDeposit: settings.require_deposit,
        depositAmount: settings.deposit_amount,
        depositPercentage: settings.deposit_percentage,
        cancellationHours: settings.cancellation_hours,
        theme: settings.widget_theme
      },
      services: services || []
    });
  } catch (error) {
    console.error('Public booking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
