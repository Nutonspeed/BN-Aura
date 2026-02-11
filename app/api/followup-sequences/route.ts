import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';


// GET: List follow-up sequences
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinic_id');
    const triggerType = searchParams.get('trigger_type');

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
      .from('followup_sequences')
      .select(`
        *,
        steps:followup_sequence_steps(*)
      `)
      .eq('clinic_id', targetClinicId)
      .order('created_at', { ascending: false });

    if (triggerType) {
      query = query.eq('trigger_type', triggerType);
    }

    const { data: sequences, error } = await query;

    if (error) {
      console.error('Sequences fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch sequences' }, { status: 500 });
    }

    return NextResponse.json({ sequences });
  } catch (error) {
    console.error('Sequences API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a follow-up sequence
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
      name,
      description,
      triggerType,
      triggerConditions = {},
      steps = [],
      isActive = true
    } = body;

    if (!name || !triggerType) {
      return NextResponse.json(
        { error: 'name and triggerType are required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Get staff's clinic if not provided
    let targetClinicId = clinicId;
    if (!targetClinicId) {
      const { data: staff } = await adminClient
        .from('clinic_staff')
        .select('clinic_id, role')
        .eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();

      if (!staff || !['clinic_owner', 'clinic_admin'].includes(staff.role)) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }
      targetClinicId = staff.clinic_id;
    }

    // Create sequence
    const { data: sequence, error: seqError } = await adminClient
      .from('followup_sequences')
      .insert({
        clinic_id: targetClinicId,
        name,
        description,
        trigger_type: triggerType,
        trigger_conditions: triggerConditions,
        is_active: isActive
      })
      .select()
      .single();

    if (seqError) {
      console.error('Sequence creation error:', seqError);
      return NextResponse.json({ error: 'Failed to create sequence' }, { status: 500 });
    }

    // Create steps
    if (steps.length > 0) {
      const stepsToInsert = steps.map((step: Record<string, unknown>, index: number) => ({
        sequence_id: sequence.id,
        step_order: index + 1,
        delay_days: step.delayDays || 0,
        delay_hours: step.delayHours || 0,
        channel: step.channel || 'email',
        template_id: step.templateId,
        custom_content: step.customContent,
        conditions: step.conditions || {},
        is_active: step.isActive !== false
      }));

      await adminClient
        .from('followup_sequence_steps')
        .insert(stepsToInsert);
    }

    // Fetch complete sequence with steps
    const { data: completeSequence } = await adminClient
      .from('followup_sequences')
      .select(`*, steps:followup_sequence_steps(*)`)
      .eq('id', sequence.id)
      .single();

    return NextResponse.json({
      success: true,
      sequence: completeSequence
    });
  } catch (error) {
    console.error('Sequence creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
