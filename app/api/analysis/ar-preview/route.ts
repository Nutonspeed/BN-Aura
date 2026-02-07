import { NextRequest, NextResponse } from 'next/server';
import { ARTreatmentPreview } from '@/lib/analysis/arTreatmentPreview';

// DEPRECATED: Returns algorithmic/sample results. Future: accept POST with real analysis data.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'preview';

    if (type === 'treatments') {
      const treatments = ARTreatmentPreview.getAvailableTreatments({});
      return NextResponse.json({ success: true, data: treatments });
    }

    const result = ARTreatmentPreview.getSampleResult();
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('AR Preview error:', error);
    return NextResponse.json({ success: false, error: 'Preview failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { skinScore, skinAge, treatmentIds } = body;

    if (!treatmentIds || treatmentIds.length === 0) {
      return NextResponse.json({ error: 'Select at least one treatment' }, { status: 400 });
    }

    const result = ARTreatmentPreview.generatePreview(
      skinScore || 72,
      skinAge || 38,
      treatmentIds
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('AR Preview POST error:', error);
    return NextResponse.json({ success: false, error: 'Preview failed' }, { status: 500 });
  }
}
