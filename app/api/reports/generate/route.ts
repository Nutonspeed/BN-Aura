import { NextRequest, NextResponse } from 'next/server';
import { getDateRange } from '@/lib/reports/reportBuilder';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { config, clinicId } = await request.json();

    if (!config || !clinicId) {
      return NextResponse.json({ error: 'Missing config or clinicId' }, { status: 400 });
    }

    const { start, end } = config.startDate && config.endDate 
      ? { start: new Date(config.startDate), end: new Date(config.endDate) }
      : getDateRange(config.dateRange);

    // Fetch real data from database
    const reportData = await generateReportFromDatabase(supabase, config.type, clinicId, start, end);

    return NextResponse.json({
      headers: config.columns,
      rows: reportData.rows,
      summary: reportData.summary,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Reports] Error:', error);
    return NextResponse.json({ error: 'Report generation failed' }, { status: 500 });
  }
}

async function generateReportFromDatabase(supabase: any, type: string, clinicId: string, start: Date, end: Date) {
  const rows: (string | number)[][] = [];
  const summary: Record<string, number> = {};

  if (type === 'sales') {
    const { data } = await supabase.from('pos_transactions').select('*').eq('clinic_id', clinicId).gte('created_at', start.toISOString()).lte('created_at', end.toISOString());
    if (data?.length) {
      data.forEach((t: any) => rows.push([new Date(t.created_at).toLocaleDateString('th-TH'), '-', '-', t.total_amount, '-', t.payment_status]));
      summary.totalRevenue = data.reduce((s: number, t: any) => s + (t.total_amount || 0), 0);
      summary.totalTransactions = data.length;
    }
  } else if (type === 'revenue') {
    const { data } = await supabase.from('pos_transactions').select('created_at, total_amount').eq('clinic_id', clinicId).eq('payment_status', 'completed').gte('created_at', start.toISOString()).lte('created_at', end.toISOString());
    if (data?.length) {
      summary.totalRevenue = data.reduce((s: number, t: any) => s + (t.total_amount || 0), 0);
      summary.totalTransactions = data.length;
    }
  }

  if (!rows.length) rows.push(['ไม่พบข้อมูลในช่วงเวลาที่เลือก']);
  return { rows, summary };
}
