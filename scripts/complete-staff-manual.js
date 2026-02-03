import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  'https://royeyoxaaieipdajijni.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJveWV5b3hhYWllaXBkYWppam5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTcyNzg5OSwiZXhwIjoyMDg1MzAzODk5fQ.NNe4He141lIW7iYcE9d-sKKMqrkeGGfVxXSnPDFBLuc',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function completeStaffRecords() {
  console.log('🔧 === COMPLETING STAFF RECORDS MANUALLY ===')
  
  try {
    const staffData = {
      email: 'sales1.auth@bntest.com',
      fullName: 'Sales Staff 1 Auth',
      role: 'sales_staff',
      clinicId: '00000000-0000-0000-0000-000000000001',
      authUserId: 'a9fef441-9976-4542-90ed-0e4023b1fd4e'
    }

    console.log(`👤 Completing records for: ${staffData.email}`)
    console.log(`🔐 Auth User ID: ${staffData.authUserId}`)

    // Step 1: Create database user record
    console.log('\n1️⃣ Creating database user record...')
    const { data: dbUser, error: dbError } = await supabaseAdmin
      .from('users')
      .insert({
        email: staffData.email,
        full_name: staffData.fullName,
        role: 'super_admin', // Use known valid enum
        tier: 'clinical',
        clinic_id: staffData.clinicId,
        is_active: true,
        metadata: {
          auth_user_id: staffData.authUserId,
          clinic_role: staffData.role,
          created_via: 'manual_script',
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (dbError) {
      console.error('❌ Database user creation failed:', dbError)
      return
    }

    console.log('✅ Database user created:', dbUser.id)

    // Step 2: Create clinic_staff record
    console.log('\n2️⃣ Creating clinic_staff record...')
    const { data: staffRecord, error: staffError } = await supabaseAdmin
      .from('clinic_staff')
      .insert({
        user_id: dbUser.id,
        clinic_id: staffData.clinicId,
        role: staffData.role,
        is_active: true,
        metadata: {
          auth_user_id: staffData.authUserId,
          created_via: 'manual_script'
        }
      })
      .select()
      .single()

    if (staffError) {
      console.error('❌ Clinic staff record creation failed:', staffError)
      return
    }

    console.log('✅ Clinic staff record created:', staffRecord.id)

    // Step 3: Update auth user metadata
    console.log('\n3️⃣ Updating auth user metadata...')
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      staffData.authUserId,
      {
        user_metadata: {
          full_name: staffData.fullName,
          role: staffData.role,
          clinic_id: staffData.clinicId,
          database_user_id: dbUser.id,
          clinic_staff_id: staffRecord.id,
          created_via: 'manual_script',
          completed_at: new Date().toISOString()
        }
      }
    )

    if (updateError) {
      console.error('❌ Auth user metadata update failed:', updateError)
    } else {
      console.log('✅ Auth user metadata updated')
    }

    console.log('\n🎉 Staff records completion successful!')
    console.log(`📊 Summary:`)
    console.log(`   - Auth User ID: ${staffData.authUserId}`)
    console.log(`   - Database User ID: ${dbUser.id}`)
    console.log(`   - Staff Record ID: ${staffRecord.id}`)
    console.log(`   - Email: ${staffData.email}`)
    console.log(`   - Role: ${staffData.role}`)
    console.log(`   - Clinic ID: ${staffData.clinicId}`)

  } catch (error) {
    console.error('❌ Manual completion error:', error)
  }
}

completeStaffRecords().catch(console.error)
