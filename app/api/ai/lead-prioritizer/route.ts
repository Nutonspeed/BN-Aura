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
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, leads } = body;

    // ดึงข้อมูล clinic_id
    const { data: userData } = await supabase
      .from('users')
      .select('clinic_id')
      .eq('id', user.id)
      .single();

    if (!userData?.clinic_id) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    const clinicId = userData.clinic_id;

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
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ดึงข้อมูล clinic_id
    const { data: userData } = await supabase
      .from('users')
      .select('clinic_id')
      .eq('id', user.id)
      .single();

    if (!userData?.clinic_id) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    // ดึง Hot Leads Alert
    const alert = await getHotLeadsAlert(userData.clinic_id);
    return NextResponse.json({ success: true, alert });
  } catch (error) {
    console.error('Lead Prioritizer GET Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
