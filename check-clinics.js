// Check what clinics exist
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkClinics() {
  try {
    const { data: clinics, error } = await supabase
      .from('clinics')
      .select('id, display_name')
      .limit(10);

    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Found clinics:');
      clinics.forEach((clinic, index) => {
        console.log(`${index + 1}. ID: ${clinic.id}`);
        console.log(`   Display: ${JSON.stringify(clinic.display_name)}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkClinics();
