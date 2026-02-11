import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';


export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get staff info
    const { data: staffData, error: staffError } = await supabase
      .from('clinic_staff')
      .select('clinic_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (staffError || !staffData) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      customer_id,
      total_value,
      subtotal,
      discount_amount,
      validity_days,
      notes,
      items
    } = body;

    // Validate required fields
    if (!title || !customer_id || !total_value || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Create proposal
    const { data: proposal, error: proposalError } = await adminClient
      .from('sales_proposals')
      .insert({
        title,
        customer_id,
        clinic_id: staffData.clinic_id,
        created_by: user.id,
        total_value,
        subtotal,
        discount_amount,
        validity_days: validity_days || 7,
        notes: notes || '',
        status: 'draft',
        items,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select(`
        *,
        customer:customer_id (id, full_name, email, phone),
        clinic:clinic_id (id, display_name, phone, address)
      `)
      .single();

    if (proposalError) {
      console.error('Proposal creation error:', proposalError);
      return NextResponse.json(
        { error: 'Failed to create proposal' },
        { status: 500 }
      );
    }

    // Create workflow if not exists
    const { data: existingWorkflow } = await adminClient
      .from('workflows')
      .select('id, metadata')
      .eq('customer_id', customer_id)
      .eq('clinic_id', staffData.clinic_id)
      .single();

    if (!existingWorkflow) {
      const { error: workflowError } = await adminClient
        .from('workflows')
        .insert({
          customer_id,
          clinic_id: staffData.clinic_id,
          current_stage: 'proposal_sent',
          assigned_sales_id: user.id,
          metadata: {
            customer_name: proposal.customer?.full_name,
            proposal_id: proposal.id,
            proposal_title: title
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (workflowError) {
        console.error('Workflow creation error:', workflowError);
      }
    } else {
      // Update existing workflow stage
      await adminClient
        .from('workflows')
        .update({
          current_stage: 'proposal_sent',
          metadata: {
            ...existingWorkflow.metadata,
            proposal_id: proposal.id,
            proposal_title: title
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', existingWorkflow.id);
    }

    return NextResponse.json({
      success: true,
      data: proposal
    });

  } catch (error) {
    console.error('Proposal API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get staff info
    const { data: staffData, error: staffError } = await supabase
      .from('clinic_staff')
      .select('clinic_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (staffError || !staffData) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');
    const status = searchParams.get('status');

    const adminClient = createAdminClient();

    let query = adminClient
      .from('sales_proposals')
      .select(`
        *,
        customer:customer_id (id, full_name, email, phone),
        clinic:clinic_id (id, display_name)
      `)
      .eq('clinic_id', staffData.clinic_id)
      .order('created_at', { ascending: false });

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: proposals, error } = await query;

    if (error) {
      console.error('Proposals fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch proposals' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: proposals || []
    });

  } catch (error) {
    console.error('Proposals API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
