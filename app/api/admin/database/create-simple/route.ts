import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSuperAdmin, handleAuthError } from '@/lib/auth/withAuth';

export async function POST(request: Request) {
  try {
    await requireSuperAdmin();
    const supabase = createAdminClient();
    
    // Test database connection
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: testError.message
      }, { status: 500 });
    }
    
    // Check if system_metrics table exists
    const { data: metricsData, error: metricsError } = await supabase
      .from('system_metrics')
      .select('*')
      .limit(1);
    
    const metricsExists = !metricsError || metricsError.code !== 'PGRST116';
    
    // Check if support_tickets table exists
    const { data: ticketsData, error: ticketsError } = await supabase
      .from('support_tickets')
      .select('*')
      .limit(1);
    
    const ticketsExists = !ticketsError || ticketsError.code !== 'PGRST116';
    
    // Check if announcements table exists
    const { data: announcementsData, error: announcementsError } = await supabase
      .from('announcements')
      .select('*')
      .limit(1);
    
    const announcementsExists = !announcementsError || announcementsError.code !== 'PGRST116';
    
    // Check if billing_records table exists
    const { data: billingData, error: billingError } = await supabase
      .from('billing_records')
      .select('*')
      .limit(1);
    
    const billingExists = !billingError || billingError.code !== 'PGRST116';
    
    // Check if system_alerts table exists
    const { data: alertsData, error: alertsError } = await supabase
      .from('system_alerts')
      .select('*')
      .limit(1);
    
    const alertsExists = !alertsError || alertsError.code !== 'PGRST116';
    
    // Check if role_permissions table exists
    const { data: permissionsData, error: permissionsError } = await supabase
      .from('role_permissions')
      .select('*')
      .limit(1);
    
    const permissionsExists = !permissionsError || permissionsError.code !== 'PGRST116';
    
    const tableStatus = {
      system_metrics: metricsExists,
      support_tickets: ticketsExists,
      announcements: announcementsExists,
      billing_records: billingExists,
      system_alerts: alertsExists,
      role_permissions: permissionsExists
    };
    
    const allTablesExist = Object.values(tableStatus).every(Boolean);
    
    return NextResponse.json({
      success: true,
      message: allTablesExist ? 'All tables already exist' : 'Some tables need to be created',
      tableStatus,
      allTablesExist
    });
    
  } catch (error) {
    console.error('Database check error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
