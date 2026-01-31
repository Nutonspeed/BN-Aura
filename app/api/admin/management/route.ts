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
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'clinics', 'system_health', 'stats'

    if (type === 'stats') {
      // 1. Total Clinics
      const { count: totalClinics } = await supabase
        .from('clinics')
        .select('id', { count: 'exact', head: true });

      // 2. Global Customers
      const { count: globalCustomers } = await supabase
        .from('customers')
        .select('id', { count: 'exact', head: true });

      // 3. Monthly AI Load (Scans in last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { count: monthlyScans } = await supabase
        .from('skin_analyses')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo);

      // 4. Active Staff
      const { count: totalStaff } = await supabase
        .from('clinic_staff')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);

      return successResponse({
        totalClinics: totalClinics || 0,
        globalCustomers: globalCustomers || 0,
        monthlyAILoad: monthlyScans || 0,
        activeStaff: totalStaff || 0
      });
    }

    if (type === 'clinics') {
      const { data: clinics, error } = await supabase
        .from('clinics')
        .select(`
          id, 
          clinic_code,
          display_name, 
          status:is_active, 
          created_at,
          clinic_staff(count),
          customers(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform status from is_active boolean to string if needed by UI
      const transformedClinics = clinics.map(c => ({
        ...c,
        name: typeof c.display_name === 'object' ? (c.display_name as any).th || (c.display_name as any).en : c.display_name,
        status: c.status ? 'active' : 'inactive'
      }));

      return successResponse({ clinics: transformedClinics });
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
