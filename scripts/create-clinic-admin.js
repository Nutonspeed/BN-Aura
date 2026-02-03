// Create Clinic Admin Test Account
const { createClient } = require('@supabase/supabase-js');

// Get credentials from environment or use defaults
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://royeyoxaaieipdajijni.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJveWVveGFhaWVpcGRhamlqbmkiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczODI3MjUzOSwiZXhwIjoyMDUzODQ4NTM5fQ.qhzp3B8YjQqGdfRqUv8gN2H_VsTfNRp5I0hJpAqgZxY';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createClinicAdmin() {
  try {
    console.log('Creating clinic admin test account...');
    
    // 1. Create user in auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'clinicadmin2024@10minutemail.com',
      password: 'Test1234!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Clinic Admin Test',
        role: 'clinic_owner'
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return;
    }

    console.log('✅ Auth user created:', authData.user.id);

    // 2. Create user entry in users table
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: 'clinicadmin2024@10minutemail.com',
        full_name: 'Clinic Admin Test',
        role: 'clinic_owner',
        tier: 'professional'
      });

    if (userError) {
      console.error('Error creating user entry:', userError);
      return;
    }

    console.log('✅ User entry created');

    // 3. Add to clinic_staff table as clinic owner
    // Use the first clinic as default
    const { data: clinicData } = await supabase
      .from('clinics')
      .select('id')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (!clinicData) {
      console.error('No active clinic found');
      return;
    }

    const { error: staffError } = await supabase
      .from('clinic_staff')
      .insert({
        clinic_id: clinicData.id,
        user_id: authData.user.id,
        role: 'clinic_owner',
        is_active: true,
        created_by: authData.user.id
      });

    if (staffError) {
      console.error('Error creating clinic staff entry:', staffError);
      return;
    }

    console.log('✅ Clinic staff entry created');
    console.log('🎉 Clinic admin account created successfully!');
    console.log('Email: clinicadmin2024@10minutemail.com');
    console.log('Password: Test1234!');
    console.log('Clinic ID:', clinicData.id);

  } catch (error) {
    console.error('Error:', error);
  }
}

createClinicAdmin();
