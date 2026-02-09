import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSuperAdmin, handleAuthError } from '@/lib/auth/withAuth';

// GET - Get clinics for announcement targeting
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin();
    console.log('Announcements clinics API called');    const supabaseAdmin = createAdminClient();

    console.log('Using admin client directly for development');

    console.log('Fetching clinics...');

    // Get clinics for targeting
    const { data: clinics, error: clinicsError } = await supabaseAdmin
      .from('clinics')
      .select(`
        id,
        clinic_code,
        display_name,
        is_active,
        created_at,
        plan
      `)
      .eq('is_active', true)
      .order('display_name', { ascending: true });

    console.log('Clinics query result:', { clinics: clinics?.length, error: clinicsError });

    if (clinicsError) {
      throw clinicsError;
    }

    return NextResponse.json({
      success: true,
      data: clinics
    });

  } catch (error) {
    console.error('Error fetching clinics for announcements:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch clinics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
