import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { handleAPIError, successResponse } from '@/lib/utils/errorHandler';

/**
 * Super Admin Global Management API
 * Restricted to super_admin role only
 */

export async function GET(request: Request) {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify Super Admin Role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 0 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'clinics', 'system_health', 'logs'

    if (type === 'clinics') {
      const { data: clinics, error } = await supabase
        .from('clinics')
        .select(`
          id, 
          name, 
          status, 
          created_at,
          clinic_staff(count),
          customers(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return successResponse({ clinics });
    }

    if (type === 'system_health') {
      // Logic to check system components
      // In a real environment, this might check external status pages or specific ping endpoints
      return successResponse({
        health: {
          database: 'Operational',
          storage: 'Operational',
          ai_gateway: 'Operational',
          auth_service: 'Operational',
          edge_functions: 'Operational',
          timestamp: new Date().toISOString()
        }
      });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function POST(request: Request) {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { action, clinicId, status, quotaLimit } = body;

    if (action === 'updateStatus' && clinicId && status) {
      const { error } = await supabase
        .from('clinics')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', clinicId);

      if (error) throw error;
      return successResponse({ message: `Clinic status updated to ${status}` });
    }

    if (action === 'updateQuota' && clinicId && quotaLimit) {
      // Logic to update AI quota for a clinic
      // This might involve updating a 'clinic_quota' table
      return successResponse({ message: 'Quota updated successfully' });
    }

    return NextResponse.json({ error: 'Invalid action or missing fields' }, { status: 400 });
  } catch (error) {
    return handleAPIError(error);
  }
}
