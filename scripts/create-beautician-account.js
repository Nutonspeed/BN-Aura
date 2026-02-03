// Create Beautician Test Account
// สร้างบัญชี beautician สำหรับทดสอบ

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

async function createBeauticianAccount() {
  try {
    console.log('Creating beautician test account...');
    
    // 1. Create user in auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'beautician.test@bn-aura.com',
      password: 'test123456',
      email_confirm: true,
      user_metadata: {
        full_name: 'ทดสอบ บิวติเชียน',
        role: 'beautician'
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
        email: 'beautician.test@bn-aura.com',
        full_name: 'ทดสอบ บิวติเชียน',
        role: 'premium_customer', // beauticians are premium customers
        tier: 'clinical'
      });

    if (userError) {
      console.error('Error creating user entry:', userError);
      return;
    }

    console.log('✅ User entry created');

    // 3. Add to clinic_staff table
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
        role: 'beautician',
        is_active: true,
        created_by: authData.user.id
      });

    if (staffError) {
      console.error('Error creating clinic staff entry:', staffError);
      return;
    }

    console.log('✅ Clinic staff entry created');
    console.log('🎉 Beautician account created successfully!');
    console.log('Email: beautician.test@bn-aura.com');
    console.log('Password: test123456');
    console.log('Clinic ID:', clinicData.id);

  } catch (error) {
    console.error('Error:', error);
  }
}

createBeauticianAccount();
