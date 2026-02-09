import { requireAuth } from '@/lib/auth/withAuth';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleAPIError, successResponse } from '@/lib/utils/errorHandler';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  withErrorHandling,
  APIValidator 
} from '@/lib/api/responseHelpers';
import { APIErrorCode } from '@/lib/api/contracts';
import { notificationEngine, NotificationType, NotificationChannel } from '@/lib/notifications/notificationEngine';

/**
 * BN-Aura Notification System API
 */

export const GET = withErrorHandling(async (request: Request) => {
  // For user-specific operations, we need to verify the JWT token
  const { createClient } = await import('@/lib/supabase/server');
  const { createAdminClient } = await import('@/lib/supabase/admin');
  
  // Get the authorization header to extract the JWT token
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return createErrorResponse(
      APIErrorCode.UNAUTHORIZED,
      'Authentication required: No token provided'
    );
  }

  const token = authHeader.substring(7);
  
  // Verify the JWT token and get user info using admin client
  const adminClient = createAdminClient();
  const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
  
  if (authError || !user) {
    return createErrorResponse(
      APIErrorCode.UNAUTHORIZED,
      'Authentication required: Invalid token'
    );
  }

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get('unread') === 'true';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

  // Create a regular client for database operations
  const supabase = await createClient();
  
  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  const { data, error, count } = await query
    .range((page - 1) * limit, page * limit - 1);

  if (error) throw error;

  return createSuccessResponse(data, {
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    },
    meta: {
      unreadOnly,
      totalNotifications: count || 0
    }
  });
});

export const POST = withErrorHandling(async (request: Request) => {
  // For user-specific operations, we need to verify the JWT token
  const { createClient } = await import('@/lib/supabase/server');
  const { createAdminClient } = await import('@/lib/supabase/admin');
  
  // Get the authorization header to extract the JWT token
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return createErrorResponse(
      APIErrorCode.UNAUTHORIZED,
      'Authentication required: No token provided'
    );
  }

  const token = authHeader.substring(7);
  
  // Verify the JWT token and get user info using admin client
  const adminClient = createAdminClient();
  const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
  
  if (authError || !user) {
    return createErrorResponse(
      APIErrorCode.UNAUTHORIZED,
      'Authentication required: Invalid token'
    );
  }

  const body = await request.json();
  const { action, notificationId, type, title, message, priority, clinicId } = body;

  // Create a regular client for database operations
  const supabase = await createClient();

  // Handle notification actions
  if (action === 'markRead') {
    if (!notificationId) {
      return createErrorResponse(
        APIErrorCode.MISSING_REQUIRED_FIELDS,
        'notificationId is required for markRead action'
      );
    }

    const uuidError = APIValidator.validateUUID(notificationId, 'notificationId');
    if (uuidError) {
      return createErrorResponse(
        APIErrorCode.VALIDATION_ERROR,
        'Invalid notificationId format',
        { validationErrors: [uuidError] }
      );
    }

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (error) throw error;
    
    return createSuccessResponse({ 
      notificationId,
      status: 'read' 
    }, {
      meta: { action: 'notification_marked_read' }
    });
  }

  if (action === 'markAllRead') {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_read', false)
      .select('id');

    if (error) throw error;
    
    return createSuccessResponse({ 
      updatedCount: data?.length || 0 
    }, {
      meta: { action: 'all_notifications_marked_read' }
    });
  }

  // Handle sending new notifications (admin/system function)
  if (action === 'send') {
    const validationErrors = APIValidator.validateRequired(body, [
      'type', 'title', 'message', 'priority'
    ]);

    if (validationErrors.length > 0) {
      return createErrorResponse(
        APIErrorCode.VALIDATION_ERROR,
        'Missing required fields for send action',
        { validationErrors }
      );
    }

    const priorityError = APIValidator.validateEnum(
      priority, 
      'priority', 
      ['low', 'medium', 'high', 'critical']
    );
    if (priorityError) {
      return createErrorResponse(
        APIErrorCode.VALIDATION_ERROR,
        'Invalid priority value',
        { validationErrors: [priorityError] }
      );
    }

    try {
      const results = await notificationEngine.sendNotification({
        type: type as NotificationType,
        title,
        message,
        priority,
        channels: [NotificationChannel.IN_APP],
        clinicId,
        targetUsers: [user.id]
      });

      return createSuccessResponse({
        sent: true,
        channels: results
      }, {
        meta: { action: 'notification_sent', type }
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
      return createErrorResponse(
        APIErrorCode.INTERNAL_SERVER_ERROR,
        'Failed to send notification'
      );
    }
  }

  return createErrorResponse(
    APIErrorCode.VALIDATION_ERROR,
    'Invalid action. Supported actions: markRead, markAllRead, send',
    { details: { supportedActions: ['markRead', 'markAllRead', 'send'] } }
  );
});
