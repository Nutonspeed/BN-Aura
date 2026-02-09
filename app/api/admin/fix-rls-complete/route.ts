// Complete RLS Policies Fix for Clinic Owner
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSuperAdmin, handleAuthError } from '@/lib/auth/withAuth';

export async function POST() {
  try {
    await requireSuperAdmin();
    const adminClient = createAdminClient();
    
    console.log('Fixing remaining RLS policies...');
    
    // 1. Drop all existing policies to start fresh
    const tables = ['users', 'clinic_staff', 'clinics'];
    
    for (const table of tables) {
      try {
        await adminClient.rpc('exec', {
          sql: `DROP POLICY IF EXISTS ${table}_select_policy ON public.${table};`
        });
        await adminClient.rpc('exec', {
          sql: `DROP POLICY IF EXISTS ${table}_insert_policy ON public.${table};`
        });
        await adminClient.rpc('exec', {
          sql: `DROP POLICY IF EXISTS ${table}_update_policy ON public.${table};`
        });
        console.log(`Dropped all policies for ${table}`);
      } catch (err) {
        console.log(`Policy drop for ${table} not needed or failed:`, err);
      }
    }
    
    // 2. Create comprehensive RLS policies for users table
    await adminClient.rpc('exec', {
      sql: `
        -- Users table policies
        CREATE POLICY users_select_own_policy ON public.users
        FOR SELECT USING (auth.uid() = id);
        
        CREATE POLICY users_select_clinic_owner_policy ON public.users
        FOR SELECT USING (
          auth.uid() IN (
            SELECT owner_user_id FROM public.clinics 
            WHERE id = public.users.clinic_id
          )
        );
        
        CREATE POLICY users_select_super_admin_policy ON public.users
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'super_admin'
          )
        );
        
        CREATE POLICY users_update_own_policy ON public.users
        FOR UPDATE USING (auth.uid() = id);
        
        CREATE POLICY users_update_super_admin_policy ON public.users
        FOR UPDATE USING (
          EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'super_admin'
          )
        );
      `
    });
    
    // 3. Create comprehensive RLS policies for clinic_staff table
    await adminClient.rpc('exec', {
      sql: `
        -- Clinic staff table policies
        CREATE POLICY clinic_staff_select_own_policy ON public.clinic_staff
        FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY clinic_staff_select_clinic_owner_policy ON public.clinic_staff
        FOR SELECT USING (
          auth.uid() IN (
            SELECT owner_user_id FROM public.clinics 
            WHERE id = public.clinic_staff.clinic_id
          )
        );
        
        CREATE POLICY clinic_staff_select_super_admin_policy ON public.clinic_staff
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'super_admin'
          )
        );
        
        CREATE POLICY clinic_staff_insert_super_admin_policy ON public.clinic_staff
        FOR INSERT WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'super_admin'
          )
        );
        
        CREATE POLICY clinic_staff_update_own_policy ON public.clinic_staff
        FOR UPDATE USING (auth.uid() = user_id);
        
        CREATE POLICY clinic_staff_update_clinic_owner_policy ON public.clinic_staff
        FOR UPDATE USING (
          auth.uid() IN (
            SELECT owner_user_id FROM public.clinics 
            WHERE id = public.clinic_staff.clinic_id
          )
        );
      `
    });
    
    // 4. Create comprehensive RLS policies for clinics table
    await adminClient.rpc('exec', {
      sql: `
        -- Clinics table policies
        CREATE POLICY clinics_select_own_policy ON public.clinics
        FOR SELECT USING (auth.uid() = owner_user_id);
        
        CREATE POLICY clinics_select_super_admin_policy ON public.clinics
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'super_admin'
          )
        );
        
        CREATE POLICY clinics_update_own_policy ON public.clinics
        FOR UPDATE USING (auth.uid() = owner_user_id);
        
        CREATE POLICY clinics_update_super_admin_policy ON public.clinics
        FOR UPDATE USING (
          EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'super_admin'
          )
        );
      `
    });
    
    // 5. Enable RLS on all tables
    await adminClient.rpc('exec', {
      sql: `
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.clinic_staff ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
      `
    });
    
    // 6. Test the policies by querying as the clinic owner
    const { data: testUser, error: testError } = await adminClient
      .from('users')
      .select('id, email, role, clinic_id')
      .eq('email', 'clinic.owner@bntest.com')
      .single();
    
    const { data: testStaff, error: staffError } = await adminClient
      .from('clinic_staff')
      .select('role, clinic_id, is_active')
      .eq('user_id', testUser?.id)
      .eq('is_active', true).limit(1).maybeSingle();
    
    const { data: testClinic, error: clinicError } = await adminClient
      .from('clinics')
      .select('id, display_name, owner_user_id')
      .eq('id', testStaff?.clinic_id)
      .single();
    
    return Response.json({ 
      success: true,
      message: 'RLS policies fixed completely',
      testResults: {
        user: testUser,
        staff: testStaff,
        clinic: testClinic,
        errors: { testError, staffError, clinicError }
      }
    });
    
  } catch (err) {
    console.error('Complete RLS fix error:', err);
    return Response.json({ 
      error: err instanceof Error ? err.message : 'Unknown error',
      details: err
    }, { status: 500 });
  }
}
