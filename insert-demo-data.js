// Insert demo data using Supabase client
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertDemoData() {
  try {
    console.log('Starting demo data insertion...');

    // Use BN Aura Siam clinic
    const clinicId = 'bfa8d635-4a54-40b7-bb69-dd3ab4c99a3d';
    console.log('Using clinic ID:', clinicId, 'BN Aura Siam');

    // Insert treatments (using 'names' instead of 'description')
    const treatments = [
      {
        clinic_id: clinicId,
        names: {
          th: 'Hyaluronic Acid Filler',
          en: 'Hyaluronic Acid Filler'
        },
        category: 'injectable',
        price_min: 12000,
        price_max: 18000,
        is_active: true
      },
      {
        clinic_id: clinicId,
        names: {
          th: 'CO2 Fractional Laser',
          en: 'CO2 Fractional Laser'
        },
        category: 'laser',
        price_min: 8000,
        price_max: 12000,
        is_active: true
      },
      {
        clinic_id: clinicId,
        names: {
          th: 'HydraFacial MD',
          en: 'HydraFacial MD'
        },
        category: 'facial',
        price_min: 3500,
        price_max: 4500,
        is_active: true
      },
      {
        clinic_id: clinicId,
        names: {
          th: 'Botox Injections',
          en: 'Botox Injections'
        },
        category: 'injectable',
        price_min: 6000,
        price_max: 10000,
        is_active: true
      },
      {
        clinic_id: clinicId,
        names: {
          th: 'Microneedling',
          en: 'Microneedling'
        },
        category: 'laser',
        price_min: 4000,
        price_max: 6000,
        is_active: true
      }
    ];

    console.log('Inserting treatments...');
    const { data: insertedTreatments, error: treatmentError } = await supabase
      .from('treatments')
      .insert(treatments)
      .select();

    if (treatmentError) {
      console.error('Treatment insertion error:', treatmentError);
    } else {
      console.log(`Inserted ${insertedTreatments?.length || 0} treatments`);
    }

    // Insert customers (using date_of_birth instead of age)
    const customers = [
      {
        clinic_id: clinicId,
        full_name: 'สมหวัง ทดสอบ',
        email: 'newcust@bnaura.com',
        phone: '0812345678',
        date_of_birth: '1989-02-18', // 35 years old
        gender: 'female',
        skin_concerns: ['ริ้วรอย', 'รูขุมขนใหญ่', 'ความชุ่มชื้นต่ำ']
      },
      {
        clinic_id: clinicId,
        full_name: 'พิมพ์ ผิวดี',
        email: 'cust3@bnaura.com',
        phone: '0823456789',
        date_of_birth: '1996-02-18', // 28 years old
        gender: 'female',
        skin_concerns: ['ริ้วรอยเล็กน้อย']
      },
      {
        clinic_id: clinicId,
        full_name: 'สมชาย หล่อเลย',
        email: 'cust2@bnaura.com',
        phone: '0834567890',
        date_of_birth: '1992-02-18', // 32 years old
        gender: 'male',
        skin_concerns: ['ความมันมาก', 'รูขุมขน']
      }
    ];

    console.log('Inserting customers...');
    const { data: insertedCustomers, error: customerError } = await supabase
      .from('customers')
      .insert(customers)
      .select();

    if (customerError) {
      console.error('Customer insertion error:', customerError);
    } else {
      console.log(`Inserted ${insertedCustomers?.length || 0} customers`);
    }

    // Insert skin analyses (using correct schema)
    if (insertedCustomers && insertedCustomers.length > 0) {
      const skinAnalyses = [
        {
          clinic_id: clinicId,
          customer_id: insertedCustomers[0].id,
          image_url: 'https://example.com/skin-analysis-1.jpg',
          overall_score: 78,
          skin_age: 28,
          actual_age: 35,
          skin_type: 'ผิวผสม',
          confidence_score: 0.95,
          recommendations: ['Hyaluronic Acid Filler', 'HydraFacial MD', 'Moisturizer'],
          analyzed_at: new Date().toISOString()
        },
        {
          clinic_id: clinicId,
          customer_id: insertedCustomers[1].id,
          image_url: 'https://example.com/skin-analysis-2.jpg',
          overall_score: 85,
          skin_age: 25,
          actual_age: 28,
          skin_type: 'ผิวปกติ',
          confidence_score: 0.92,
          recommendations: ['Botox Injections', 'Preventive care'],
          analyzed_at: new Date().toISOString()
        }
      ];

      console.log('Inserting skin analyses...');
      const { data: insertedAnalyses, error: analysisError } = await supabase
        .from('skin_analyses')
        .insert(skinAnalyses)
        .select();

      if (analysisError) {
        console.error('Skin analysis insertion error:', analysisError);
      } else {
        console.log(`Inserted ${insertedAnalyses?.length || 0} skin analyses`);
      }
    }

    console.log('Demo data insertion completed! ✅');

  } catch (error) {
    console.error('Error inserting demo data:', error);
  }
}

insertDemoData();
