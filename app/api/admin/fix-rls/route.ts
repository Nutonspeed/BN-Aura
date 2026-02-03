// Fix RLS policies for Clinic Owner
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST() {
  try {
    const adminClient = createAdminClient();
    
    console.log('Fixing RLS policies for Clinic Owner...');
    
    // 1. Drop existing problematic policies
    const policiesToFix = [
      'users_select_policy',
      'clinic_staff_select_policy',
      'clinics_select_policy'
    ];
    
    for (const policyName of policiesToFix) {
      try {
        await adminClient.rpc('exec', {
          sql: `DROP POLICY IF EXISTS ${policyName} ON public.users;`
        });
        console.log(`Dropped policy: ${policyName}`);
      } catch (err) {
        console.log(`Policy ${policyName} not found or already dropped`);
      }
    }
    
    // 2. Create new RLS policies for users table
    await adminClient.rpc('exec', {
      sql: `
        -- Users can read their own data
        CREATE POLICY users_select_own_policy ON public.users
        FOR SELECT USING (auth.uid() = id);
        
        -- Clinic owners can read users in their clinic
        CREATE POLICY users_select_clinic_owner_policy ON public.users
        FOR SELECT USING (
          auth.uid() IN (
            SELECT owner_user_id FROM public.clinics WHERE id = clinic_id
          )
        );
        
        -- Super admins can read all users
        CREATE POLICY users_select_super_admin_policy ON public.users
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'super_admin'
          )
        );
      `
    });
    
    // 3. Create new RLS policies for clinic_staff table
    await adminClient.rpc('exec', {
      sql: `
        -- Users can read their own staff records
        CREATE POLICY clinic_staff_select_own_policy ON public.clinic_staff
        FOR SELECT USING (auth.uid() = user_id);
        
        -- Clinic owners can read all staff in their clinic
        CREATE POLICY clinic_staff_select_clinic_owner_policy ON public.clinic_staff
        FOR SELECT USING (
          auth.uid() IN (
            SELECT owner_user_id FROM public.clinics WHERE id = clinic_id
          )
        );
        
        -- Super admins can read all staff records
        CREATE POLICY clinic_staff_select_super_admin_policy ON public.clinic_staff
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'super_admin'
          )
        );
      `
    });
    
    // 4. Create new RLS policies for clinics table
    await adminClient.rpc('exec', {
      sql: `
        -- Clinic owners can read their own clinic
        CREATE POLICY clinics_select_own_policy ON public.clinics
        FOR SELECT USING (auth.uid() = owner_user_id);
        
        -- Super admins can read all clinics
        CREATE POLICY clinics_select_super_admin_policy ON public.clinics
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'super_admin'
          )
        );
      `
    });
    
    // 5. Verify the clinic owner setup
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
        ),
        clinics!inner (
          id as clinic_id_check,
          display_name,
          owner_user_id
        )
      `)
      .eq('email', 'clinic.owner@bntest.com')
      .single();
    
    return Response.json({ 
      success: true,
      message: 'RLS policies fixed successfully',
      verification: verification
    });
    
  } catch (err) {
    console.error('RLS fix error:', err);
    return Response.json({ 
      error: err instanceof Error ? err.message : 'Unknown error',
      details: err
    }, { status: 500 });
  }
}
