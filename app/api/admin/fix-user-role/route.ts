// Fix user role for clinic owner
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSuperAdmin, handleAuthError } from '@/lib/auth/withAuth';

export async function POST() {
  try {
    await requireSuperAdmin();
    const adminClient = createAdminClient();
    
    console.log('Fixing user role for clinic owner...');
    
    // 1. Get the user
    const { data: user, error: userError } = await adminClient
      .from('users')
      .select('id, email, role, clinic_id')
      .eq('email', 'clinic.owner@bntest.com')
      .single();
    
    if (userError) {
      return Response.json({ error: 'User not found: ' + userError.message }, { status: 404 });
    }
    
    console.log('Found user:', user);
    
    // 2. Check if user has clinic_staff record (using admin client to bypass RLS)
    const { data: staffRecordInitial, error: staffError } = await adminClient
      .from('clinic_staff')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    let staffRecord = staffRecordInitial;
    
    console.log('Staff record check:', { staffRecord, staffError });
    
    if (staffError || !staffRecord) {
      console.log('Staff record not found, checking existing records...');
      
      // Check all staff records for this user to debug
      const { data: allStaffRecords } = await adminClient
        .from('clinic_staff')
        .select('*')
        .eq('user_id', user.id);
      
      console.log('All staff records for user:', allStaffRecords);
      
      if (!staffRecord && allStaffRecords && allStaffRecords.length > 0) {
        staffRecord = allStaffRecords[0];
        console.log('Using existing staff record:', staffRecord);
      } else {
        return Response.json({ 
          error: 'No staff record found',
          details: { staffError, allStaffRecords }
        }, { status: 404 });
      }
    }
    
    console.log('Found staff record:', staffRecord);
    
    // 3. Update user role to match clinic_staff role
    const { data: updatedUser, error: updateError } = await adminClient
      .from('users')
      .update({ 
        role: staffRecord.role === 'clinic_owner' ? 'premium_customer' : 'free_user', // Keep premium_customer for now
        clinic_id: staffRecord.clinic_id,
        full_name: 'BN Test Clinic Owner'
      })
      .eq('id', user.id)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    // 4. Verify the fix
    const { data: verification } = await adminClient
      .from('users')
      .select(`
        id, 
        email, 
        role, 
        clinic_id,
        full_name,
        clinic_staff!inner (
          role as staff_role,
          clinic_id as staff_clinic_id,
          is_active
        )
      `)
      .eq('email', 'clinic.owner@bntest.com')
      .single();
    
    return Response.json({ 
      success: true,
      message: 'User role fixed successfully',
      data: {
        before: user,
        after: verification,
        staff: staffRecord
      }
    });
    
  } catch (err) {
    console.error('Role fix error:', err);
    return Response.json({ 
      error: err instanceof Error ? err.message : 'Unknown error',
      details: err
    }, { status: 500 });
  }
}
