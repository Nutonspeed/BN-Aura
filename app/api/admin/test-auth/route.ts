import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSuperAdmin, handleAuthError } from '@/lib/auth/withAuth';

export async function GET(request: Request) {
  try {
    await requireSuperAdmin();
    const adminClient = createAdminClient();
    
    // Get the authorization header to extract the JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Verify the JWT token and get user info
    const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    // Test basic database query
    const { data: clinics, error: dbError } = await adminClient
      .from('clinics')
      .select('id, display_name, is_active')
      .limit(5);

    if (dbError) throw dbError;

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      clinics: clinics.map(c => ({
        id: c.id,
        name: typeof c.display_name === 'object' ? 
          (c.display_name as any).th || (c.display_name as any).en : 
          c.display_name,
        status: c.is_active ? 'active' : 'inactive'
      })),
      message: 'Authentication and database access working'
    });

  } catch (error) {
    console.error('Test auth error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
