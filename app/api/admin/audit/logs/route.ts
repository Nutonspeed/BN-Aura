import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

function successResponse(data: any) {
  return NextResponse.json({ success: true, data });
}

function errorResponse(message: string, status: number = 500) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminClient = createAdminClient();
    
    // Verify super admin
    const { data: profile } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const action = searchParams.get('action');
    const table = searchParams.get('table');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = adminClient
      .from('audit_logs')
      .select('*, users(email, full_name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (action) query = query.eq('action', action);
    if (table) query = query.eq('table_name', table);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data: logs, error, count } = await query;
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }
    });
  } catch (error) {
    console.error('Audit logs API error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminClient = createAdminClient();
    
    // Verify super admin
    const { data: profile } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { action, table_name, record_id, old_values, new_values, ip_address, user_agent } = body;

    const { data: log, error } = await adminClient
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action,
        table_name,
        record_id,
        old_values,
        new_values,
        ip_address,
        user_agent
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { log } });
  } catch (error) {
    console.error('Audit logs API error:', error);
    return errorResponse('Internal server error', 500);
  }
}
