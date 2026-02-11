/**
 * Admin API for managing data deletion requests
 * GET - List all pending/processed deletion requests
 * POST - Process a deletion request (approve/reject)
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

async function requireAdmin(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const adminClient = createAdminClient();
  const { data: { user } } = await adminClient.auth.getUser(authHeader.substring(7));
  if (!user) return null;

  // Check if user is super_admin or clinic_owner
  const { data: userData } = await adminClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const { data: staffData } = await adminClient
    .from('clinic_staff')
    .select('role')
    .eq('user_id', user.id)
    .in('role', ['clinic_owner', 'admin'])
    .maybeSingle();

  if (userData?.role !== 'super_admin' && !staffData) return null;
  return user;
}

export async function GET(request: Request) {
  try {
    const user = await requireAdmin(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    const adminClient = createAdminClient();
    let query = adminClient
      .from('data_deletion_requests')
      .select(`
        *,
        users:user_id (id, email, full_name)
      `)
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[Deletion Requests API] GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAdmin(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { requestId, action, notes } = body;

    if (!requestId || !action) {
      return NextResponse.json({ error: 'requestId and action are required' }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const { data, error } = await adminClient
      .from('data_deletion_requests')
      .update({
        status: newStatus,
        processed_at: new Date().toISOString(),
        processed_by: user.id,
        metadata: { notes, processed_action: action },
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;

    // If approved, schedule actual data deletion
    if (action === 'approve' && data) {
      // Log the approval for audit
      await adminClient.from('audit_logs').insert({
        user_id: user.id,
        action: 'data_deletion_approved',
        resource_type: 'data_deletion_request',
        resource_id: requestId,
        details: { target_user_id: data.user_id, notes },
        clinic_id: null,
      }).then(() => {});
    }

    return NextResponse.json({ 
      success: true, 
      data: { requestId, status: newStatus } 
    });
  } catch (error: any) {
    console.error('[Deletion Requests API] POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
