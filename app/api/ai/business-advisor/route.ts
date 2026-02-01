import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  processBusinessQuery, 
  generateAnomalyAlerts,
  BusinessQuery 
} from '@/lib/ai/businessAdvisor';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, query, timeframe, compareWith } = body;

    // ดึงข้อมูล clinic_id และตรวจสอบสิทธิ์
    const { data: userData } = await supabase
      .from('users')
      .select('clinic_id, role')
      .eq('id', user.id)
      .single();

    if (!userData?.clinic_id) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    // ตรวจสอบว่าเป็น Owner หรือ Admin
    const allowedRoles = ['premium_customer']; // Adjust based on your role system
    if (!allowedRoles.includes(userData.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const clinicId = userData.clinic_id;

    switch (action) {
      case 'query': {
        if (!query) {
          return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        const businessQuery: BusinessQuery = {
          question: query,
          timeframe,
          compareWith
        };

        const insight = await processBusinessQuery(businessQuery, clinicId);
        return NextResponse.json({ success: true, insight });
      }

      case 'anomaly_alerts': {
        const alerts = await generateAnomalyAlerts(clinicId);
        return NextResponse.json({ success: true, alerts });
      }

      case 'quick_insights': {
        // สำหรับข้อมูลสำคัญที่แสดงใน dashboard
        const [salesRes, customersRes, staffRes] = await Promise.all([
          supabase
            .from('sales_proposals')
            .select('total_amount, created_at')
            .eq('clinic_id', clinicId)
            .eq('status', 'accepted')
            .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
          
          supabase
            .from('customers')
            .select('id, created_at')
            .eq('clinic_id', clinicId)
            .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
          
          supabase
            .from('users')
            .select('id, role')
            .eq('clinic_id', clinicId)
        ]);

        const totalRevenue = salesRes.data?.reduce((sum: number, item: any) => 
          sum + parseFloat(item.total_amount || '0'), 0
        ) || 0;

        const newCustomers = customersRes.data?.length || 0;
        const totalStaff = staffRes.data?.length || 0;

        const insights = {
          revenue: {
            value: totalRevenue,
            formatted: `฿${totalRevenue.toLocaleString()}`,
            label: 'รายได้ 30 วันที่แล้ว'
          },
          customers: {
            value: newCustomers,
            formatted: `${newCustomers} คน`,
            label: 'ลูกค้าใหม่ 30 วันที่แล้ว'
          },
          staff: {
            value: totalStaff,
            formatted: `${totalStaff} คน`,
            label: 'จำนวนพนักงานทั้งหมด'
          }
        };

        return NextResponse.json({ success: true, insights });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Business Advisor API Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

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

    switch (type) {
      case 'alerts': {
        const alerts = await generateAnomalyAlerts(clinicId);
        return NextResponse.json({ success: true, alerts });
      }

      case 'dashboard_summary': {
        // ข้อมูลสรุปสำหรับ Executive Dashboard
        const today = new Date();
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        
        // ข้อมูลเดือนนี้
        const [thisMonthSales, thisMonthCustomers] = await Promise.all([
          supabase
            .from('sales_proposals')
            .select('total_amount')
            .eq('clinic_id', clinicId)
            .eq('status', 'accepted')
            .gte('created_at', thisMonth.toISOString()),
            
          supabase
            .from('customers')
            .select('id')
            .eq('clinic_id', clinicId)
            .gte('created_at', thisMonth.toISOString())
        ]);
        
        // ข้อมูลเดือนที่แล้ว
        const [lastMonthSales, lastMonthCustomers] = await Promise.all([
          supabase
            .from('sales_proposals')
            .select('total_amount')
            .eq('clinic_id', clinicId)
            .eq('status', 'accepted')
            .gte('created_at', lastMonth.toISOString())
            .lt('created_at', thisMonth.toISOString()),
            
          supabase
            .from('customers')
            .select('id')
            .eq('clinic_id', clinicId)
            .gte('created_at', lastMonth.toISOString())
            .lt('created_at', thisMonth.toISOString())
        ]);

        const thisMonthRevenue = thisMonthSales.data?.reduce((sum: number, item: any) => 
          sum + parseFloat(item.total_amount || '0'), 0
        ) || 0;
        
        const lastMonthRevenue = lastMonthSales.data?.reduce((sum: number, item: any) => 
          sum + parseFloat(item.total_amount || '0'), 0
        ) || 0;

        const revenueGrowth = lastMonthRevenue > 0 
          ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100)
          : 0;

        const customerGrowth = (lastMonthCustomers.data?.length || 0) > 0
          ? (((thisMonthCustomers.data?.length || 0) - (lastMonthCustomers.data?.length || 0)) / (lastMonthCustomers.data?.length || 1) * 100)
          : 0;

        const summary = {
          revenue: {
            current: thisMonthRevenue,
            previous: lastMonthRevenue,
            growth: revenueGrowth,
            formatted: `฿${thisMonthRevenue.toLocaleString()}`
          },
          customers: {
            current: thisMonthCustomers.data?.length || 0,
            previous: lastMonthCustomers.data?.length || 0,
            growth: customerGrowth,
            formatted: `${thisMonthCustomers.data?.length || 0} คน`
          }
        };

        return NextResponse.json({ success: true, summary });
      }

      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }
  } catch (error) {
    console.error('Business Advisor GET Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
