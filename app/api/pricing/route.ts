import { NextResponse } from 'next/server';
import { pricingEngine } from '@/lib/pricing/clinicPricingEngine';
import { handleAPIError, successResponse } from '@/lib/utils/errorHandler';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId');

    if (!clinicId) {
      return NextResponse.json({ error: 'Clinic ID required' }, { status: 400 });
    }

    const pricing = await pricingEngine.getClinicTreatmentPricing(clinicId);
    return NextResponse.json({ success: true, data: { treatments: pricing } });
    
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clinicId, treatmentName, basePrice, salesCommissionRate } = body;

    if (!clinicId || !treatmentName || !basePrice) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    await pricingEngine.setTreatmentPricing(
      clinicId,
      treatmentName,
      basePrice,
      salesCommissionRate || 10
    );

    return successResponse({ message: 'Pricing updated successfully' });
    
  } catch (error) {
    return handleAPIError(error);
  }
}
