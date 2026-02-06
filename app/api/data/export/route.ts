import { NextRequest, NextResponse } from 'next/server';
import { exportCustomersToCSV, exportAnalysisData, exportToJSON } from '@/lib/data/dataExport';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'customers';
  const format = searchParams.get('format') || 'csv';
  const clinicId = searchParams.get('clinicId');

  if (!clinicId) {
    return NextResponse.json({ success: false, error: 'clinicId required' }, { status: 400 });
  }

  // Mock data - in production, fetch from database
  const mockCustomers = [
    { id: '1', name: 'คุณสมหญิง', email: 'test1@example.com', phone: '0812345678', skinType: 'oily', createdAt: '2026-01-15' },
    { id: '2', name: 'คุณสมชาย', email: 'test2@example.com', phone: '0823456789', skinType: 'dry', createdAt: '2026-01-20' },
  ];

  const mockAnalyses = [
    { id: '1', customerName: 'คุณสมหญิง', date: '2026-02-01', overallScore: 78, metrics: { spots: 65, wrinkles: 82, texture: 75, pores: 68 } },
    { id: '2', customerName: 'คุณสมชาย', date: '2026-02-05', overallScore: 85, metrics: { spots: 88, wrinkles: 79, texture: 90, pores: 82 } },
  ];

  let content: string;
  let contentType: string;
  let filename: string;

  if (type === 'customers') {
    content = format === 'json' ? exportToJSON(mockCustomers) : exportCustomersToCSV(mockCustomers);
    contentType = format === 'json' ? 'application/json' : 'text/csv';
    filename = `customers-${Date.now()}.${format}`;
  } else {
    content = format === 'json' ? exportToJSON(mockAnalyses) : exportAnalysisData(mockAnalyses);
    contentType = format === 'json' ? 'application/json' : 'text/csv';
    filename = `analyses-${Date.now()}.${format}`;
  }

  return new NextResponse(content, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
