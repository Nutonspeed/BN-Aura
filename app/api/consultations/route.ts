import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import crypto from 'crypto';

// GET: List consultations
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const customerId = searchParams.get('customer_id');

    const adminClient = createAdminClient();
    const { data: staff } = await adminClient.from('clinic_staff').select('clinic_id').eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();
    if (!staff) return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });

    let query = adminClient
      .from('virtual_consultations')
      .select('*, customer:customers(full_name, phone, email)')
      .eq('clinic_id', staff.clinic_id)
      .order('scheduled_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (customerId) query = query.eq('customer_id', customerId);

    const { data: consultations } = await query.limit(50);

    return NextResponse.json({ consultations: consultations || [] });
  } catch (error) {
    console.error('Consultations API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create consultation room
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { customerId, scheduledAt, appointmentId, notes } = body;

    if (!customerId || !scheduledAt) {
      return NextResponse.json({ error: 'customerId and scheduledAt required' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { data: staff } = await adminClient.from('clinic_staff').select('clinic_id').eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();
    if (!staff) return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });

    // Generate unique room ID
    const roomId = `vc-${crypto.randomBytes(8).toString('hex')}`;
    const roomUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://bn-aura.vercel.app'}/consultation/${roomId}`;

    const { data: consultation, error } = await adminClient
      .from('virtual_consultations')
      .insert({
        clinic_id: staff.clinic_id,
        customer_id: customerId,
        staff_id: user.id,
        appointment_id: appointmentId,
        room_id: roomId,
        room_url: roomUrl,
        scheduled_at: scheduledAt,
        status: 'scheduled',
        notes
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'Failed to create consultation' }, { status: 500 });

    return NextResponse.json({ success: true, consultation });
  } catch (error) {
    console.error('Create consultation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Update consultation status
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { consultationId, status, notes, summary } = body;

    if (!consultationId) {
      return NextResponse.json({ error: 'consultationId required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const updateData: Record<string, unknown> = {};
    if (status) {
      updateData.status = status;
      if (status === 'in_progress') updateData.started_at = new Date().toISOString();
      if (status === 'completed') updateData.ended_at = new Date().toISOString();
    }
    if (notes) updateData.notes = notes;
    if (summary) updateData.summary = summary;

    const { data: consultation, error } = await adminClient
      .from('virtual_consultations')
      .update(updateData)
      .eq('id', consultationId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'Failed to update consultation' }, { status: 500 });

    return NextResponse.json({ success: true, consultation });
  } catch (error) {
    console.error('Update consultation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
