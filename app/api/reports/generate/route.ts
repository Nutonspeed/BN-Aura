import { NextRequest, NextResponse } from 'next/server';
import { getDateRange } from '@/lib/reports/reportBuilder';

export async function POST(request: NextRequest) {
  try {
    const { config, clinicId } = await request.json();

    if (!config || !clinicId) {
      return NextResponse.json({ error: 'Missing config or clinicId' }, { status: 400 });
    }

    const { start, end } = config.startDate && config.endDate 
      ? { start: new Date(config.startDate), end: new Date(config.endDate) }
      : getDateRange(config.dateRange);

    // Mock data generation - in production, query from database
    const mockData = generateMockReportData(config.type, start, end);

    return NextResponse.json({
      headers: config.columns,
      rows: mockData.rows,
      summary: mockData.summary,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Reports] Error:', error);
    return NextResponse.json({ error: 'Report generation failed' }, { status: 500 });
  }
}

function generateMockReportData(type: string, start: Date, end: Date) {
  const rows: (string | number)[][] = [];
  const summary: Record<string, number> = {};

  switch (type) {
    case 'sales':
      rows.push(
        ['2026-02-06', 'คุณสมหญิง', 'HydraFacial', 3500, 'พนักงาน A', 'สำเร็จ'],
        ['2026-02-05', 'คุณสมชาย', 'LED Therapy', 2500, 'พนักงาน B', 'สำเร็จ'],
        ['2026-02-04', 'คุณมาลี', 'Botox', 8000, 'พนักงาน A', 'สำเร็จ'],
      );
      summary.totalRevenue = 14000;
      summary.totalTransactions = 3;
      break;

    case 'analysis':
      rows.push(
        ['2026-02-06', 'คุณสมหญิง', 78, 32, 'มัน', 'HydraFacial'],
        ['2026-02-05', 'คุณสมชาย', 85, 28, 'แห้ง', 'Vitamin C'],
        ['2026-02-04', 'คุณมาลี', 72, 45, 'ผสม', 'Anti-aging'],
      );
      summary.avgScore = 78;
      summary.totalScans = 3;
      break;

    case 'revenue':
      rows.push(
        ['2026-02-06', 45000, 12, 3750, '+15%'],
        ['2026-02-05', 38000, 10, 3800, '+8%'],
        ['2026-02-04', 52000, 15, 3467, '+22%'],
      );
      summary.totalRevenue = 135000;
      summary.avgDaily = 45000;
      break;

    default:
      rows.push(['No data available']);
  }

  return { rows, summary };
}
