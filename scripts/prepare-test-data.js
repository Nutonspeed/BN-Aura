// 📋 BN-Aura Test Data Preparation Script
// เตรียมข้อมูลจริงสำหรับทดสอบ dashboard ทั้งหมด

const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const supabaseUrl = 'https://royeyoxaaieipdajijni.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJveWVveGFhaWVpcGRhamlqbmkiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczODI3MjUzOSwiZXhwIjoyMDUzODQ4NTM5fQ.qhzp3B8YjQqGdfRqUv8gN2H_VsTfNRp5I0hJpAqgZxY';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// ข้อมูลจริงสำหรับทดสอบ
const SAMPLE_DATA = {
  // Products for POS System
  products: [
    {
      name: 'HydraFacial Plus',
      description: 'Advanced hydration treatment with serum infusion',
      category: 'treatment',
      price: 4500,
      duration: 60,
      image_url: '/images/treatments/hydrafacial.jpg'
    },
    {
      name: 'Vitamin C Brightening',
      description: 'Powerful vitamin C infusion for radiant skin',
      category: 'treatment', 
      price: 2450,
      duration: 45,
      image_url: '/images/treatments/vitamin-c.jpg'
    },
    {
      name: 'Collagen Boost Therapy',
      description: 'Deep collagen stimulation for youthful skin',
      category: 'treatment',
      price: 3800,
      duration: 75,
      image_url: '/images/treatments/collagen.jpg'
    },
    {
      name: 'BN-Aura Serum Set',
      description: 'Complete skincare serum collection',
      category: 'product',
      price: 1250,
      stock_quantity: 50,
      image_url: '/images/products/serum-set.jpg'
    },
    {
      name: 'Daily Moisturizer',
      description: 'Lightweight daily hydration moisturizer',
      category: 'product',
      price: 450,
      stock_quantity: 100,
      image_url: '/images/products/moisturizer.jpg'
    }
  ],

  // Customers for Customer Dashboard
  customers: [
    {
      full_name: 'สมศรี ใจดี',
      nickname: 'มดี',
      phone: '0812345678',
      email: 'somsri.customer@email.com',
      tier: 'premium'
    },
    {
      full_name: 'มาลี ศรีสุข',
      nickname: 'มาลี',
      phone: '0823456789',
      email: 'mali.customer@email.com',
      tier: 'premium'
    },
    {
      full_name: 'นัทธยา มงคล',
      nickname: 'นัท',
      phone: '0834567890',
      email: 'nattaya.customer@email.com',
      tier: 'premium'
    }
  ],

  // Treatments for Beautician Dashboard
  treatments: [
    {
      name: 'HydraFacial Plus',
      description: 'Advanced hydration with serum infusion',
      duration: 60,
      price: 4500,
      category: 'facial'
    },
    {
      name: 'Vitamin C Brightening',
      description: 'Brightening and antioxidant treatment',
      duration: 45,
      price: 2450,
      category: 'facial'
    },
    {
      name: 'Collagen Boost Therapy',
      description: 'Anti-aging collagen stimulation',
      duration: 75,
      price: 3800,
      category: 'anti-aging'
    }
  ],

  // Appointments for testing
  appointments: [
    {
      appointment_date: '2026-02-03',
      start_time: '09:00:00',
      end_time: '10:00:00',
      status: 'confirmed',
      appointment_type: 'consultation'
    },
    {
      appointment_date: '2026-02-03',
      start_time: '10:30:00',
      end_time: '11:30:00',
      status: 'scheduled',
      appointment_type: 'treatment'
    },
    {
      appointment_date: '2026-02-03',
      start_time: '14:00:00',
      end_time: '15:30:00',
      status: 'confirmed',
      appointment_type: 'treatment'
    }
  ]
};

// Clinic ID ของ clinic ที่เรากำลัง login อยู่
const CLINIC_ID = 'f3569c4b-6398-4167-85f9-e4c5740b25e3'; // BN Test Clinic สาขาใหม่

async function prepareTestData() {
  console.log('🚀 Starting BN-Aura Test Data Preparation...');
  
  try {
    // 1. เตรียม Products สำหรับ POS System
    console.log('📦 Preparing Products...');
    await prepareProducts();
    
    // 2. เตรียม Customers สำหรับ Customer Dashboard
    console.log('👥 Preparing Customers...');
    await prepareCustomers();
    
    // 3. เตรียม Treatments สำหรับ Beautician Dashboard
    console.log('💆 Preparing Treatments...');
    await prepareTreatments();
    
    // 4. เตรียม Appointments สำหรับ Appointment Management
    console.log('📅 Preparing Appointments...');
    await prepareAppointments();
    
    // 5. เตรียม Loyalty Data สำหรับ Customer Dashboard
    console.log('⭐ Preparing Loyalty Data...');
    await prepareLoyaltyData();
    
    // 6. เตรียม POS Transactions สำหรับ POS System
    console.log('💳 Preparing POS Transactions...');
    await preparePOSTransactions();
    
    console.log('✅ Test Data Preparation Complete!');
    console.log('🎯 Ready to test all dashboards with real data!');
    
  } catch (error) {
    console.error('❌ Error preparing test data:', error);
  }
}

async function prepareProducts() {
  for (const product of SAMPLE_DATA.products) {
    // สร้างใน products table
    const { data: productData, error: productError } = await supabase
      .from('products')
      .upsert({
        name: product.name,
        description: product.description,
        category: product.category,
        base_price: product.price,
        image_url: product.image_url,
        is_active: true,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'name'
      })
      .select('id')
      .single();
    
    if (productError) throw productError;
    
    // สร้างใน inventory_products table
    if (product.category === 'product') {
      await supabase
        .from('inventory_products')
        .upsert({
          clinic_id: CLINIC_ID,
          product_id: productData.id,
          stock_quantity: product.stock_quantity || 50,
          min_stock_level: 10,
          cost_price: product.price * 0.6, // 40% margin
          selling_price: product.price,
          is_active: true,
          created_at: new Date().toISOString()
        }, {
          onConflict: ['clinic_id', 'product_id']
        });
    }
    
    // สร้างใน clinic_treatment_pricing table
    if (product.category === 'treatment') {
      await supabase
        .from('clinic_treatment_pricing')
        .upsert({
          clinic_id: CLINIC_ID,
          treatment_id: productData.id,
          price: product.price,
          duration_minutes: product.duration,
          is_active: true,
          created_at: new Date().toISOString()
        }, {
          onConflict: ['clinic_id', 'treatment_id']
        });
    }
  }
}

async function prepareCustomers() {
  for (const customer of SAMPLE_DATA.customers) {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert({
        email: customer.email,
        full_name: customer.full_name,
        role: 'premium_customer',
        tier: 'premium',
        is_active: true,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'email'
      })
      .select('id')
      .single();
    
    if (userError) throw userError;
    
    // สร้าง customer record
    await supabase
      .from('customers')
      .upsert({
        id: userData.id,
        clinic_id: CLINIC_ID,
        full_name: customer.full_name,
        nickname: customer.nickname,
        phone: customer.phone,
        email: customer.email,
        tier: customer.tier,
        is_active: true,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });
  }
}

async function prepareTreatments() {
  for (const treatment of SAMPLE_DATA.treatments) {
    const { data: treatmentData, error: treatmentError } = await supabase
      .from('treatments')
      .upsert({
        clinic_id: CLINIC_ID,
        name: treatment.name,
        description: treatment.description,
        category: treatment.category,
        duration_minutes: treatment.duration,
        base_price: treatment.price,
        is_active: true,
        created_at: new Date().toISOString()
      }, {
        onConflict: ['clinic_id', 'name']
      })
      .select('id')
      .single();
    
    if (treatmentError) throw treatmentError;
    
    // สร้าง pricing record
    await supabase
      .from('clinic_treatment_pricing')
      .upsert({
        clinic_id: CLINIC_ID,
        treatment_id: treatmentData.id,
        price: treatment.price,
        duration_minutes: treatment.duration,
        is_active: true,
        created_at: new Date().toISOString()
      }, {
        onConflict: ['clinic_id', 'treatment_id']
      });
  }
}

async function prepareAppointments() {
  // ดึง customers และ staff
  const { data: customers } = await supabase
    .from('customers')
    .select('id')
    .eq('clinic_id', CLINIC_ID)
    .limit(3);
  
  const { data: staff } = await supabase
    .from('clinic_staff')
    .select('user_id')
    .eq('clinic_id', CLINIC_ID)
    .eq('role', 'beautician')
    .limit(2);
  
  if (!customers || !staff || customers.length === 0 || staff.length === 0) {
    console.log('⚠️ No customers or staff found, skipping appointments');
    return;
  }
  
  for (let i = 0; i < SAMPLE_DATA.appointments.length; i++) {
    const appointment = SAMPLE_DATA.appointments[i];
    const customer = customers[i % customers.length];
    const staffMember = staff[i % staff.length];
    
    await supabase
      .from('appointments')
      .upsert({
        clinic_id: CLINIC_ID,
        customer_id: customer.id,
        staff_id: staffMember.user_id,
        appointment_code: `APT${Date.now()}${i}`,
        appointment_type: appointment.appointment_type,
        status: appointment.status,
        appointment_date: appointment.appointment_date,
        start_time: appointment.start_time,
        end_time: appointment.end_time,
        duration_minutes: 60,
        total_price: 500,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'appointment_code'
      });
  }
}

async function prepareLoyaltyData() {
  const { data: customers } = await supabase
    .from('customers')
    .select('id')
    .eq('clinic_id', CLINIC_ID);
  
  if (!customers || customers.length === 0) return;
  
  for (const customer of customers) {
    // สร้าง loyalty profile
    await supabase
      .from('loyalty_profiles')
      .upsert({
        clinic_id: CLINIC_ID,
        customer_id: customer.id,
        tier: 'silver',
        points_balance: 250,
        total_spent: 5000,
        treatments_completed: 3,
        created_at: new Date().toISOString()
      }, {
        onConflict: ['clinic_id', 'customer_id']
      });
    
    // สร้าง point transactions
    await supabase
      .from('loyalty_points')
      .insert({
        clinic_id: CLINIC_ID,
        customer_id: customer.id,
        points: 100,
        transaction_type: 'earned',
        reference_type: 'treatment',
        description: 'HydraFacial Plus treatment',
        created_at: new Date().toISOString()
      });
  }
}

async function preparePOSTransactions() {
  const { data: products } = await supabase
    .from('products')
    .select('id, name, base_price')
    .limit(5);
  
  if (!products || products.length === 0) return;
  
  // สร้าง sample POS transactions
  for (let i = 0; i < 5; i++) {
    const product = products[i % products.length];
    
    await supabase
      .from('pos_transactions')
      .insert({
        clinic_id: CLINIC_ID,
        transaction_code: `POS${Date.now()}${i}`,
        status: 'completed',
        total_amount: product.base_price,
        payment_method: 'cash',
        items: [{
          product_id: product.id,
          name: product.name,
          quantity: 1,
          unit_price: product.base_price,
          total_price: product.base_price
        }],
        created_at: new Date().toISOString()
      });
  }
}

// Run the preparation
prepareTestData();
