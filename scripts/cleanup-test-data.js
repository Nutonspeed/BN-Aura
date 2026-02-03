import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://royeyoxaaieipdajijni.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJveWV5b3hhYWllaXBkYWppam5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTcyNzg5OSwiZXhwIjoyMDg1MzAzODk5fQ.NNe4He141lIW7iYcE9d-sKKMqrkeGGfVxXSnPDFBLuc',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...')

  try {
    // 1. Delete test users
    console.log('\n1️⃣ Deleting test users...')
    const { data: testUsers, error: getUsersError } = await supabase
      .from('users')
      .select('id, email, metadata')
      .contains('metadata', { test_user: true })
    
    if (getUsersError) {
      console.error('❌ Error fetching test users:', getUsersError)
    } else {
      console.log(`📊 Found ${testUsers.length} test users to delete`)
      
      for (const user of testUsers) {
        console.log(`🗑️ Deleting user: ${user.email}`)
        const { error: deleteUserError } = await supabase
          .from('users')
          .delete()
          .eq('id', user.id)
        
        if (deleteUserError) {
          console.error(`❌ Error deleting user ${user.email}:`, deleteUserError)
        }
      }
    }

    // 2. Delete test clinic_staff records  
    console.log('\n2️⃣ Deleting test clinic_staff records...')
    const { data: testClinicIds } = await supabase
      .from('clinics')
      .select('id')
      .contains('metadata', { test_clinic: true })
    
    if (testClinicIds && testClinicIds.length > 0) {
      const clinicIds = testClinicIds.map(c => c.id)
      const { error: deleteStaffError } = await supabase
        .from('clinic_staff')
        .delete()
        .in('clinic_id', clinicIds)
      
      if (deleteStaffError) {
        console.error('❌ Error deleting clinic_staff:', deleteStaffError)
      } else {
        console.log('✅ Test clinic_staff records deleted')
      }
    }

    // 3. Delete test customers records
    console.log('\n3️⃣ Deleting test customers records...')
    const { error: deleteCustomersError } = await supabase
      .from('customers')
      .delete()
      .in('clinic_id', 
        supabase
          .from('clinics')
          .select('id')
          .contains('metadata', { test_clinic: true })
      )
    
    if (deleteCustomersError) {
      console.error('❌ Error deleting customers:', deleteCustomersError)
    } else {
      console.log('✅ Test customers records deleted')
    }

    // 4. Delete test clinics
    console.log('\n4️⃣ Deleting test clinics...')
    const { data: testClinics, error: getClinicsError } = await supabase
      .from('clinics')
      .select('id, clinic_code, display_name, metadata')
      .contains('metadata', { test_clinic: true })
    
    if (getClinicsError) {
      console.error('❌ Error fetching test clinics:', getClinicsError)
    } else {
      console.log(`📊 Found ${testClinics.length} test clinics to delete`)
      
      for (const clinic of testClinics) {
        console.log(`🗑️ Deleting clinic: ${clinic.clinic_code} - ${clinic.display_name?.en}`)
        const { error: deleteClinicError } = await supabase
          .from('clinics')
          .delete()
          .eq('id', clinic.id)
        
        if (deleteClinicError) {
          console.error(`❌ Error deleting clinic ${clinic.clinic_code}:`, deleteClinicError)
        }
      }
    }

    console.log('\n✅ Test data cleanup completed!')
    
  } catch (error) {
    console.error('❌ Cleanup error:', error)
  }
}

cleanupTestData().catch(console.error)
