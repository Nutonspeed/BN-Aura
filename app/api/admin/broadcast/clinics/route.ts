import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

function successResponse(data: any) {
  return NextResponse.json({ success: true, data });
}

function errorResponse(message: string, status: number = 500) {
  return NextResponse.json({ success: false, error: message }, { status });
}

async function getClinics(adminClient: any, filters: any = {}) {
  try {
    let query = adminClient
      .from('clinics')
      .select(`
        id,
        display_name,
        clinic_code,
        subscription_tier,
        is_active,
        created_at
      `, { count: 'exact' })
      .eq('is_active', true)
      .order('display_name', { ascending: true });

    // Apply filters
    if (filters.subscription_tier) {
      query = query.eq('subscription_tier', filters.subscription_tier);
    }

    if (filters.search) {
      query = query.or(`display_name.ilike.%${filters.search}%,clinic_code.ilike.%${filters.search}%`);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    // Process display_name to handle JSONB format
    const processedData = (data || []).map((clinic: any) => ({
      ...clinic,
      display_name_processed: typeof clinic.display_name === 'string' 
        ? clinic.display_name 
        : clinic.display_name?.th || clinic.display_name?.en || 'Unknown Clinic'
    }));

    return processedData;
  } catch (error) {
    console.error('Error fetching clinics:', error);
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
    
    if (searchParams.get('subscription_tier')) {
      filters.subscription_tier = searchParams.get('subscription_tier');
    }
    
    if (searchParams.get('search')) {
      filters.search = searchParams.get('search');
    }

    const clinicsData = await getClinics(adminClient, filters);
    return successResponse(clinicsData);
  } catch (error) {
    console.error('Broadcast clinics API error:', error);
    return errorResponse('Internal server error', 500);
  }
}
