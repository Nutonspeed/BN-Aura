import { NextResponse } from 'next/server';
import { chatManager } from '@/lib/chat/chatManager';
import { handleAPIError, successResponse } from '@/lib/utils/errorHandler';
import { createClient } from '@/lib/supabase/server';

/**
 * Secure API for Integrated Chat System
 * - Validates user session and ownership
 * - Enforces data isolation between sales staff  
 * - Never trusts client-provided IDs
 */

export async function GET(request: Request) {
  try {
    // Get authenticated session 
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action'); // 'history', 'sessions', 'unread'
    
    // Get user role from users table first
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Also check clinic_staff for sales_staff role
    const { data: staffData } = await supabase
      .from('clinic_staff')
      .select('role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();
    
    // Determine effective role (clinic_staff role takes precedence for sales)
    const effectiveRole = staffData?.role || userData.role;

    // Handle different actions based on user role
    if (action === 'sessions') {
      // Sales staff gets their assigned customers' sessions
      if (effectiveRole === 'sales_staff') {
        const sessions = await chatManager.getChatSessionsForSales(user.id);
        return successResponse({ sessions });
      }
      
      // Customer/free_user gets their own session
      if (['customer', 'premium_customer', 'free_customer', 'free_user'].includes(effectiveRole)) {
        // Get customer record linked to this auth user
        const { data: customer } = await supabase
          .from('customers')
          .select('id, assigned_sales_id, full_name')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (!customer) {
          return successResponse({ sessions: [] });
        }
        
        // Get sales staff name if assigned
        let salesName = 'Your Advisor';
        if (customer.assigned_sales_id) {
          const { data: salesUser } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', customer.assigned_sales_id)
            .single();
          salesName = salesUser?.full_name || 'Your Advisor';
        }
        
        // Return single session for this customer
        const sessions = [{
          id: customer.id,
          customer_id: customer.id,
          sales_staff_id: customer.assigned_sales_id,
          customer_name: customer.full_name,
          sales_name: salesName,
          last_message: '',
          last_message_at: new Date().toISOString(),
          unread_count: 0
        }];
        return successResponse({ sessions });
      }
      
      // Clinic owner/admin can see all sessions in their clinic
      if (['clinic_owner', 'clinic_admin'].includes(effectiveRole)) {
        // Get clinic_id from user
        const { data: userWithClinic } = await supabase
          .from('users')
          .select('clinic_id')
          .eq('id', user.id)
          .single();
          
        if (!userWithClinic?.clinic_id) {
          return successResponse({ sessions: [] });
        }
        
        // Get all customers in this clinic
        const { data: customers } = await supabase
          .from('customers')
          .select('id, full_name, assigned_sales_id')
          .eq('clinic_id', userWithClinic.clinic_id)
          .limit(50);
          
        const sessions = (customers || []).map(c => ({
          id: c.id,
          customer_id: c.id,
          sales_staff_id: c.assigned_sales_id,
          customer_name: c.full_name,
          sales_name: 'Sales Rep',
          last_message: '',
          last_message_at: new Date().toISOString(),
          unread_count: 0
        }));
        return successResponse({ sessions });
      }
      
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (action === 'history') {
      const customerId = searchParams.get('customerId');
      if (!customerId) {
        return NextResponse.json({ error: 'Missing customerId' }, { status: 400 });
      }
      
      // Validate ownership based on user role
      if (effectiveRole === 'sales_staff') {
        // Sales staff can only see customers assigned to them
        const { data: customer } = await supabase
          .from('customers')
          .select('assigned_sales_id')
          .eq('id', customerId)
          .single();
          
        if (!customer || customer.assigned_sales_id !== user.id) {
          return NextResponse.json({ error: 'Customer not assigned to you' }, { status: 403 });
        }
        
        const messages = await chatManager.getChatHistory(customerId, user.id);
        return successResponse({ messages });
      } else if (['customer', 'premium_customer', 'free_customer', 'free_user'].includes(effectiveRole)) {
        // Customer can only see their own chat
        const { data: customer } = await supabase
          .from('customers')
          .select('assigned_sales_id, id')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (!customer || customer.id !== customerId) {
          return NextResponse.json({ error: 'Access denied to this chat' }, { status: 403 });
        }
        
        const messages = await chatManager.getChatHistory(customerId, customer.assigned_sales_id);
        return successResponse({ messages });
      } else {
        return NextResponse.json({ error: 'Invalid role for chat access' }, { status: 403 });
      }
    }

    if (action === 'unread') {
      const customerId = searchParams.get('customerId');
      if (!customerId) {
        return NextResponse.json({ error: 'Missing customerId' }, { status: 400 });
      }
      
      // Similar ownership validation for unread count
      if (effectiveRole === 'sales_staff') {
        const { data: customer } = await supabase
          .from('customers')
          .select('assigned_sales_id')
          .eq('id', customerId)
          .single();
          
        if (!customer || customer.assigned_sales_id !== user.id) {
          return NextResponse.json({ error: 'Customer not assigned to you' }, { status: 403 });
        }
        
        const count = await chatManager.getUnreadCount(customerId, user.id, 'sales');
        return successResponse({ unreadCount: count });
      } else if (['customer', 'premium_customer', 'free_customer'].includes(effectiveRole)) {
        const { data: customer } = await supabase
          .from('customers')
          .select('assigned_sales_id, id')
          .eq('user_id', user.id)
          .single();
          
        if (!customer || customer.id !== customerId) {
          return NextResponse.json({ error: 'Access denied to this chat' }, { status: 403 });
        }
        
        const count = await chatManager.getUnreadCount(customerId, customer.assigned_sales_id, 'customer');
        return successResponse({ unreadCount: count });
      }
    }

    return NextResponse.json({ error: 'Missing or invalid action parameter' }, { status: 400 });
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function POST(request: Request) {
  try {
    // Get authenticated session
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, customerId, messageText, messageType, contextData } = body;
    
    // Get user role from database
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (action === 'markRead') {
      if (!customerId) {
        return NextResponse.json({ error: 'Missing customerId' }, { status: 400 });
      }
      
      // Validate ownership and determine reader type
      if (userData.role === 'sales_staff') {
        const { data: customer } = await supabase
          .from('customers')
          .select('assigned_sales_id')
          .eq('id', customerId)
          .single();
          
        if (!customer || customer.assigned_sales_id !== user.id) {
          return NextResponse.json({ error: 'Customer not assigned to you' }, { status: 403 });
        }
        
        await chatManager.markMessagesAsRead(customerId, user.id, 'sales');
        return successResponse({ message: 'Messages marked as read' });
      } else if (['customer', 'premium_customer', 'free_customer', 'free_user'].includes(userData.role)) {
        const { data: customer } = await supabase
          .from('customers')
          .select('assigned_sales_id, id')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (!customer || customer.id !== customerId) {
          return NextResponse.json({ error: 'Access denied to this chat' }, { status: 403 });
        }
        
        await chatManager.markMessagesAsRead(customerId, customer.assigned_sales_id, 'customer');
        return successResponse({ message: 'Messages marked as read' });
      }
    }

    if (action === 'recommendation') {
      // Only sales staff can send treatment recommendations
      if (userData.role !== 'sales_staff') {
        return NextResponse.json({ error: 'Only sales staff can send recommendations' }, { status: 403 });
      }
      
      if (!customerId || !body.treatmentData) {
        return NextResponse.json({ error: 'Missing customerId or treatmentData' }, { status: 400 });
      }
      
      // Validate customer ownership
      const { data: customer } = await supabase
        .from('customers')
        .select('assigned_sales_id')
        .eq('id', customerId)
        .single();
        
      if (!customer || customer.assigned_sales_id !== user.id) {
        return NextResponse.json({ error: 'Customer not assigned to you' }, { status: 403 });
      }
      
      const message = await chatManager.sendTreatmentRecommendation(customerId, user.id, body.treatmentData);
      return successResponse({ message });
    }

    // Send regular message
    if (customerId && messageText) {
      // Validate ownership and determine sender type based on role
      if (userData.role === 'sales_staff') {
        const { data: customer } = await supabase
          .from('customers')
          .select('assigned_sales_id')
          .eq('id', customerId)
          .single();
          
        if (!customer || customer.assigned_sales_id !== user.id) {
          return NextResponse.json({ error: 'Customer not assigned to you' }, { status: 403 });
        }
        
        const message = await chatManager.sendMessage(
          customerId,
          user.id,
          'sales',
          messageText,
          messageType || 'text',
          contextData
        );
        return successResponse({ message });
      } else if (['customer', 'premium_customer', 'free_customer', 'free_user'].includes(userData.role)) {
        const { data: customer } = await supabase
          .from('customers')
          .select('assigned_sales_id, id')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (!customer || customer.id !== customerId) {
          return NextResponse.json({ error: 'Access denied to this chat' }, { status: 403 });
        }
        
        const message = await chatManager.sendMessage(
          customerId,
          customer.assigned_sales_id,
          'customer',
          messageText,
          messageType || 'text',
          contextData
        );
        return successResponse({ message });
      } else {
        return NextResponse.json({ error: 'Invalid role for chat access' }, { status: 403 });
      }
    }

    return NextResponse.json({ error: 'Missing required fields or invalid action' }, { status: 400 });
  } catch (error) {
    return handleAPIError(error);
  }
}
