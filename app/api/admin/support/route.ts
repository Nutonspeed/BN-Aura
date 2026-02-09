import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin, handleAuthError } from '@/lib/auth/withAuth';

function successResponse(data: any) {
  return NextResponse.json({ success: true, data });
}

function errorResponse(message: string, status: number = 500) {
  return NextResponse.json({ success: false, error: message }, { status });
}

async function getSupportTickets(adminClient: any, filters: any = {}) {
  try {
    let query = adminClient
      .from('support_tickets')
      .select(`
        *,
        clinics!support_tickets_clinic_id_fkey (
          id,
          display_name
        ),
        users!support_tickets_user_id_fkey (
          id,
          full_name,
          email
        ),
        assigned_to_user:users!support_tickets_assigned_to_fkey (
          id,
          full_name,
          email
        ),
        ticket_replies (
          id,
          message,
          is_internal,
          created_at,
          users!ticket_replies_user_id_fkey (
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
    const transformedTickets = data?.map((ticket: any) => ({
      ...ticket,
      replies: ticket.ticket_replies || []
    })) || [];

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

async function getSupportStats(adminClient: any, filters: any = {}) {
  try {
    // Get ticket counts by status
    const { data: statusCounts } = await adminClient
      .from('support_tickets')
      .select('status')
      .neq('status', 'deleted');

    const stats = {
      total: statusCounts?.length || 0,
      open: statusCounts?.filter((t: any) => t.status === 'open').length || 0,
      in_progress: statusCounts?.filter((t: any) => t.status === 'in_progress').length || 0,
      resolved: statusCounts?.filter((t: any) => t.status === 'resolved').length || 0,
      high_priority: 0,
      avg_response_time: 0,
      avg_resolution_time: 0
    };

    // Get high priority count
    const { count: highPriorityCount } = await adminClient
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .in('priority', ['high', 'urgent'])
      .neq('status', 'closed');

    stats.high_priority = highPriorityCount || 0;

    // Calculate average response time (time to first response)
    const { data: responseTimes } = await adminClient
      .from('support_tickets')
      .select('created_at, first_response_at')
      .not('first_response_at', 'is', null)
      .limit(100);

    if (responseTimes && responseTimes.length > 0) {
      const totalResponseTime = responseTimes.reduce((acc: number, ticket: any) => {
        const created = new Date(ticket.created_at);
        const responded = new Date(ticket.first_response_at);
        return acc + (responded.getTime() - created.getTime());
      }, 0);
      
      stats.avg_response_time = Math.round(totalResponseTime / responseTimes.length / (1000 * 60 * 60)); // hours
    }

    // Calculate average resolution time
    const { data: resolutionTimes } = await adminClient
      .from('support_tickets')
      .select('created_at, resolved_at')
      .not('resolved_at', 'is', null)
      .limit(100);

    if (resolutionTimes && resolutionTimes.length > 0) {
      const totalResolutionTime = resolutionTimes.reduce((acc: number, ticket: any) => {
        const created = new Date(ticket.created_at);
        const resolved = new Date(ticket.resolved_at);
        return acc + (resolved.getTime() - created.getTime());
      }, 0);
      
      stats.avg_resolution_time = Math.round(totalResolutionTime / resolutionTimes.length / (1000 * 60 * 60)); // hours
    }

    return stats;
  } catch (error) {
    console.error('Error fetching support stats:', error);
    throw error;
  }
}

async function getClinics(adminClient: any) {
  try {
    const { data, error } = await adminClient
      .from('clinics')
      .select('id, display_name')
      .eq('is_active', true)
      .order('display_name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching clinics:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin();
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
    const path = request.url.split('/').pop()?.split('?')[0];
    
    // Check if this is a tickets endpoint
    if (path === 'tickets' || searchParams.get('type') === 'tickets') {
      // Build filters from query params
      const filters: any = {};
      
      if (searchParams.get('status')) {
        filters.status = searchParams.get('status');
      }
      
      if (searchParams.get('priority')) {
        filters.priority = searchParams.get('priority');
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
    }
    
    // Handle other types
    const type = searchParams.get('type') || 'tickets';
    
    // Build filters from query params for other types
    const filters: any = {};
    
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status');
    }
    
    if (searchParams.get('priority')) {
      filters.priority = searchParams.get('priority');
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

    switch (type) {
      case 'tickets':
        const ticketsData = await getSupportTickets(adminClient, filters);
        return successResponse(ticketsData);
      
      case 'stats':
        const stats = await getSupportStats(adminClient, filters);
        return successResponse({ stats });
      
      case 'clinics':
        const clinics = await getClinics(adminClient);
        return successResponse({ clinics });
      
      default:
        return errorResponse('Invalid type parameter', 400);
    }
  } catch (error) {
    console.error('Support API error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin();
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
    const { action } = body;

    switch (action) {
      case 'createTicket':
        const { clinic_id, subject, description, priority, category } = body;
        
        const { data: newTicket, error: createError } = await adminClient
          .from('support_tickets')
          .insert({
            clinic_id,
            user_id: user.id,
            subject,
            description,
            priority: priority || 'medium',
            category: category || 'general',
            status: 'open',
            assigned_to: null
          })
          .select()
          .single();

        if (createError) throw createError;

        // Log the action
        await adminClient
          .from('audit_logs')
          .insert({
            user_id: user.id,
            table_name: 'support_tickets',
            record_id: newTicket.id,
            action: 'INSERT',
            new_values: newTicket,
            event_type: 'support_management',
            description: `Created support ticket: ${subject}`
          });

        return successResponse({ ticket: newTicket });

      case 'updateTicket':
        const { ticketId, updates } = body;
        
        const { data: updatedTicket, error: updateError } = await adminClient
          .from('support_tickets')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', ticketId)
          .select()
          .single();

        if (updateError) throw updateError;

        return successResponse({ ticket: updatedTicket });

      case 'addReply':
        const { ticket_id, message, is_internal } = body;
        
        // First response time
        const { data: ticket } = await adminClient
          .from('support_tickets')
          .select('first_response_at')
          .eq('id', ticket_id)
          .single();

        const updateData: any = {
          updated_at: new Date().toISOString()
        };

        if (!ticket?.first_response_at && !is_internal) {
          updateData.first_response_at = new Date().toISOString();
        }

        // Add reply
        const { data: reply, error: replyError } = await adminClient
          .from('ticket_replies')
          .insert({
            ticket_id,
            user_id: user.id,
            message,
            is_internal: is_internal || false
          })
          .select(`
            *,
            user: user_id (
              id,
              full_name,
              email,
              role
            )
          `)
          .single();

        if (replyError) throw replyError;

        // Update ticket
        await adminClient
          .from('support_tickets')
          .update(updateData)
          .eq('id', ticket_id);

        return successResponse({ reply });

      default:
        return errorResponse('Invalid action', 400);
    }
  } catch (error) {
    console.error('Support API error:', error);
    return errorResponse('Internal server error', 500);
  }
}
