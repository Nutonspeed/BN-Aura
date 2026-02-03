import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

function successResponse(data: any) {
  return NextResponse.json({ success: true, data });
}

function errorResponse(message: string, status: number = 500) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function GET(request: Request) {
  try {
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

    // Mock data for support tickets (since table doesn't exist yet)
    const mockTickets = [
      {
        id: '1',
        subject: 'Login issue with Super Admin account',
        description: 'Cannot login to Super Admin dashboard after recent update',
        priority: 'high',
        status: 'open',
        category: 'technical',
        clinic_id: '00000000-0000-0000-0000-000000000001',
        user_id: 'b07c41f2-8171-4d2f-a4de-12c24cfe8cff',
        assigned_to: null,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        clinic_name: 'บางกอก พรีเมียม คลินิก',
        user: {
          id: 'b07c41f2-8171-4d2f-a4de-12c24cfe8cff',
          full_name: 'Nuttapong - System Administrator',
          email: 'nuttapong161@gmail.com'
        }
      },
      {
        id: '2',
        subject: 'Feature request: Customer data export',
        description: 'Need ability to export customer data for reporting',
        priority: 'medium',
        status: 'in_progress',
        category: 'feature_request',
        clinic_id: '00000000-0000-0000-0000-000000000001',
        user_id: 'b07c41f2-8171-4d2f-a4de-12c24cfe8cff',
        assigned_to: 'b07c41f2-8171-4d2f-a4de-12c24cfe8cff',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        clinic_name: 'บางกอก พรีเมียม คลินิก',
        user: {
          id: 'b07c41f2-8171-4d2f-a4de-12c24cfe8cff',
          full_name: 'Nuttapong - System Administrator',
          email: 'nuttapong161@gmail.com'
        }
      },
      {
        id: '3',
        subject: 'Billing question about subscription',
        description: 'Question about pricing for premium subscription tier',
        priority: 'low',
        status: 'resolved',
        category: 'billing',
        clinic_id: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab',
        user_id: 'b07c41f2-8171-4d2f-a4de-12c24cfe8cff',
        assigned_to: 'b07c41f2-8171-4d2f-a4de-12c24cfe8cff',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        clinic_name: 'คลินิกความงามกรุงเทพ',
        user: {
          id: 'b07c41f2-8171-4d2f-a4de-12c24cfe8cff',
          full_name: 'Nuttapong - System Administrator',
          email: 'nuttapong161@gmail.com'
        }
      }
    ];

    // Filter by status if specified
    let filteredTickets = mockTickets;
    if (status && status !== 'all') {
      filteredTickets = mockTickets.filter(ticket => ticket.status === status);
    }

    // Mock stats
    const stats = {
      total: mockTickets.length,
      open: mockTickets.filter(t => t.status === 'open').length,
      in_progress: mockTickets.filter(t => t.status === 'in_progress').length,
      resolved: mockTickets.filter(t => t.status === 'resolved').length,
      high_priority: mockTickets.filter(t => t.priority === 'high').length
    };

    return successResponse({
      tickets: filteredTickets,
      pagination: {
        page,
        limit,
        total: filteredTickets.length,
        pages: Math.ceil(filteredTickets.length / limit)
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
