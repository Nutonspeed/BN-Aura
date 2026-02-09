import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSuperAdmin, handleAuthError } from '@/lib/auth/withAuth';

export async function POST(request: NextRequest) {
  console.log('\n🎯 === SIMPLE TEST USERS CREATION ===');
  
  try {
    const adminClient = createAdminClient();
    
    const results = {
      success: true,
      message: 'Using existing production clinics and clean users for data isolation testing',
      existing_data: {
        clinics: 0,
        users: 0
      },
      testing_plan: {
        approach: 'Use existing clean.owner@bntest.com and create additional test users manually',
        isolation_test: 'Test data isolation between sales staff in same clinic',
        concurrent_test: 'Test with existing + new users for load testing'
      }
    };

    // Check existing production test clinics
    const { data: testClinics } = await adminClient
      .from('clinics')
      .select('id, clinic_code, display_name, subscription_tier')
      .contains('metadata', { test_clinic: true })
      .order('created_at', { ascending: false })
      .limit(5);

    if (testClinics) {
      results.existing_data.clinics = testClinics.length;
      console.log(`✅ Found ${testClinics.length} existing production test clinics`);
    }

    // Check existing users 
    const { data: existingUsers } = await adminClient
      .from('users')
      .select('id, email, role, tier, clinic_id')
      .or('email.eq.clean.owner@bntest.com,email.eq.nuttapong161@gmail.com')

    if (existingUsers) {
      results.existing_data.users = existingUsers.length;
      console.log(`✅ Found ${existingUsers.length} existing clean users for testing`);
    }

    console.log(`🎯 Ready for Phase 3: Data Isolation Testing with existing infrastructure`);

    return NextResponse.json(results);

  } catch (error) {
    console.error('❌ Simple test users error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : 'No details'
    }, { status: 500 });
  }
}
