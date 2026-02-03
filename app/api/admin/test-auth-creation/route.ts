import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
  console.log('\n🧪 === TEST AUTH CREATION API ===');
  
  try {
    const body = await request.json();
    const { email, temporaryPassword } = body;

    console.log(`👤 Testing auth creation for: ${email}`);

    // Step 1: Create Supabase Auth user
    console.log('\n1️⃣ Creating Supabase Auth user...');
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: temporaryPassword || 'TempStaff123!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Test Staff',
        role: 'sales_staff',
        created_via: 'test_api'
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
      message: 'Test auth user created successfully',
      data: {
        authUserId: authUser.user?.id,
        email: authUser.user?.email,
        credentials: {
          email: email,
          temporaryPassword: temporaryPassword || 'TempStaff123!'
        }
      }
    };

    console.log('🎉 Test auth creation completed successfully!');
    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Test auth creation error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : 'No details'
    }, { status: 500 });
  }
}
