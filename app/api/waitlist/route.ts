import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';


import { requireAuth } from '@/lib/auth/withAuth';// GET: List waitlist entries
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinic_id');
    const status = searchParams.get('status');
    const serviceId = searchParams.get('service_id');

    const adminClient = createAdminClient();

    // Get staff's clinic
    const { data: staff } = await adminClient
      .from('clinic_staff')
      .select('clinic_id')
      .eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();

    const targetClinicId = clinicId || staff?.clinic_id;

    if (!targetClinicId) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    let query = adminClient
      .from('waitlist_entries')
      .select(`
        *,
        customer:customers(id, full_name, phone, email),
        service:bookable_services(id, name, duration_minutes),
        preferred_staff:auth.users(id, email)
      `)
      .eq('clinic_id', targetClinicId)
      .order('priority', { ascending: true })
      .order('created_at', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    } else {
      query = query.in('status', ['waiting', 'notified']);
    }

    if (serviceId) {
      query = query.eq('service_id', serviceId);
    }

    const { data: entries, error } = await query;

    if (error) {
      console.error('Waitlist fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch waitlist' }, { status: 500 });
    }

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Waitlist API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Add to waitlist
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clinicId,
      branchId,
      customerId,
      customerName,
      customerPhone,
      customerEmail,
      serviceId,
      preferredStaffId,
      preferredDates = [],
      preferredTimeRange = { start: '09:00', end: '18:00' },
      flexibleDates = true,
      priority = 5,
      notes,
      notificationPreferences = { sms: true, email: true, line: false }
    } = body;

    if (!clinicId) {
      return NextResponse.json({ error: 'clinicId is required' }, { status: 400 });
    }

    if (!customerId && !customerPhone) {
      return NextResponse.json(
        { error: 'Either customerId or customerPhone is required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    const { data: entry, error } = await adminClient
      .from('waitlist_entries')
      .insert({
        clinic_id: clinicId,
        branch_id: branchId,
        customer_id: customerId,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        service_id: serviceId,
        preferred_staff_id: preferredStaffId,
        preferred_dates: preferredDates,
        preferred_time_range: preferredTimeRange,
        flexible_dates: flexibleDates,
        priority,
        notes,
        notification_preferences: notificationPreferences,
        status: 'waiting'
      })
      .select()
      .single();

    if (error) {
      console.error('Waitlist creation error:', error);
      return NextResponse.json({ error: 'Failed to add to waitlist' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      entry
    });
  } catch (error) {
    console.error('Waitlist creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Update waitlist entry status
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { entryId, status, appointmentId, notes } = body;

    if (!entryId || !status) {
      return NextResponse.json(
        { error: 'entryId and status are required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'converted' && appointmentId) {
      updateData.converted_appointment_id = appointmentId;
      updateData.converted_at = new Date().toISOString();
    }

    if (status === 'expired') {
      updateData.expired_at = new Date().toISOString();
    }

    if (notes) {
      updateData.notes = notes;
    }

    const { data: entry, error } = await adminClient
      .from('waitlist_entries')
      .update(updateData)
      .eq('id', entryId)
      .select()
      .single();

    if (error) {
      console.error('Waitlist update error:', error);
      return NextResponse.json({ error: 'Failed to update waitlist' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      entry
    });
  } catch (error) {
    console.error('Waitlist update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
