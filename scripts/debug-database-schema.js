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

async function debugDatabaseSchema() {
  console.log('🔍 Debugging Database Schema...')

  // 1. Test basic connection
  console.log('\n1️⃣ Testing basic connection...')
  const { data, error } = await supabase.from('clinics').select('*').limit(5)
  
  if (error) {
    console.error('❌ Basic connection failed:', error)
    return
  }
  
  console.log(`✅ Connection successful. Found ${data.length} existing clinics`)
  if (data.length > 0) {
    console.log('📋 Sample clinic structure:', JSON.stringify(data[0], null, 2))
  }

  // 2. Check clinics table schema
  console.log('\n2️⃣ Checking clinics table schema...')
  try {
    const { data: schemaTest, error: schemaError } = await supabase
      .from('clinics')
      .insert({
        id: 'schema-test-clinic-001',
        display_name: 'Schema Test Clinic',
        status: 'active'
      })
      .select()
    
    if (schemaError) {
      console.error('❌ Clinics schema test failed:', schemaError)
    } else {
      console.log('✅ Clinics table schema test passed')
      // Clean up test record
      await supabase.from('clinics').delete().eq('id', 'schema-test-clinic-001')
    }
  } catch (e) {
    console.error('❌ Clinics schema test error:', e.message)
  }

  // 3. Check users table schema  
  console.log('\n3️⃣ Checking users table schema...')
  try {
    const { data: userTest, error: userError } = await supabase
      .from('users')
      .insert({
        id: 'schema-test-user-001',
        email: 'schema.test@example.com',
        full_name: 'Schema Test User',
        role: 'customer'
      })
      .select()
    
    if (userError) {
      console.error('❌ Users schema test failed:', userError)
    } else {
      console.log('✅ Users table schema test passed')
      // Clean up test record
      await supabase.from('users').delete().eq('id', 'schema-test-user-001')
    }
  } catch (e) {
    console.error('❌ Users schema test error:', e.message)
  }

  // 4. List all available tables
  console.log('\n4️⃣ Listing available tables...')
  try {
    const { data: tablesQuery } = await supabase
      .rpc('get_table_names') // This might not work, but worth trying
      .select()
    
    if (tablesQuery) {
      console.log('📋 Available tables:', tablesQuery)
    }
  } catch (e) {
    console.log('ℹ️ Could not list tables via RPC, trying alternative...')
  }

  // 5. Test specific problematic fields
  console.log('\n5️⃣ Testing specific field combinations...')
  
  // Test clinic creation with minimal data
  try {
    const { data: minimalClinic, error: minimalError } = await supabase
      .from('clinics')
      .insert({
        id: 'minimal-test-001',
        display_name: 'Minimal Test'
      })
      .select()
    
    if (minimalError) {
      console.error('❌ Minimal clinic creation failed:', minimalError)
    } else {
      console.log('✅ Minimal clinic creation succeeded')
      await supabase.from('clinics').delete().eq('id', 'minimal-test-001')
    }
  } catch (e) {
    console.error('❌ Minimal clinic test error:', e.message)
  }

  console.log('\n🏁 Database schema debugging complete')
}

debugDatabaseSchema().catch(console.error)
