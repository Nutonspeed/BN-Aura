import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

function successResponse(data: any) {
  return NextResponse.json({ success: true, data });
}

function errorResponse(message: string, status: number = 500) {
  return NextResponse.json({ success: false, error: message }, { status });
}

async function getSupportTickets(adminClient: any, filters: any = {}) {
  try {
    // Get tickets with user info and comments
    let query = adminClient
      .from('support_tickets')
      .select(`
        *,
        users!support_tickets_user_id_fkey (
          id,
          full_name,
          email,
          role
        ),
        assigned_to_user:users!support_tickets_assigned_to_fkey (
          id,
          full_name,
          email
        ),
        clinics!support_tickets_clinic_id_fkey (
          id,
          display_name
        ),
        support_ticket_comments (
          id,
          content,
          is_internal,
          created_at,
          users!support_ticket_comments_user_id_fkey (
            id,
            full_name,
            email,
            role
          )
        )
      `, { count: 'exact' });

    // Apply filters
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    
    if (filters.priority && filters.priority !== 'all') {
      query = query.eq('priority', filters.priority);
    }
    
    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }
    
    if (filters.search) {
      query = query.or(`subject.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    
    if (filters.clinic_id) {
      query = query.eq('clinic_id', filters.clinic_id);
    }

    // Order by created_at descending
    query = query.order('created_at', { ascending: false });

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;
    
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // Transform data to match expected format
    const transformedTickets = data?.map((ticket: any) => {
      let clinicName = 'Unknown Clinic';
      if (ticket.clinics?.display_name) {
        if (typeof ticket.clinics.display_name === 'string') {
          clinicName = ticket.clinics.display_name;
        } else if (ticket.clinics.display_name.th) {
          clinicName = ticket.clinics.display_name.th;
        } else if (ticket.clinics.display_name.en) {
          clinicName = ticket.clinics.display_name.en;
        }
      }
      
      return {
        ...ticket,
        clinic_name: clinicName,
        user_info: {
          name: ticket.users?.full_name || 'Unknown',
          email: ticket.users?.email || 'Unknown',
          role: ticket.users?.role || 'Unknown'
        },
        assigned_to_info: ticket.assigned_to_user ? {
          name: ticket.assigned_to_user.full_name || 'Unassigned',
          email: ticket.assigned_to_user.email || 'No email'
        } : null,
        comments: ticket.support_ticket_comments || []
      };
    }) || [];

    return {
      tickets: transformedTickets,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    };
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const adminClient = await createAdminClient();
    const authClient = await createClient();
    
    // Verify user is super admin
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return errorResponse('Unauthorized', 401);
    }

    const { data: userData } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'super_admin') {
      return errorResponse('Forbidden: Super admin access required', 403);
    }

    const { searchParams } = new URL(request.url);
    
    // Build filters from query params
    const filters: any = {};
    
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status');
    }
    
    if (searchParams.get('priority')) {
      filters.priority = searchParams.get('priority');
    }
    
    if (searchParams.get('category')) {
      filters.category = searchParams.get('category');
    }
    
    if (searchParams.get('search')) {
      filters.search = searchParams.get('search');
    }
    
    if (searchParams.get('clinic_id')) {
      filters.clinic_id = searchParams.get('clinic_id');
    }
    
    if (searchParams.get('page')) {
      filters.page = parseInt(searchParams.get('page')!);
    }
    
    if (searchParams.get('limit')) {
      filters.limit = parseInt(searchParams.get('limit')!);
    }

    const ticketsData = await getSupportTickets(adminClient, filters);
    return successResponse(ticketsData);
  } catch (error) {
    console.error('Support tickets API error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminClient = await createAdminClient();
    const authClient = await createClient();
    
    // Verify user is super admin
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return errorResponse('Unauthorized', 401);
    }

    const { data: userData } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'super_admin') {
      return errorResponse('Forbidden: Super admin access required', 403);
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.description) {
      return errorResponse('Title and description are required', 400);
    }

    // Create new ticket
    const { data: ticket, error } = await adminClient
      .from('support_tickets')
      .insert({
        title: body.title,
        description: body.description,
        category: body.category || 'general',
        priority: body.priority || 'medium',
        status: body.status || 'open',
        clinic_id: body.clinic_id || null,
        user_id: body.user_id || null,
        assigned_to: body.assigned_to || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating ticket:', error);
      return errorResponse('Failed to create ticket', 500);
    }

    return successResponse(ticket);
  } catch (error) {
    console.error('Support tickets POST error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const adminClient = await createAdminClient();
    const authClient = await createClient();
    
    // Verify user is super admin
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return errorResponse('Unauthorized', 401);
    }

    const { data: userData } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'super_admin') {
      return errorResponse('Forbidden: Super admin access required', 403);
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get('id');

    if (!ticketId) {
      return errorResponse('Ticket ID is required', 400);
    }

    // Update ticket
    const { data: ticket, error } = await adminClient
      .from('support_tickets')
      .update({
        status: body.status,
        priority: body.priority,
        assigned_to: body.assigned_to,
        updated_at: new Date().toISOString(),
        ...(body.status === 'resolved' && { resolved_at: new Date().toISOString() })
      })
      .eq('id', ticketId)
      .select()
      .single();

    if (error) {
      console.error('Error updating ticket:', error);
      return errorResponse('Failed to update ticket', 500);
    }

    return successResponse(ticket);
  } catch (error) {
    console.error('Support tickets PATCH error:', error);
    return errorResponse('Internal server error', 500);
  }
}
