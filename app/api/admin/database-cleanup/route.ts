// Complete Database Cleanup - Remove all test data except super admin
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST() {
  try {
    const adminClient = createAdminClient();
    
    console.log('🔍 Starting Database Cleanup - Phase 1: Audit');
    
    // 1. Identify Super Admin User
    const { data: superAdmin, error: superAdminError } = await adminClient
      .from('users')
      .select('id, email, role')
      .eq('email', 'nuttapong161@gmail.com')
      .single();
    
    if (superAdminError || !superAdmin) {
      return Response.json({ 
        error: 'Super admin not found - ABORT CLEANUP',
        details: superAdminError 
      }, { status: 404 });
    }
    
    console.log('✅ Super Admin Found:', superAdmin);
    
    // 2. Audit Current Database State
    const auditQueries = [
      { name: 'users', query: 'SELECT COUNT(*) as count FROM users' },
      { name: 'clinics', query: 'SELECT COUNT(*) as count FROM clinics' },
      { name: 'clinic_staff', query: 'SELECT COUNT(*) as count FROM clinic_staff' },
      { name: 'branches', query: 'SELECT COUNT(*) as count FROM branches' },
      { name: 'appointments', query: 'SELECT COUNT(*) as count FROM appointments' },
    ];
    
    const auditResults: Record<string, any> = {};
    for (const audit of auditQueries) {
      try {
        const { data } = await adminClient.rpc('exec', { sql: audit.query });
        auditResults[audit.name] = data?.[0]?.count || 0;
      } catch (err) {
        auditResults[audit.name] = 'ERROR: ' + (err instanceof Error ? err.message : 'Unknown error');
      }
    }
    
    // 3. Identify Test Data for Removal
    const { data: testUsers } = await adminClient
      .from('users')
      .select('id, email, role')
      .neq('email', 'nuttapong161@gmail.com');
    
    const { data: testClinics } = await adminClient
      .from('clinics')
      .select('id, clinic_code, display_name');
    
    const { data: testStaff } = await adminClient
      .from('clinic_staff')
      .select('id, user_id, clinic_id, role');
    
    console.log('🧹 Starting Database Cleanup - Phase 2: Safe Removal');
    
    // 4. Safe Data Removal (in reverse dependency order)
    const deletionResults: Record<string, any> = {};
    
    // Delete clinic_staff records first (foreign key dependencies)
    if (testStaff && testStaff.length > 0) {
      const { error: staffDeleteError } = await adminClient
        .from('clinic_staff')
        .delete()
        .neq('user_id', 'never-match'); // Delete all
      
      deletionResults['clinic_staff'] = staffDeleteError ? 'ERROR: ' + staffDeleteError.message : 'SUCCESS';
    }
    
    // Delete clinics
    if (testClinics && testClinics.length > 0) {
      const { error: clinicsDeleteError } = await adminClient
        .from('clinics')
        .delete()
        .neq('id', 'never-match'); // Delete all
      
      deletionResults['clinics'] = clinicsDeleteError ? 'ERROR: ' + clinicsDeleteError.message : 'SUCCESS';
    }
    
    // Delete test users (preserve super admin)
    if (testUsers && testUsers.length > 0) {
      const { error: usersDeleteError } = await adminClient
        .from('users')
        .delete()
        .neq('email', 'nuttapong161@gmail.com');
      
      deletionResults['users'] = usersDeleteError ? 'ERROR: ' + usersDeleteError.message : 'SUCCESS';
    }
    
    // Delete other test tables
    const tablesToClean = ['appointments', 'customers', 'sales_staff', 'branches'];
    for (const table of tablesToClean) {
      try {
        await adminClient.rpc('exec', { 
          sql: `DELETE FROM ${table} WHERE true;` 
        });
        deletionResults[table] = 'SUCCESS';
      } catch (err) {
        deletionResults[table] = 'ERROR: ' + (err instanceof Error ? err.message : 'Unknown error');
      }
    }
    
    console.log('✅ Database Cleanup - Phase 3: Verification');
    
    // 5. Verify Cleanup Results
    const postCleanupAudit: Record<string, any> = {};
    for (const audit of auditQueries) {
      try {
        const { data } = await adminClient.rpc('exec', { sql: audit.query });
        postCleanupAudit[audit.name] = data?.[0]?.count || 0;
      } catch (err) {
        postCleanupAudit[audit.name] = 'ERROR: ' + (err instanceof Error ? err.message : 'Unknown error');
      }
    }
    
    // 6. Verify Super Admin Still Exists
    const { data: superAdminCheck, error: checkError } = await adminClient
      .from('users')
      .select('id, email, role')
      .eq('email', 'nuttapong161@gmail.com')
      .single();
    
    return Response.json({ 
      success: true,
      message: 'Database cleanup completed',
      superAdmin: superAdminCheck,
      auditResults: {
        before: auditResults,
        after: postCleanupAudit
      },
      deletionResults,
      testDataRemoved: {
        users: testUsers?.length || 0,
        clinics: testClinics?.length || 0,
        staff: testStaff?.length || 0
      }
    });
    
  } catch (err) {
    console.error('Database cleanup error:', err);
    return Response.json({ 
      error: err instanceof Error ? err.message : 'Unknown error',
      details: err
    }, { status: 500 });
  }
}
