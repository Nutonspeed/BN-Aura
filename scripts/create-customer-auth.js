// Script to create customer auth user for E2E testing
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://royeyoxaaieipdajijni.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_KEY environment variable is required')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createCustomerAuthUser() {
  try {
    // Create auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'success@test.com',
      password: 'CustomerTest123!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Customer Success Test'
      }
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return
    }

    console.log('Auth user created:', authUser.user.id, authUser.user.email)

    // Create public user record
    const { data: publicUser, error: publicError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        email: authUser.user.email,
        full_name: 'Customer Success Test',
        role: 'premium_customer',
        clinic_id: 'd7f16e29-aebb-4faa-98f3-b6427562f655'
      })
      .select()
      .single()

    if (publicError) {
      console.error('Error creating public user:', publicError)
      return
    }

    console.log('Public user created:', publicUser.id)

    // Link existing customer record to auth user
    const { data: updatedCustomer, error: updateError } = await supabase
      .from('customers')
      .update({
        user_id: authUser.user.id
      })
      .eq('email', 'success@test.com')
      .select()
      .single()

    if (updateError) {
      console.error('Error linking customer:', updateError)
      return
    }

    console.log('Customer linked successfully:', updatedCustomer.id)
    console.log('\nCustomer login credentials:')
    console.log('Email: success@test.com')
    console.log('Password: CustomerTest123!')

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

createCustomerAuthUser()
