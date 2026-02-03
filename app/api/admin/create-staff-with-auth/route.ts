import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiMiddleware } from '@/lib/security/middleware';
import { validateBody } from '@/lib/security/input-validator';
import { businessSchemas } from '@/lib/security/input-validator';
import auditLogger from '@/lib/security/audit-logger';

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
  console.log('\n🔐 === CREATE STAFF WITH AUTH API ===');
  
  try {
    const body = await request.json();
    const { email, fullName, role, clinicId, temporaryPassword } = body;

    // Validate input
    const validator = require('@/lib/security/input-validator').InputValidator.getInstance();
    const validation = validator.validate(body, businessSchemas.user);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    console.log(`👤 Creating staff with auth: ${email}`);
    console.log(`🏥 Clinic ID: ${clinicId}`);
    console.log(`🎭 Role: ${role}`);

    // Step 1: Create Supabase Auth user
    console.log('\n1️⃣ Creating Supabase Auth user...');
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: temporaryPassword || 'TempStaff123!',
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: role,
        clinic_id: clinicId,
        created_via: 'staff_management_ui'
      }
    });

    if (authError) {
      console.error('❌ Auth user creation failed:', authError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create auth user',
        details: authError.message
      }, { status: 400 });
    }

    console.log('✅ Auth user created:', authUser.user?.id);

    const result = {
      success: true,
      message: 'Staff auth created successfully (database records to be added)',
      data: {
        authUserId: authUser.user?.id,
        email: authUser.user?.email,
        credentials: {
          email: email,
          temporaryPassword: temporaryPassword || 'TempStaff123!'
        }
      },
      nextSteps: {
        loginUrl: '/th/login',
        dashboardUrl: '/th/clinic', // Default to clinic dashboard
        instructions: 'Staff can now login with provided credentials'
      }
    };

    console.log('🎉 Staff auth creation completed successfully!');
    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Staff creation error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : 'No details'
    }, { status: 500 });
  }
}

// GET endpoint to test existing staff auth integration
export async function GET() {
  console.log('\n🔍 === STAFF AUTH INTEGRATION CHECK ===');
  
  try {
    const adminClient = createAdminClient();
    
    // Check staff with auth integration
    const { data: staffWithAuth, error: staffError } = await adminClient
      .from('clinic_staff')
      .select(`
        id,
        role,
        is_active,
        users:user_id (
          email,
          full_name,
          metadata
        )
      `)
      .contains('metadata', { created_via: 'staff_management_ui' })
      .limit(5);

    if (staffError) {
      console.error('❌ Error checking staff:', staffError);
      return NextResponse.json({
        success: false,
        error: staffError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Staff auth integration check completed',
      data: {
        staffCount: staffWithAuth?.length || 0,
        staff: staffWithAuth || []
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
