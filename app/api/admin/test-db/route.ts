// Test API endpoint for debugging
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const adminClient = createAdminClient();
    
    // Test database connection
    const { data: users, error } = await adminClient
      .from('users')
      .select('id, email, role')
      .eq('email', 'clinic.owner@bntest.com')
      .single();
    
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    
    return Response.json({ 
      success: true, 
      user: users,
      message: 'Database connection working'
    });
    
  } catch (err) {
    return Response.json({ 
      error: err instanceof Error ? err.message : 'Unknown error' 
    }, { status: 500 });
  }
}
