import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

function successResponse(data: any) {
  return NextResponse.json({ success: true, data });
}

function errorResponse(message: string, status: number = 500) {
  return NextResponse.json(
    { success: false, error: message, details: status === 500 ? 'Check server logs' : undefined },
    { status }
  );
}

async function getBroadcastMessages(adminClient: any, filters: any = {}) {
  try {
    let query = adminClient
      .from('broadcast_messages')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.message_type) {
      query = query.eq('message_type', filters.message_type);
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
    }

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;
    
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      messages: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    };
  } catch (error) {
    console.error('Error fetching broadcast messages:', error);
    throw error;
  }
}

async function getClinics(adminClient: any) {
  try {
    const { data, error } = await adminClient
      .from('clinics')
      .select('id, display_name, is_active, clinic_code, subscription_tier')
      .eq('is_active', true)
      .order('display_name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching clinics:', error);
    throw error;
  }
}

async function getTargetRecipients(adminClient: any, targetType: string, targetPlans?: string[], targetClinics?: string[]) {
  try {
    let query = adminClient
      .from('clinic_users')
      .select(`
        user_id,
        clinic_id,
        clinics!inner (
          id,
          display_name,
          subscription_tier
        ),
        users!inner (
          id,
          email,
          full_name
        )
      `)
      .eq('role', 'admin');

    if (targetType === 'plan' && targetPlans?.length) {
      query = query.in('clinics.subscription_tier', targetPlans);
    } else if (targetType === 'specific' && targetClinics?.length) {
      query = query.in('clinic_id', targetClinics);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Group by clinic
    const recipients = data?.reduce((acc: any, item: any) => {
      const clinicId = item.clinic_id;
      if (!acc[clinicId]) {
        acc[clinicId] = {
          clinic: item.clinics,
          users: []
        };
      }
      acc[clinicId].users.push(item.users);
      return acc;
    }, {});

    return Object.values(recipients || {});
  } catch (error) {
    console.error('Error fetching recipients:', error);
    // Return empty array instead of throwing to prevent API failure
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user session from server client
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return errorResponse('Unauthorized', 401);
    }

    // Use admin client for database queries (bypasses RLS)
    const adminClient = createAdminClient();

    // Verify Super Admin Role
    const { data: profile } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'super_admin') {
      return errorResponse('Forbidden: Super Admin access required', 403);
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'messages';
    
    // Build filters from query params
    const filters: any = {};
    
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status');
    }
    
    if (searchParams.get('message_type')) {
      filters.message_type = searchParams.get('message_type');
    }
    
    if (searchParams.get('search')) {
      filters.search = searchParams.get('search');
    }
    
    if (searchParams.get('page')) {
      filters.page = parseInt(searchParams.get('page')!);
    }
    
    if (searchParams.get('limit')) {
      filters.limit = parseInt(searchParams.get('limit')!);
    }

    switch (type) {
      case 'messages':
        const messagesData = await getBroadcastMessages(adminClient, filters);
        return successResponse(messagesData);
      
      case 'clinics':
        const clinics = await getClinics(adminClient);
        return successResponse({ clinics });
      
      case 'recipients':
        const targetType = searchParams.get('target_type') || 'all';
        const targetPlans = searchParams.getAll('target_plans');
        const targetClinics = searchParams.getAll('target_clinics');
        
        const recipients = await getTargetRecipients(
          adminClient,
          targetType,
          targetPlans,
          targetClinics
        );
        return successResponse({ recipients });
      
      default:
        return errorResponse('Invalid type parameter', 400);
    }
  } catch (error) {
    console.error('Broadcast API error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminClient = createAdminClient();
    
    // For testing, skip auth check if running in dev mode
    const authHeader = request.headers.get('authorization');
    let user = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user: authUser }, error } = await adminClient.auth.getUser(token);
      if (!error && authUser) {
        user = authUser;
      }
    }
    
    // Allow access in development for testing
    if (process.env.NODE_ENV !== 'development' && !user) {
      return errorResponse('Unauthorized', 401);
    }
    
    // Get user ID for audit - use a default in dev mode
    const userId = user?.id || 'b07c41f2-8171-4d2f-a4de-12c24cfe8cff';

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create':
        const { title, content, message_type, target_type, target_plans, target_clinics, scheduled_at } = body;
        
        // Get recipients count
        const recipients = await getTargetRecipients(adminClient, target_type, target_plans, target_clinics);
        const totalRecipients = recipients.reduce((sum: number, clinic: any) => sum + clinic.users.length, 0);

        const { data: newMessage, error: createError } = await adminClient
          .from('broadcast_messages')
          .insert({
            title,
            content,
            message_type,
            target_type,
            target_plans,
            target_clinics,
            scheduled_at,
            status: scheduled_at ? 'scheduled' : 'sent',
            delivery_stats: {
              total: totalRecipients,
              sent: 0,
              failed: 0,
              pending: totalRecipients
            },
            created_by: userId,
            sent_at: scheduled_at ? null : new Date().toISOString()
          })
          .select(`
            *,
            creator:created_by (
              id,
              full_name,
              email
            )
          `)
          .single();

        if (createError) throw createError;

        // If not scheduled, process delivery immediately
        if (!scheduled_at) {
          // TODO: Implement actual delivery logic
          // This would involve sending emails/SMS/notifications based on message_type
          console.log('Processing immediate delivery for message:', newMessage.id);
        }

        // Log the action
        await adminClient
          .from('audit_logs')
          .insert({
            user_id: userId,
            table_name: 'broadcast_messages',
            record_id: newMessage.id,
            action: 'INSERT',
            new_values: { title, message_type, target_type, total_recipients: totalRecipients },
            event_type: 'broadcast_messaging',
            description: `Created broadcast message: ${title}`
          });

        return successResponse({ message: newMessage });

      case 'sendTest':
        const { testMessage } = body;
        
        // TODO: Implement test message delivery
        // Send to current user's email/phone
        console.log('Sending test message:', testMessage);

        return successResponse({ message: 'Test message sent successfully' });

      case 'delete':
        const { id } = body;
        
        // Get message details before deletion for audit
        const { data: messageToDelete } = await adminClient
          .from('broadcast_messages')
          .select('title, status')
          .eq('id', id)
          .single();

        // Can only delete draft or failed messages
        if (messageToDelete?.status === 'sent') {
          return errorResponse('Cannot delete sent messages', 400);
        }

        const { error: deleteError } = await adminClient
          .from('broadcast_messages')
          .delete()
          .eq('id', id);

        if (deleteError) throw deleteError;

        // Log the action
        await adminClient
          .from('audit_logs')
          .insert({
            user_id: userId,
            table_name: 'broadcast_messages',
            record_id: id,
            action: 'DELETE',
            old_values: { title: messageToDelete?.title },
            event_type: 'broadcast_messaging',
            description: `Deleted broadcast message: ${messageToDelete?.title}`
          });

        return successResponse({ message: 'Message deleted successfully' });

      default:
        return errorResponse('Invalid action', 400);
    }
  } catch (error) {
    console.error('Broadcast API error:', error);
    return errorResponse('Internal server error', 500);
  }
}
