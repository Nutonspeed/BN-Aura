import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET: List consent form templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinic_id');
    const treatmentId = searchParams.get('treatment_id');

    if (!clinicId) {
      return NextResponse.json({ error: 'clinic_id is required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    let query = adminClient
      .from('consent_form_templates')
      .select('*')
      .eq('is_active', true)
      .or(`clinic_id.eq.${clinicId},is_system_template.eq.true`)
      .order('created_at', { ascending: false });

    if (treatmentId) {
      query = query.or(`treatment_ids.cs.{${treatmentId}},required_for_all_treatments.eq.true`);
    }

    const { data: templates, error } = await query;

    if (error) {
      console.error('Consent templates fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Consent forms API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a consent form template
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
      content,
      fields = [],
      requiresSignature = true,
      requiresWitness = false,
      requiresPhotoId = false,
      treatmentIds = [],
      requiredForAllTreatments = false
    } = body;

    const adminClient = createAdminClient();

    // Verify admin access
    const { data: staff } = await adminClient
      .from('clinic_staff')
      .select('clinic_id, role')
      .eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();

    if (!staff || !['clinic_owner', 'clinic_admin'].includes(staff.role)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const targetClinicId = clinicId || staff.clinic_id;

    const { data: template, error } = await adminClient
      .from('consent_form_templates')
      .insert({
        clinic_id: targetClinicId,
        name,
        description,
        content,
        fields,
        requires_signature: requiresSignature,
        requires_witness: requiresWitness,
        requires_photo_id: requiresPhotoId,
        treatment_ids: treatmentIds,
        required_for_all_treatments: requiredForAllTreatments,
        is_active: true,
        version: 1
      })
      .select()
      .single();

    if (error) {
      console.error('Consent template creation error:', error);
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      template
    });
  } catch (error) {
    console.error('Consent template creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
