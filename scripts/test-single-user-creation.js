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

async function testSingleUserCreation() {
  console.log('🧪 Testing Single User Creation...')

  // Get a valid clinic ID from recent test clinics
  const { data: testClinics } = await supabase
    .from('clinics')
    .select('id, clinic_code, display_name')
    .contains('metadata', { test_clinic: true })
    .limit(1)
    .order('created_at', { ascending: false })

  if (!testClinics || testClinics.length === 0) {
    console.error('❌ No test clinics found')
    return
  }

  const testClinic = testClinics[0]
  console.log(`✅ Using test clinic: ${testClinic.clinic_code}`)
  console.log(`   ID: ${testClinic.id}`)

  // Test 1: Create clinic admin (owner)
  console.log('\n🧪 Test 1: Creating clinic admin...')
  try {
    const adminData = {
      email: `test.admin.${Date.now()}@example.com`,
      full_name: 'Test Clinic Admin',
      role: 'clinic_admin',
      tier: 'clinical',
      clinic_id: testClinic.id,
      is_active: true,
      metadata: {
        test_user: true,
        clinic_role: 'admin'
      }
    }

    console.log('📝 Admin data:', JSON.stringify(adminData, null, 2))

    const { data: admin, error: adminError } = await supabase
      .from('users')
      .insert(adminData)
      .select()
      .single()

    if (adminError) {
      console.error('❌ Admin creation failed:', adminError)
    } else {
      console.log('✅ Admin created successfully:', admin.id)
    }
  } catch (e) {
    console.error('❌ Admin creation error:', e.message)
  }

  // Test 2: Create clinic staff
  console.log('\n🧪 Test 2: Creating clinic staff...')
  try {
    const staffData = {
      email: `test.staff.${Date.now()}@example.com`,
      full_name: 'Test Clinic Staff',
      role: 'clinic_staff',
      tier: 'clinical',
      clinic_id: testClinic.id,
      is_active: true,
      metadata: {
        test_user: true,
        clinic_role: 'staff'
      }
    }

    console.log('📝 Staff data:', JSON.stringify(staffData, null, 2))

    const { data: staff, error: staffError } = await supabase
      .from('users')
      .insert(staffData)
      .select()
      .single()

    if (staffError) {
      console.error('❌ Staff creation failed:', staffError)
    } else {
      console.log('✅ Staff created successfully:', staff.id)
    }
  } catch (e) {
    console.error('❌ Staff creation error:', e.message)
  }

  // Test 3: Create free user (customer)
  console.log('\n🧪 Test 3: Creating free user...')
  try {
    const customerData = {
      email: `test.customer.${Date.now()}@example.com`,
      full_name: 'Test Customer',
      role: 'free_user',
      tier: 'free',
      clinic_id: testClinic.id,
      is_active: true,
      metadata: {
        test_user: true,
        clinic_role: 'customer'
      }
    }

    console.log('📝 Customer data:', JSON.stringify(customerData, null, 2))

    const { data: customer, error: customerError } = await supabase
      .from('users')
      .insert(customerData)
      .select()
      .single()

    if (customerError) {
      console.error('❌ Customer creation failed:', customerError)
    } else {
      console.log('✅ Customer created successfully:', customer.id)
    }
  } catch (e) {
    console.error('❌ Customer creation error:', e.message)
  }

  // Test 4: Check possible role enums
  console.log('\n🧪 Test 4: Testing different role values...')
  const rolesToTest = ['user', 'customer', 'clinic_user', 'patient']
  
  for (const roleTest of rolesToTest) {
    try {
      const testData = {
        email: `test.role.${roleTest}.${Date.now()}@example.com`,
        full_name: `Test ${roleTest}`,
        role: roleTest,
        tier: 'free',
        clinic_id: testClinic.id,
        is_active: true,
        metadata: { test_user: true, role_test: roleTest }
      }

      const { data: roleUser, error: roleError } = await supabase
        .from('users')
        .insert(testData)
        .select()
        .single()

      if (roleError) {
        console.log(`❌ Role '${roleTest}' failed:`, roleError.message)
      } else {
        console.log(`✅ Role '${roleTest}' succeeded:`, roleUser.id)
        // Clean up successful test
        await supabase.from('users').delete().eq('id', roleUser.id)
      }
    } catch (e) {
      console.log(`❌ Role '${roleTest}' error:`, e.message)
    }
  }

  console.log('\n🏁 Single user creation testing complete')
}

testSingleUserCreation().catch(console.error)
