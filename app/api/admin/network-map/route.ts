import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

function successResponse(data: any) {
  return NextResponse.json({ success: true, data });
}

function errorResponse(message: string, status: number = 500) {
  return NextResponse.json({ success: false, error: message }, { status });
}

interface NetworkNode {
  id: string;
  name: string;
  type: 'clinic' | 'server' | 'database' | 'api' | 'auth' | 'storage';
  status: 'online' | 'offline' | 'warning';
  location: string;
  connections: string[];
  metrics: {
    latency: number;
    uptime: number;
    load: number;
    users?: number;
    staff?: number;
    tickets?: number;
  };
}

async function getNetworkNodes(adminClient: any): Promise<NetworkNode[]> {
  try {
    const nodes: NetworkNode[] = [];

    // Get clinics data
    const { data: clinics, error: clinicsError } = await adminClient
      .from('clinics')
      .select(`
        id,
        display_name,
        clinic_code,
        subscription_tier,
        is_active,
        created_at
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (clinicsError) throw clinicsError;

    // Get staff count per clinic
    const clinicIds = clinics?.map((c: any) => c.id) || [];
    const { data: staffData } = await adminClient
      .from('clinic_staff')
      .select('clinic_id')
      .in('clinic_id', clinicIds)
      .eq('is_active', true);

    const staffCountMap = new Map();
    staffData?.forEach((staff: any) => {
      const count = staffCountMap.get(staff.clinic_id) || 0;
      staffCountMap.set(staff.clinic_id, count + 1);
    });

    // Get tickets count per clinic
    const { data: ticketData } = await adminClient
      .from('support_tickets')
      .select('clinic_id')
      .in('clinic_id', clinicIds);

    const ticketCountMap = new Map();
    ticketData?.forEach((ticket: any) => {
      const count = ticketCountMap.get(ticket.clinic_id) || 0;
      ticketCountMap.set(ticket.clinic_id, count + 1);
    });

    // Create clinic nodes
    clinics?.forEach((clinic: any) => {
      const displayName = typeof clinic.display_name === 'string' 
        ? clinic.display_name 
        : clinic.display_name?.th || clinic.display_name?.en || 'Unknown Clinic';

      const staffCount = staffCountMap.get(clinic.id) || 0;
      const ticketCount = ticketCountMap.get(clinic.id) || 0;
      
      // Calculate metrics based on data
      const load = Math.min(95, (staffCount * 5) + (ticketCount * 3));
      const latency = 20 + (ticketCount * 2) + Math.random() * 10;
      const uptime = Math.max(95, 99 - (ticketCount * 0.5));

      nodes.push({
        id: clinic.id,
        name: displayName,
        type: 'clinic',
        status: ticketCount > 5 ? 'warning' : 'online',
        location: 'Thailand',
        connections: ['api-gateway'],
        metrics: {
          latency: Math.round(latency),
          uptime: Math.round(uptime * 10) / 10,
          load: Math.round(load),
          users: staffCount,
          staff: staffCount,
          tickets: ticketCount
        }
      });
    });

    // Add service nodes
    nodes.push({
      id: 'main-server',
      name: 'Main Server',
      type: 'server',
      status: 'online',
      location: 'Bangkok, Thailand',
      connections: ['database', 'api-gateway', 'auth-service', 'storage'],
      metrics: {
        latency: 12,
        uptime: 99.9,
        load: 45
      }
    });

    nodes.push({
      id: 'database',
      name: 'Primary Database',
      type: 'database',
      status: 'online',
      location: 'Bangkok, Thailand',
      connections: ['main-server'],
      metrics: {
        latency: 8,
        uptime: 99.95,
        load: 62
      }
    });

    nodes.push({
      id: 'api-gateway',
      name: 'API Gateway',
      type: 'api',
      status: 'online',
      location: 'Bangkok, Thailand',
      connections: ['main-server', ...clinicIds],
      metrics: {
        latency: 15,
        uptime: 99.8,
        load: 38
      }
    });

    nodes.push({
      id: 'auth-service',
      name: 'Auth Service',
      type: 'auth',
      status: 'online',
      location: 'Bangkok, Thailand',
      connections: ['main-server'],
      metrics: {
        latency: 10,
        uptime: 99.9,
        load: 25
      }
    });

    nodes.push({
      id: 'storage',
      name: 'Storage Service',
      type: 'storage',
      status: 'online',
      location: 'Bangkok, Thailand',
      connections: ['main-server'],
      metrics: {
        latency: 20,
        uptime: 99.7,
        load: 35
      }
    });

    return nodes;
  } catch (error) {
    console.error('Error fetching network nodes:', error);
    throw error;
  }
}

async function getNetworkStats(adminClient: any, clinicsCount: number) {
  try {
    // Get system statistics
    const [
      { count: totalUsers },
      { count: totalStaff },
      { count: totalTickets },
      { count: totalMessages },
      { count: totalAuditLogs }
    ] = await Promise.all([
      adminClient.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true),
      adminClient.from('clinic_staff').select('*', { count: 'exact', head: true }).eq('is_active', true),
      adminClient.from('support_tickets').select('*', { count: 'exact', head: true }),
      adminClient.from('broadcast_messages').select('*', { count: 'exact', head: true }),
      adminClient.from('audit_logs').select('*', { count: 'exact', head: true })
    ]);

    // Get customer count
    const { count: totalCustomers } = await adminClient
      .from('users')
      .select('*', { count: 'exact', head: true })
      .in('role', ['free_user', 'premium_customer'])
      .eq('is_active', true);

    return {
      totalUsers: totalUsers || 0,
      totalStaff: totalStaff || 0,
      totalCustomers: totalCustomers || 0,
      totalTickets: totalTickets || 0,
      totalMessages: totalMessages || 0,
      totalAuditLogs: totalAuditLogs || 0,
      totalClinics: clinicsCount
    };
  } catch (error) {
    console.error('Error fetching network stats:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user session from server client
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return errorResponse('Unauthorized', 401);
    }

    // Use admin client for database queries (bypasses RLS)
    const adminClient = createAdminClient();

    // Verify Super Admin Role
    const { data: profile } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'super_admin') {
      return errorResponse('Forbidden: Super Admin access required', 403);
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'nodes';

    switch (type) {
      case 'nodes':
        const nodes = await getNetworkNodes(adminClient);
        return successResponse(nodes);
      
      case 'stats':
        const stats = await getNetworkStats(adminClient, 0);
        return successResponse(stats);
      
      default:
        // Return both nodes and stats
        const [networkNodes, networkStats] = await Promise.all([
          getNetworkNodes(adminClient),
          getNetworkStats(adminClient, 0)
        ]);
        return successResponse({ nodes: networkNodes, stats: networkStats });
    }
  } catch (error) {
    console.error('Network map API error:', error);
    return errorResponse('Internal server error', 500);
  }
}
