import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// POST: Create a new booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clinicId,
      serviceId,
      date,
      time,
      staffId,
      customerInfo,
      notes,
      giftCardCode,
      packageId
    } = body;

    // Validate required fields
    if (!clinicId || !serviceId || !date || !time || !customerInfo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!customerInfo.name || !customerInfo.phone) {
      return NextResponse.json(
        { error: 'Customer name and phone are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Fetch booking settings
    const { data: settings } = await adminClient
      .from('booking_settings')
      .select('*')
      .eq('clinic_id', clinicId)
      .single();

    if (!settings || !settings.widget_enabled) {
      return NextResponse.json(
        { error: 'Online booking is not available' },
        { status: 400 }
      );
    }

    // Fetch service details
    const { data: service } = await adminClient
      .from('bookable_services')
      .select('*')
      .eq('id', serviceId)
      .eq('is_active', true)
      .single();

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Calculate times
    const startTime = new Date(`${date}T${time}:00`);
    const endTime = new Date(startTime.getTime() + service.duration_minutes * 60000);

    // Validate booking time
    const now = new Date();
    const minAdvanceMs = settings.min_advance_hours * 60 * 60 * 1000;
    if (startTime.getTime() - now.getTime() < minAdvanceMs) {
      return NextResponse.json(
        { error: `Bookings must be made at least ${settings.min_advance_hours} hours in advance` },
        { status: 400 }
      );
    }

    const maxAdvanceMs = settings.max_advance_days * 24 * 60 * 60 * 1000;
    if (startTime.getTime() - now.getTime() > maxAdvanceMs) {
      return NextResponse.json(
        { error: `Bookings can only be made up to ${settings.max_advance_days} days in advance` },
        { status: 400 }
      );
    }

    // Check for conflicts
    const { data: conflicts } = await adminClient
      .from('appointments')
      .select('id')
      .eq('clinic_id', clinicId)
      .neq('status', 'cancelled')
      .lt('start_time', endTime.toISOString())
      .gt('end_time', startTime.toISOString());

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json(
        { error: 'This time slot is no longer available' },
        { status: 409 }
      );
    }

    // Find or create customer
    let customerId: string;

    const { data: existingCustomer } = await adminClient
      .from('customers')
      .select('id')
      .eq('clinic_id', clinicId)
      .eq('phone', customerInfo.phone)
      .single();

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const { data: newCustomer, error: customerError } = await adminClient
        .from('customers')
        .insert({
          clinic_id: clinicId,
          full_name: customerInfo.name,
          email: customerInfo.email || null,
          phone: customerInfo.phone,
          source: 'online_booking'
        })
        .select('id')
        .single();

      if (customerError) {
        console.error('Customer creation error:', customerError);
        return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
      }

      customerId = newCustomer.id;
    }

    // Calculate deposit
    let depositAmount = 0;
    if (settings.require_deposit) {
      if (settings.deposit_percentage > 0) {
        depositAmount = (service.price * settings.deposit_percentage) / 100;
      } else if (settings.deposit_amount > 0) {
        depositAmount = settings.deposit_amount;
      }
      depositAmount = Math.min(depositAmount, service.deposit_required || depositAmount);
    }

    // Apply gift card if provided
    let giftCardDiscount = 0;
    if (giftCardCode) {
      const { data: giftCard } = await adminClient
        .from('gift_cards')
        .select('*')
        .eq('code', giftCardCode)
        .eq('clinic_id', clinicId)
        .eq('is_active', true)
        .single();

      if (giftCard && giftCard.current_balance > 0) {
        if (giftCard.type === 'value') {
          giftCardDiscount = Math.min(giftCard.current_balance, service.price);
        } else if (giftCard.type === 'percentage') {
          giftCardDiscount = Math.min(
            (service.price * (giftCard.discount_percentage || 0)) / 100,
            giftCard.max_discount_amount || service.price
          );
        }
      }
    }

    // Check package usage
    let usePackage = false;
    if (packageId) {
      const { data: customerPackage } = await adminClient
        .from('customer_packages')
        .select('*, service_packages(*)')
        .eq('id', packageId)
        .eq('customer_id', customerId)
        .eq('status', 'active')
        .single();

      if (customerPackage && customerPackage.sessions_remaining > 0) {
        usePackage = true;
      }
    }

    // Create appointment
    const { data: appointment, error: appointmentError } = await adminClient
      .from('appointments')
      .insert({
        clinic_id: clinicId,
        customer_id: customerId,
        staff_id: staffId || null,
        treatment_id: service.treatment_id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: depositAmount > 0 ? 'pending_payment' : 'confirmed',
        notes: notes || null,
        source: 'online_booking',
        metadata: {
          service_id: serviceId,
          service_name: service.name,
          price: service.price,
          deposit_required: depositAmount,
          gift_card_code: giftCardCode || null,
          gift_card_discount: giftCardDiscount,
          package_id: usePackage ? packageId : null
        }
      })
      .select('*')
      .single();

    if (appointmentError) {
      console.error('Appointment creation error:', appointmentError);
      return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 });
    }

    // Deduct from package if used
    if (usePackage && packageId) {
      await adminClient.rpc('deduct_package_session', {
        p_package_id: packageId,
        p_service_id: serviceId,
        p_appointment_id: appointment.id
      });
    }

    // Apply gift card transaction if used
    if (giftCardCode && giftCardDiscount > 0) {
      const { data: giftCard } = await adminClient
        .from('gift_cards')
        .select('id, current_balance')
        .eq('code', giftCardCode)
        .single();

      if (giftCard) {
        const newBalance = giftCard.current_balance - giftCardDiscount;
        
        await adminClient
          .from('gift_cards')
          .update({ current_balance: newBalance })
          .eq('id', giftCard.id);

        await adminClient
          .from('gift_card_transactions')
          .insert({
            gift_card_id: giftCard.id,
            type: 'redemption',
            amount: -giftCardDiscount,
            balance_after: newBalance,
            customer_id: customerId,
            notes: `Used for appointment ${appointment.id}`
          });
      }
    }

    // TODO: Send confirmation email/SMS
    // if (settings.send_confirmation_email && customerInfo.email) { ... }
    // if (settings.send_reminder_sms && customerInfo.phone) { ... }

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        date,
        time,
        serviceName: service.name,
        duration: service.duration_minutes,
        price: service.price,
        depositRequired: depositAmount,
        giftCardDiscount,
        status: appointment.status
      },
      message: depositAmount > 0
        ? 'Booking created. Please complete payment to confirm.'
        : 'Booking confirmed successfully!'
    });
  } catch (error) {
    console.error('Booking creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
