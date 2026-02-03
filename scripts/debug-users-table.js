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

async function debugUsersTable() {
  console.log('🔍 Debugging Users Table Schema...')

  // 1. Check existing users structure
  console.log('\n1️⃣ Checking existing users...')
  const { data: existingUsers, error: usersError } = await supabase
    .from('users')
    .select('*')
    .limit(3)
  
  if (usersError) {
    console.error('❌ Failed to fetch users:', usersError)
    return
  }
  
  console.log(`✅ Found ${existingUsers.length} existing users`)
  if (existingUsers.length > 0) {
    console.log('📋 Sample user structure:', JSON.stringify(existingUsers[0], null, 2))
  }

  // 2. Test minimal user creation
  console.log('\n2️⃣ Testing minimal user creation...')
  try {
    const minimalUserData = {
      email: 'test.minimal@example.com',
      full_name: 'Test Minimal User'
    }
    
    console.log('📝 Minimal user data:', JSON.stringify(minimalUserData, null, 2))
    
    const { data: minimalUser, error: minimalError } = await supabase
      .from('users')
      .insert(minimalUserData)
      .select()
    
    if (minimalError) {
      console.error('❌ Minimal user creation failed:', minimalError)
    } else {
      console.log('✅ Minimal user creation succeeded:', minimalUser[0]?.id)
      // Cleanup
      await supabase.from('users').delete().eq('email', 'test.minimal@example.com')
    }
  } catch (e) {
    console.error('❌ Minimal user test error:', e.message)
  }

  // 3. Test user with role
  console.log('\n3️⃣ Testing user creation with role...')
  try {
    const roleUserData = {
      email: 'test.role@example.com',
      full_name: 'Test Role User',
      role: 'customer'
    }
    
    console.log('📝 Role user data:', JSON.stringify(roleUserData, null, 2))
    
    const { data: roleUser, error: roleError } = await supabase
      .from('users')
      .insert(roleUserData)
      .select()
    
    if (roleError) {
      console.error('❌ Role user creation failed:', roleError)
    } else {
      console.log('✅ Role user creation succeeded:', roleUser[0]?.id)
      // Cleanup
      await supabase.from('users').delete().eq('email', 'test.role@example.com')
    }
  } catch (e) {
    console.error('❌ Role user test error:', e.message)
  }

  // 4. Test user with clinic_id
  console.log('\n4️⃣ Testing user creation with clinic_id...')
  
  // First get a valid clinic ID
  const { data: clinics } = await supabase
    .from('clinics')
    .select('id')
    .limit(1)
  
  if (clinics && clinics.length > 0) {
    const validClinicId = clinics[0].id
    console.log('🏥 Using clinic ID:', validClinicId)
    
    try {
      const clinicUserData = {
        email: 'test.clinic@example.com',
        full_name: 'Test Clinic User',
        role: 'customer',
        clinic_id: validClinicId
      }
      
      console.log('📝 Clinic user data:', JSON.stringify(clinicUserData, null, 2))
      
      const { data: clinicUser, error: clinicError } = await supabase
        .from('users')
        .insert(clinicUserData)
        .select()
      
      if (clinicError) {
        console.error('❌ Clinic user creation failed:', clinicError)
      } else {
        console.log('✅ Clinic user creation succeeded:', clinicUser[0]?.id)
        // Cleanup
        await supabase.from('users').delete().eq('email', 'test.clinic@example.com')
      }
    } catch (e) {
      console.error('❌ Clinic user test error:', e.message)
    }
  }

  // 5. Test clinic_staff table
  console.log('\n5️⃣ Testing clinic_staff table...')
  try {
    const { data: staffData, error: staffError } = await supabase
      .from('clinic_staff')
      .select('*')
      .limit(3)
    
    if (staffError) {
      console.error('❌ Failed to fetch clinic_staff:', staffError)
    } else {
      console.log(`✅ Found ${staffData.length} clinic staff records`)
      if (staffData.length > 0) {
        console.log('📋 Sample clinic_staff structure:', JSON.stringify(staffData[0], null, 2))
      }
    }
  } catch (e) {
    console.error('❌ Clinic staff test error:', e.message)
  }

  console.log('\n🏁 Users table debugging complete')
}

debugUsersTable().catch(console.error)
