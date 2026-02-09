// Direct database update for user role
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSuperAdmin, handleAuthError } from '@/lib/auth/withAuth';

export async function POST() {
  try {
    await requireSuperAdmin();
    const adminClient = createAdminClient();
    
    // Update clinic.owner@bntest.com role to clinic_owner
    const { data: user, error: findError } = await adminClient
      .from('users')
      .select('id, email, role')
      .eq('email', 'clinic.owner@bntest.com')
      .single();
    
    if (findError) {
      return Response.json({ error: 'User not found: ' + findError.message }, { status: 404 });
    }
    
    console.log('Found user:', user);
    
    // Update role to clinic_owner
    const { data: updateResult, error: updateError } = await adminClient
      .from('users')
      .update({ role: 'clinic_owner' })
      .eq('id', user.id)
      .select();
    
    if (updateError) {
      return Response.json({ error: 'Update failed: ' + updateError.message }, { status: 500 });
    }
    
    // Verify the update
    const { data: verifyUser } = await adminClient
      .from('users')
      .select('id, email, role')
      .eq('email', 'clinic.owner@bntest.com')
      .single();
    
    return Response.json({ 
      success: true,
      message: 'User role updated successfully',
      before: user,
      after: verifyUser,
      updateResult
    });
    
  } catch (err) {
    return Response.json({ 
      error: err instanceof Error ? err.message : 'Unknown error' 
    }, { status: 500 });
  }
}
