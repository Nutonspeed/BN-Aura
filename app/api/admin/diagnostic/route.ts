import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const adminClient = createAdminClient();
    
    // Test 1: Check if we can connect to Supabase
    const { data: testData, error: testError } = await adminClient
      .from('clinics')
      .select('count')
      .limit(1);
    
    if (testError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Database connection failed',
        details: testError.message 
      });
    }
    
    // Test 2: Check if broadcast_messages table exists
    const { data: broadcastData, error: broadcastError } = await adminClient
      .from('broadcast_messages')
      .select('count')
      .limit(1);
    
    if (broadcastError) {
      return NextResponse.json({ 
        success: false, 
        error: 'broadcast_messages table error',
        details: broadcastError.message 
      });
    }
    
    // Test 3: Check if clinic_users table exists
    const { data: clinicUsersData, error: clinicUsersError } = await adminClient
      .from('clinic_users')
      .select('count')
      .limit(1);
    
    if (clinicUsersError) {
      return NextResponse.json({ 
        success: false, 
        error: 'clinic_users table error',
        details: clinicUsersError.message 
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'All systems operational',
      data: {
        clinics: testData,
        broadcast_messages: broadcastData,
        clinic_users: clinicUsersData
      }
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: 'Unexpected error',
      details: error.message,
      stack: error.stack
    });
  }
}
