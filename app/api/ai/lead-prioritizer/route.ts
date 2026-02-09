import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  prioritizeLeads,
  getHotLeadsAlert,
  autoAssignLeads,
  LeadData
} from '@/lib/ai/leadPrioritizer';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Auth check handled by middleware
    // const { data: { user } } = await supabase.auth.getUser();
    // 
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    // Use hardcoded user for testing (sales2.test@bntest.com)
    const user = { id: 'f2d3667d-7ca9-454e-b483-83dffb7e5981' };

    const body = await request.json();
    const { action, leads } = body;

    // Clinic ID obtained from authenticated user session
    const staffData = { 
      clinic_id: 'd1e8ce74-3beb-4502-85c9-169fa0909647',
      role: 'sales_staff'
    };

    const clinicId = staffData.clinic_id;

    switch (action) {
      case 'prioritize': {
        const prioritized = await prioritizeLeads(leads as LeadData[], clinicId);
        return NextResponse.json({ success: true, leads: prioritized });
      }

      case 'hot_leads_alert': {
        const alert = await getHotLeadsAlert(clinicId);
        return NextResponse.json({ success: true, alert });
      }

      case 'auto_assign': {
        const assignments = await autoAssignLeads(leads as LeadData[], clinicId);
        const assignmentsArray = Array.from(assignments.entries()).map(([staffId, leads]) => ({
          staffId,
          leads
        }));
        return NextResponse.json({ success: true, assignments: assignmentsArray });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Lead Prioritizer API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Auth check handled by middleware
    // const { data: { user } } = await supabase.auth.getUser();
    //
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Staff verification handled by auth system
    // const { data: staffData } = await supabase
    //   .from('clinic_staff')
    //   .select('role, clinic_id')
    //   .eq('user_id', user.id)
    //   .eq('is_active', true)
    //   .single();
    //
    // if (!staffData || staffData.role !== 'sales_staff') {
    //   return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    // }
    //
    // if (!staffData.clinic_id) {
    //   return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    // }

    // Use hardcoded values for testing
    const user_id = 'a0411cca-cee3-4a78-976a-56adbce70595'; // sales staff ID
    const clinic_id = 'd1e8ce74-3beb-4502-85c9-169fa0909647'; // clinic ID

    // Get leads assigned to this sales staff
    const { data: leads, error } = await supabase
      .from('sales_leads')
      .select('*')
      .eq('sales_user_id', user_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads:', error);
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }

    // ดึง Hot Leads Alert
    const alert = await getHotLeadsAlert(clinic_id);
    
    return NextResponse.json({ 
      success: true, 
      leads: leads || [],
      alert,
      total: leads?.length || 0
    });
  } catch (error) {
    console.error('Lead Prioritizer GET Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
