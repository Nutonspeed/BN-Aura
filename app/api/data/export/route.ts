import { NextRequest, NextResponse } from 'next/server';
import { exportCustomersToCSV, exportAnalysisData, exportToJSON } from '@/lib/data/dataExport';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'customers';
  const format = searchParams.get('format') || 'csv';
  const clinicId = searchParams.get('clinicId');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  let effectiveClinicId = clinicId;
  if (!effectiveClinicId) {
    const { data: staffData } = await supabase
      .from('clinic_staff')
      .select('clinic_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    effectiveClinicId = staffData?.clinic_id;
  }

  if (!effectiveClinicId) {
    return NextResponse.json({ success: false, error: 'clinicId required' }, { status: 400 });
  }

  let content: string;
  let contentType: string;
  let filename: string;

  if (type === 'customers') {
    const { data: customers } = await supabase
      .from('customers')
      .select('id, full_name, email, phone, skin_type, created_at')
      .eq('clinic_id', effectiveClinicId)
      .order('created_at', { ascending: false });

    const exportData = (customers || []).map(c => ({
      id: c.id, name: c.full_name, email: c.email || '',
      phone: c.phone || '', skinType: c.skin_type || '', createdAt: c.created_at
    }));

    content = format === 'json' ? exportToJSON(exportData) : exportCustomersToCSV(exportData);
    contentType = format === 'json' ? 'application/json' : 'text/csv';
    filename = `customers-${Date.now()}.${format}`;
  } else {
    const { data: analyses } = await supabase
      .from('skin_analyses')
      .select('id, created_at, overall_score, metrics, customer:customers(full_name)')
      .eq('clinic_id', effectiveClinicId)
      .order('created_at', { ascending: false });

    const exportData = (analyses || []).map((a: any) => ({
      id: a.id, customerName: a.customer?.full_name || 'Unknown',
      date: a.created_at, overallScore: a.overall_score || 0, metrics: a.metrics || {}
    }));

    content = format === 'json' ? exportToJSON(exportData) : exportAnalysisData(exportData);
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
