import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated'
      }, { status: 401 });
    }

    // Get user's role and clinic info
    const { data: staffData } = await supabase
      .from('clinic_staff')
      .select(`
        role,
        clinic_id,
        clinic:clinics(display_name)
      `)
      .eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();

    // Get customers this user can see
    const { data: customers, error } = await supabase
      .from('customers')
      .select(`
        full_name,
        customer_code,
        assigned_sales_id,
        created_at
      `)
      .order('full_name');

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    // Get user details
    const { data: userDetails } = await supabase
      .from('users')
      .select('role, full_name')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: userDetails?.role,
          clinic_role: staffData?.role,
          clinic_id: staffData?.clinic_id,
          clinic_name: Array.isArray(staffData?.clinic)
            ? staffData?.clinic?.[0]?.display_name || 'Unknown Clinic'
            : (staffData as any)?.clinic?.display_name || 'Unknown Clinic'
        },
        customers_visible: customers?.length || 0,
        customers: customers || [],
        test_timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Data isolation test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
