import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';


import { requireAuth } from '@/lib/auth/withAuth';// GET: List custom forms
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const formType = searchParams.get('type');

    const adminClient = createAdminClient();
    const { data: staff } = await adminClient.from('clinic_staff').select('clinic_id').eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();
    if (!staff) return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });

    let query = adminClient
      .from('custom_forms')
      .select('*')
      .eq('clinic_id', staff.clinic_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (formType) query = query.eq('form_type', formType);

    const { data: forms } = await query;

    return NextResponse.json({ forms: forms || [] });
  } catch (error) {
    console.error('Forms API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create custom form
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, description, formType, fields = [], settings = {} } = body;

    if (!name || !formType) {
      return NextResponse.json({ error: 'name and formType required' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { data: staff } = await adminClient.from('clinic_staff').select('clinic_id, role').eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();
    
    if (!staff || !['clinic_owner', 'clinic_admin'].includes(staff.role)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { data: form, error } = await adminClient
      .from('custom_forms')
      .insert({
        clinic_id: staff.clinic_id,
        name,
        description,
        form_type: formType,
        fields,
        settings,
        created_by: user.id,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to create form' }, { status: 500 });
    }

    return NextResponse.json({ success: true, form });
  } catch (error) {
    console.error('Form creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
