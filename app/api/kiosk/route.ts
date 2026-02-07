import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET: Get kiosk settings or queue
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinic_id');
    const branchId = searchParams.get('branch_id');
    const action = searchParams.get('action') || 'settings';

    if (!clinicId) return NextResponse.json({ error: 'clinic_id required' }, { status: 400 });

    const adminClient = createAdminClient();

    if (action === 'queue') {
      // Get today's queue
      const today = new Date().toISOString().split('T')[0];
      const { data: queue } = await adminClient
        .from('kiosk_checkins')
        .select('*, customer:customers(full_name), appointment:appointments(time, service_name)')
        .eq('clinic_id', clinicId)
        .gte('checked_in_at', today)
        .in('status', ['waiting', 'called'])
        .order('queue_number');

      return NextResponse.json({ queue: queue || [] });
    }

    if (action === 'lookup') {
      // Lookup customer by phone and find today's appointments
      const phone = searchParams.get('phone');
      if (!phone) return NextResponse.json({ error: 'phone required for lookup' }, { status: 400 });

      const { data: customer } = await adminClient
        .from('customers')
        .select('id, full_name, phone')
        .eq('clinic_id', clinicId)
        .eq('phone', phone)
        .maybeSingle();

      if (!customer) {
        return NextResponse.json({ customer: null });
      }

      // Find today's appointments for this customer
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: appointments } = await adminClient
        .from('appointments')
        .select('id, time, service_name')
        .eq('customer_id', customer.id)
        .gte('date', today.toISOString().split('T')[0])
        .lt('date', tomorrow.toISOString().split('T')[0])
        .in('status', ['confirmed', 'pending'])
        .order('time');

      return NextResponse.json({
        customer: {
          id: customer.id,
          full_name: customer.full_name,
          phone: customer.phone,
          appointments: appointments || []
        }
      });
    }

    // Get kiosk settings
    let query = adminClient.from('kiosk_settings').select('*').eq('clinic_id', clinicId);
    if (branchId) query = query.eq('branch_id', branchId);

    const { data: settings } = await query.single();

    // Get clinic info
    const { data: clinic } = await adminClient
      .from('clinics')
      .select('display_name')
      .eq('id', clinicId)
      .single();

    return NextResponse.json({ settings, clinic });
  } catch (error) {
    console.error('Kiosk GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Check-in
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clinicId, branchId, kioskId, method, phone, appointmentId, customerId } = body;

    if (!clinicId || !method) {
      return NextResponse.json({ error: 'clinicId and method required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Get next queue number
    const today = new Date().toISOString().split('T')[0];
    const { data: lastCheckin } = await adminClient
      .from('kiosk_checkins')
      .select('queue_number')
      .eq('clinic_id', clinicId)
      .gte('checked_in_at', today)
      .order('queue_number', { ascending: false })
      .limit(1)
      .single();

    const queueNumber = (lastCheckin?.queue_number || 0) + 1;

    // Find customer by phone if provided
    let foundCustomerId = customerId;
    if (!foundCustomerId && phone) {
      const { data: customer } = await adminClient
        .from('customers')
        .select('id')
        .eq('clinic_id', clinicId)
        .eq('phone', phone)
        .single();
      foundCustomerId = customer?.id;
    }

    // Create check-in
    const { data: checkin, error } = await adminClient
      .from('kiosk_checkins')
      .insert({
        clinic_id: clinicId,
        branch_id: branchId,
        kiosk_id: kioskId,
        customer_id: foundCustomerId,
        appointment_id: appointmentId,
        check_in_method: method,
        phone_lookup: phone,
        queue_number: queueNumber,
        status: 'waiting'
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'Failed to check in' }, { status: 500 });

    return NextResponse.json({ 
      success: true, 
      checkin,
      queueNumber,
      message: `คิวของคุณคือ ${queueNumber}`
    });
  } catch (error) {
    console.error('Kiosk check-in error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Update check-in status (call, serve, complete)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { checkinId, status, staffId } = body;

    if (!checkinId || !status) {
      return NextResponse.json({ error: 'checkinId and status required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const updateData: Record<string, unknown> = { status };
    if (status === 'called') updateData.called_at = new Date().toISOString();
    if (status === 'serving') {
      updateData.served_at = new Date().toISOString();
      if (staffId) updateData.staff_id = staffId;
    }

    const { data: checkin, error } = await adminClient
      .from('kiosk_checkins')
      .update(updateData)
      .eq('id', checkinId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });

    // Auto-notify customer when queue is called
    if (status === 'called' && checkin) {
      try {
        const phone = checkin.phone_lookup;
        const clinicData = await adminClient
          .from('clinics')
          .select('display_name')
          .eq('id', checkin.clinic_id)
          .single();
        
        const clinicName = (clinicData.data?.display_name as any)?.th || 'คลินิก';
        const message = [
          clinicName,
          `คิวหมายเลข ${checkin.queue_number} ถูกเรียกแล้ว`,
          `กรุณาเตรียมตัวเข้ารับบริการ`,
        ].join('\n');

        // Fire-and-forget: send notification without blocking response
        fetch(new URL('/api/notifications/queue', request.url).toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'queue_called',
            phone,
            message,
            clinicId: checkin.clinic_id,
            checkinId: checkin.id,
            queueNumber: checkin.queue_number,
          }),
        }).catch(e => console.warn('Queue notification failed:', e));
      } catch (notifyErr) {
        console.warn('Queue notification setup failed:', notifyErr);
      }
    }

    return NextResponse.json({ success: true, checkin });
  } catch (error) {
    console.error('Kiosk update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
