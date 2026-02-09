import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSuperAdmin, handleAuthError } from '@/lib/auth/withAuth';

function successResponse(data: any) {
  return NextResponse.json({ success: true, data });
}

function errorResponse(message: string, status: number = 500) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// GET - Get billing records
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin();
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();
    
    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    // Check if user is super_admin
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'super_admin') {
      return errorResponse('Access denied', 403);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const clinicId = searchParams.get('clinic_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get billing records
    let query = supabaseAdmin
      .from('billing_records')
      .select(`
        *,
        clinics!billing_records_clinic_id_fkey (
          id,
          display_name
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    if (clinicId) {
      query = query.eq('clinic_id', clinicId);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: records, error, count } = await query;

    if (error) {
      throw error;
    }

    // Calculate billing statistics
    const { data: stats } = await supabaseAdmin
      .from('billing_records')
      .select('status, amount')
      .eq('status', 'paid');

    const totalRevenue = stats?.reduce((sum: number, record: any) => sum + parseFloat(record.amount), 0) || 0;
    const mrr = stats?.reduce((sum: number, record: any) => {
      // Assume monthly billing for simplicity
      return sum + parseFloat(record.amount);
    }, 0) || 0;

    return successResponse({
      records,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      },
      stats: {
        totalRevenue,
        mrr,
        paidCount: stats?.length || 0
      }
    });

  } catch (error) {
    console.error('Error fetching billing records:', error);
    return errorResponse('Failed to fetch billing records', 500);
  }
}

// POST - Create new billing record
export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin();
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();
    const body = await request.json();

    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    // Check if user is super_admin
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'super_admin') {
      return errorResponse('Access denied', 403);
    }

    // Validate required fields
    if (!body.clinic_id || !body.subscription_tier || !body.amount || !body.billing_period_start || !body.billing_period_end) {
      return errorResponse('Missing required fields', 400);
    }

    // Create billing record
    const { data: record, error } = await supabaseAdmin
      .from('billing_records')
      .insert({
        clinic_id: body.clinic_id,
        subscription_tier: body.subscription_tier,
        amount: body.amount,
        currency: body.currency || 'THB',
        status: body.status || 'pending',
        billing_period_start: body.billing_period_start,
        billing_period_end: body.billing_period_end,
        invoice_url: body.invoice_url || null
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return successResponse(record);

  } catch (error) {
    console.error('Error creating billing record:', error);
    return errorResponse('Failed to create billing record', 500);
  }
}

// PATCH - Update billing record
export async function PATCH(request: NextRequest) {
  try {
    await requireSuperAdmin();
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const recordId = searchParams.get('id');

    if (!recordId) {
      return errorResponse('Record ID is required', 400);
    }

    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    // Check if user is super_admin
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'super_admin') {
      return errorResponse('Access denied', 403);
    }

    // Update billing record
    const updateData: any = {};
    
    if (body.status) {
      updateData.status = body.status;
      if (body.status === 'paid') {
        updateData.paid_at = new Date().toISOString();
      }
    }
    
    if (body.invoice_url) {
      updateData.invoice_url = body.invoice_url;
    }

    const { data: record, error } = await supabaseAdmin
      .from('billing_records')
      .update(updateData)
      .eq('id', recordId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return successResponse(record);

  } catch (error) {
    console.error('Error updating billing record:', error);
    return errorResponse('Failed to update billing record', 500);
  }
}
