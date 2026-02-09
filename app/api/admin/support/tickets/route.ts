import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { requireSuperAdmin, handleAuthError } from '@/lib/auth/withAuth';

function successResponse(data: any) {
  return NextResponse.json({ success: true, data });
}

function errorResponse(message: string, status: number = 500) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function GET(request: Request) {
  try {
    await requireSuperAdmin();
    // For Super Admin operations, we can use the admin client directly
    // but we still need to verify the user is authenticated and has super_admin role
    const adminClient = createAdminClient();
    
    // Get the authorization header to extract the JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Verify the JWT token and get user info
    const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    // Verify Super Admin Role
    const { data: profile } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Query real support tickets from database
    let query = adminClient
      .from('support_tickets')
      .select('*, clinic:clinics(display_name), reporter:users!support_tickets_user_id_fkey(id, full_name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: tickets, error: ticketsError, count } = await query;

    if (ticketsError) {
      console.error('Support tickets query error:', ticketsError);
      // Fallback: query without joins if foreign key fails
      let fallbackQuery = adminClient
        .from('support_tickets')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status && status !== 'all') {
        fallbackQuery = fallbackQuery.eq('status', status);
      }

      const { data: fallbackTickets, count: fallbackCount } = await fallbackQuery;
      
      // Get stats from all tickets
      const { data: allTickets } = await adminClient.from('support_tickets').select('status, priority');
      const statsData = allTickets || [];

      return successResponse({
        tickets: fallbackTickets || [],
        pagination: {
          page,
          limit,
          total: fallbackCount || 0,
          pages: Math.ceil((fallbackCount || 0) / limit)
        },
        stats: {
          total: statsData.length,
          open: statsData.filter((t: any) => t.status === 'open').length,
          in_progress: statsData.filter((t: any) => t.status === 'in_progress').length,
          resolved: statsData.filter((t: any) => t.status === 'resolved').length,
          high_priority: statsData.filter((t: any) => t.priority === 'high').length
        }
      });
    }

    // Get stats from all tickets (unfiltered)
    const { data: allTickets } = await adminClient.from('support_tickets').select('status, priority');
    const statsData = allTickets || [];

    const stats = {
      total: statsData.length,
      open: statsData.filter((t: any) => t.status === 'open').length,
      in_progress: statsData.filter((t: any) => t.status === 'in_progress').length,
      resolved: statsData.filter((t: any) => t.status === 'resolved').length,
      high_priority: statsData.filter((t: any) => t.priority === 'high').length
    };

    return successResponse({
      tickets: tickets || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      },
      stats
    });

  } catch (error: any) {
    console.error('Support tickets API error:', error);
    return errorResponse(error.message || 'Failed to fetch support tickets');
  }
}

export async function POST(request: Request) {
  try {
    await requireSuperAdmin();
    // For Super Admin operations, we can use the admin client directly
    // but we still need to verify the user is authenticated and has super_admin role
    const adminClient = createAdminClient();
    
    // Get the authorization header to extract the JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Verify the JWT token and get user info
    const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    // Verify Super Admin Role
    const { data: profile } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { action, ticketId, status, assignedTo } = body;

    if (action === 'updateStatus' && ticketId && status) {
      const { error } = await adminClient
        .from('support_tickets')
        .update({ 
          status,
          updated_at: new Date().toISOString(),
          ...(status === 'resolved' && { resolved_at: new Date().toISOString() })
        })
        .eq('id', ticketId);

      if (error) throw error;
      return successResponse({ message: 'Ticket status updated successfully' });
    }

    if (action === 'assignTicket' && ticketId && assignedTo) {
      const { error } = await adminClient
        .from('support_tickets')
        .update({ 
          assigned_to: assignedTo,
          updated_at: new Date().toISOString(),
          first_response_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) throw error;
      return successResponse({ message: 'Ticket assigned successfully' });
    }

    return NextResponse.json({ error: 'Invalid action or missing fields' }, { status: 400 });

  } catch (error: any) {
    console.error('Support tickets POST API error:', error);
    return errorResponse(error.message || 'Failed to process support ticket');
  }
}
