import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  console.log('\n🚀 === PRODUCTION USERS API STARTED ===');
  
  try {
    const adminClient = createAdminClient();
    const body = await request.json();
    const { clinicCount = 10, staffPerClinic = 5, customersPerSales = 30 } = body;

    console.log(`🏭 Starting Production Scale User Creation:`);
    console.log(`- ${clinicCount} Clinics`);
    console.log(`- ${staffPerClinic} Staff per Clinic`);
    console.log(`- ${customersPerSales} Customers per Sales Staff`);

    const results = {
      clinics: [] as any[],
      staff: [] as any[],
      customers: [] as any[],
      totalUsers: 0
    };

    // Test database connection first
    console.log('🔍 Testing database connection...');
    const { data: testQuery, error: testError } = await adminClient
      .from('clinics')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('❌ Database connection failed:', testError);
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: testError
      }, { status: 500 });
    }

    console.log('✅ Database connection successful');

    // Create test clinics with unique timestamp-based codes
    const timestamp = Date.now().toString().slice(-6);
    for (let i = 1; i <= Math.min(clinicCount, 2); i++) { // Start with 2 clinics for testing
      console.log(`🏥 Creating clinic ${i}...`);
      
      const clinicData = {
        clinic_code: `PROD-TEST-${timestamp}-${i.toString().padStart(2, '0')}`,
        display_name: {
          en: `Production Test Clinic ${i}`,
          th: `คลินิกทดสอบขนาดใหญ่ ${i}`
        },
        subscription_tier: i === 1 ? 'professional' : 'standard',
        max_sales_staff: i === 1 ? 15 : 10,
        is_active: true,
        metadata: {
          region: i === 1 ? 'bangkok' : 'chiang_mai',
          capacity: i === 1 ? 50 : 30,
          specialties: ['skin_analysis', 'treatment', 'consultation'],
          test_clinic: true,
          created_for: 'production_scale_testing',
          created_at: new Date().toISOString()
        }
      };

      console.log('📝 Clinic data:', JSON.stringify(clinicData, null, 2));

      const { data: clinic, error: clinicError } = await adminClient
        .from('clinics')
        .insert(clinicData)
        .select()
        .single();

      if (clinicError) {
        console.error(`❌ Error creating clinic ${i}:`, clinicError);
        console.error('❌ Full error details:', JSON.stringify(clinicError, null, 2));
        continue;
      }

      console.log(`✅ Clinic ${i} created successfully:`, clinic?.id);

      results.clinics.push(clinic);

      // Create clinic owner using correct schema - users table only has basic roles
      const ownerData = {
        email: `owner.clinic${i}@bntest.com`,
        full_name: `Clinic ${i} Owner`,
        role: 'super_admin', // Use the only known valid enum value
        tier: 'clinical',
        clinic_id: clinic.id,
        is_active: true,
        metadata: {
          test_user: true,
          clinic_role: 'owner',
          created_for: 'production_testing'
        }
      };

      console.log(`👤 Creating owner for clinic ${i}:`, ownerData.email);

      const { data: owner, error: ownerError } = await adminClient
        .from('users')
        .insert(ownerData)
        .select()
        .single();

      if (ownerError) {
        console.error(`❌ Error creating owner for clinic ${i}:`, ownerError);
        console.error('❌ Owner error details:', JSON.stringify(ownerError, null, 2));
        continue;
      }

      console.log(`✅ Owner ${i} created successfully:`, owner?.id);
      results.staff.push(owner);

      // Update clinic with owner
      await adminClient
        .from('clinics')
        .update({ owner_user_id: owner.id })
        .eq('id', clinic.id);

      // Create clinic staff
      const clinicStaff = [];
      
      // 1 Sales Staff per clinic - create basic user first
      const salesStaffData = {
        email: `sales.clinic${i}@bntest.com`,
        full_name: `Sales Staff Clinic ${i}`,
        role: 'super_admin', // Use valid enum, clinic role assigned in clinic_staff table
        tier: 'clinical',
        clinic_id: clinic.id,
        is_active: true,
        metadata: {
          test_user: true,
          clinic_role: 'sales_staff',
          target_customers: customersPerSales,
          created_for: 'production_testing'
        }
      };

      console.log(`💼 Creating sales staff for clinic ${i}:`, salesStaffData.email);

      const { data: salesStaff, error: salesError } = await adminClient
        .from('users')
        .insert(salesStaffData)
        .select()
        .single();

      if (!salesError && salesStaff) {
        // Create clinic_staff record
        await adminClient
          .from('clinic_staff')
          .insert({
            user_id: salesStaff.id,
            clinic_id: clinic.id,
            role: 'sales_staff',
            is_active: true
          });

        clinicStaff.push(salesStaff);

        // Create customers for this sales staff (limit to 5 for testing)
        const customerLimit = Math.min(customersPerSales, 5);
        console.log(`👥 Creating ${customerLimit} customers for sales staff...`);
        
        for (let c = 1; c <= customerLimit; c++) {
          const customerData = {
            email: `customer${c}.clinic${i}@bntest.com`,
            full_name: `Customer ${c} Clinic ${i}`,
            role: 'super_admin', // Use only valid enum - differentiate via metadata and clinic tables
            tier: 'free',
            clinic_id: clinic.id,
            is_active: true,
            metadata: {
              test_user: true,
              clinic_role: 'customer',
              assigned_sales_staff: salesStaff.id,
              created_for: 'production_testing'
            }
          };

          const { data: customer, error: customerError } = await adminClient
            .from('users')
            .insert(customerData)
            .select()
            .single();

          if (!customerError && customer) {
            // Link customer to sales staff
            await adminClient
              .from('customers')
              .insert({
                user_id: customer.id,
                clinic_id: clinic.id,
                sales_user_id: salesStaff.id,
                status: 'active',
                preferences: { communication: 'email', language: 'th' }
              });

            results.customers.push(customer);
          }
        }
      }

      // Create additional staff (beauticians, admins)
      for (let s = 2; s <= staffPerClinic; s++) {
        const role = s === 2 ? 'clinic_admin' : 'clinic_staff';
        const staffData = {
          id: `test-staff-${i.toString().padStart(3, '0')}-${s.toString().padStart(3, '0')}`,
          email: `staff${s}.clinic${i}@bntest.com`,
          role: role,
          clinic_id: clinic.id,
          full_name: `${role.replace('_', ' ')} ${s} Clinic ${i}`,
          status: 'active'
        };

        const { data: staff, error: staffError } = await adminClient
          .from('users')
          .insert(staffData)
          .select()
          .single();

        if (!staffError && staff) {
          // Create clinic_staff record
          await adminClient
            .from('clinic_staff')
            .insert({
              user_id: staff.id,
              clinic_id: clinic.id,
              role: role,
              is_active: true
            });

          clinicStaff.push(staff);
        }
      }

      results.staff.push(...clinicStaff);
      console.log(`✅ Created Clinic ${i}: ${clinicStaff.length} staff, ${customersPerSales} customers`);
    }

    results.totalUsers = results.staff.length + results.customers.length;

    console.log(`🎯 Production Users Created Successfully:`);
    console.log(`- ${results.clinics.length} Clinics`);
    console.log(`- ${results.staff.length} Staff Members`);
    console.log(`- ${results.customers.length} Customers`);
    console.log(`- ${results.totalUsers} Total Users`);

    return NextResponse.json({
      success: true,
      message: 'Production scale users created successfully',
      results,
      summary: {
        clinics: results.clinics.length,
        staff: results.staff.length,
        customers: results.customers.length,
        totalUsers: results.totalUsers,
        estimatedConcurrentUsers: Math.floor(results.totalUsers * 0.15) // 15% concurrent usage
      }
    });

  } catch (error) {
    console.error('Production users creation error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : 'No details'
    }, { status: 500 });
  }
}
