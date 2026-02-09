import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireSuperAdmin, handleAuthError } from '@/lib/auth/withAuth';

const supabaseAdmin = createClient(
  'https://royeyoxaaieipdajijni.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJveWV5b3hhYWllaXBkYWppam5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTcyNzg5OSwiZXhwIjoyMDg1MzAzODk5fQ.NNe4He141lIW7iYcE9d-sKKMqrkeGGfVxXSnPDFBLuc',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  console.log('\n🔧 === COMPLETE STAFF RECORDS API ===');
  
  try {
    const body = await request.json();
    const { email, fullName, role, clinicId, authUserId } = body;

    console.log(`👤 Completing staff records for: ${email}`);
    console.log(`🔐 Auth User ID: ${authUserId}`);
    console.log(`🏥 Clinic ID: ${clinicId}`);
    console.log(`🎭 Role: ${role}`);

    // Step 1: Create database user record
    console.log('\n1️⃣ Creating database user record...');
    const { data: dbUser, error: dbError } = await supabaseAdmin
      .from('users')
      .insert({
        email: email,
        full_name: fullName,
        role: 'super_admin', // Use known valid enum, actual role in clinic_staff
        tier: 'clinical',
        clinic_id: clinicId,
        is_active: true,
        metadata: {
          auth_user_id: authUserId,
          clinic_role: role,
          created_via: 'staff_management_ui',
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (dbError) {
      console.error('❌ Database user creation failed:', dbError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create database user',
        details: dbError.message
      }, { status: 500 });
    }

    console.log('✅ Database user created:', dbUser.id);

    // Step 2: Create clinic_staff record
    console.log('\n2️⃣ Creating clinic_staff record...');
    const { data: staffRecord, error: staffError } = await supabaseAdmin
      .from('clinic_staff')
      .insert({
        user_id: dbUser.id,
        clinic_id: clinicId,
        role: role, // Actual role assignment here
        is_active: true,
        metadata: {
          auth_user_id: authUserId,
          created_via: 'staff_management_ui'
        }
      })
      .select()
      .single();

    if (staffError) {
      console.error('❌ Clinic staff record creation failed:', staffError);
      // Cleanup user record if staff creation fails
      await supabaseAdmin.from('users').delete().eq('id', dbUser.id);
      
      return NextResponse.json({
        success: false,
        error: 'Failed to create clinic staff record',
        details: staffError.message
      }, { status: 500 });
    }

    console.log('✅ Clinic staff record created:', staffRecord.id);

    // Step 3: Update auth user metadata with database IDs
    console.log('\n3️⃣ Updating auth user metadata...');
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      authUserId,
      {
        user_metadata: {
          full_name: fullName,
          role: role,
          clinic_id: clinicId,
          database_user_id: dbUser.id,
          clinic_staff_id: staffRecord.id,
          created_via: 'staff_management_ui',
          completed_at: new Date().toISOString()
        }
      }
    );

    if (updateError) {
      console.error('❌ Auth user metadata update failed:', updateError);
      // Non-critical error, continue
    } else {
      console.log('✅ Auth user metadata updated');
    }

    const result = {
      success: true,
      message: 'Staff records completed successfully',
      data: {
        authUserId: authUserId,
        databaseUserId: dbUser.id,
        staffRecordId: staffRecord.id,
        email: email,
        fullName: fullName,
        role: role,
        clinicId: clinicId
      },
      nextSteps: {
        loginUrl: '/th/login',
        dashboardUrl: '/th/clinic', // Will route based on role
        instructions: 'Staff now has complete authentication and database records'
      }
    };

    console.log('🎉 Staff records completion successful!');
    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Staff records completion error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : 'No details'
    }, { status: 500 });
  }
}

// GET endpoint to check existing staff records
export async function GET() {
  console.log('\n🔍 === STAFF RECORDS CHECK ===');
  
  try {
    const { data: staffRecords, error: staffError } = await supabaseAdmin
      .from('clinic_staff')
      .select(`
        id,
        role,
        is_active,
        clinic_id,
        users:user_id (
          id,
          email,
          full_name,
          metadata
        )
      `)
      .eq('is_active', true)
      .limit(10);

    if (staffError) {
      console.error('❌ Error checking staff records:', staffError);
      return NextResponse.json({
        success: false,
        error: staffError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Staff records check completed',
      data: {
        staffCount: staffRecords?.length || 0,
        staff: staffRecords || []
      }
    });

  } catch (error) {
    console.error('❌ Check error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
