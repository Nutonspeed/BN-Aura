import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

function successResponse(data: any) {
  return NextResponse.json({ success: true, data });
}

function errorResponse(message: string, status: number = 500) {
  return NextResponse.json({ success: false, error: message }, { status });
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

export async function GET(request: NextRequest) {
  try {
    // For development: Use admin client directly
    // TODO: Add proper authentication in production
    const adminClient = createAdminClient();

    const { searchParams } = new URL(request.url);
    
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

    const messagesData = await getBroadcastMessages(adminClient, filters);
    return successResponse(messagesData);
  } catch (error) {
    console.error('Broadcast messages API error:', error);
    return errorResponse('Internal server error', 500);
  }
}
