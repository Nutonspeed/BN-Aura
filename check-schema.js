// Check schema of tables
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  try {
    console.log('Checking treatments schema...');
    const { data: treatmentsColumns, error: treatmentsError } = await supabase
      .from('treatments')
      .select('*')
      .limit(1);

    if (treatmentsError) {
      console.error('Treatments error:', treatmentsError);
    } else {
      console.log('Treatments columns:', Object.keys(treatmentsColumns[0] || {}));
    }

    console.log('\nChecking customers schema...');
    const { data: customersColumns, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .limit(1);

    if (customersError) {
      console.error('Customers error:', customersError);
    } else {
      console.log('Customers columns:', Object.keys(customersColumns[0] || {}));
    }

    console.log('\nChecking skin_analyses schema...');
    const { data: analysesColumns, error: analysesError } = await supabase
      .from('skin_analyses')
      .select('*')
      .limit(1);

    if (analysesError) {
      console.error('Skin analyses error:', analysesError);
    } else {
      console.log('Skin analyses columns:', Object.keys(analysesColumns[0] || {}));
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkSchema();
