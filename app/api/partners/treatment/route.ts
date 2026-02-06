import { NextRequest, NextResponse } from 'next/server';
import { TreatmentPartnerAPI } from '@/lib/partners/treatmentPartnerAPI';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'register-supplier';
    const body = await request.json();

    switch (action) {
      case 'register-supplier':
        const supplier = TreatmentPartnerAPI.registerSupplier(body);
        return NextResponse.json({
          success: true,
          data: supplier,
          message: `Supplier ${supplier.companyName} registered successfully`
        });

      case 'create-order':
        const order = TreatmentPartnerAPI.createProductOrder(
          body.clinicId, 
          body.supplierId, 
          body.items
        );
        return NextResponse.json({
          success: true,
          data: order,
          message: `Order ${order.orderId} created successfully`
        });

      case 'create-referral':
        const referral = TreatmentPartnerAPI.createReferral(
          body.fromClinicId,
          body.toClinicId,
          body.customerId,
          body.referralData
        );
        return NextResponse.json({
          success: true,
          data: referral,
          message: `Referral ${referral.referralId} created with fee ฿${referral.referralFee}`
        });

      case 'request-service':
        const service = TreatmentPartnerAPI.requestEquipmentService(
          body.clinicId,
          body.partnerId,
          body.serviceType
        );
        return NextResponse.json({
          success: true,
          data: service,
          message: `Service request ${service.serviceRequestId} created`
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Treatment Partner API failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId');
    
    if (!clinicId) {
      return NextResponse.json({ 
        error: 'Missing clinicId parameter' 
      }, { status: 400 });
    }

    const analytics = TreatmentPartnerAPI.getPartnerAnalytics(clinicId);
    
    return NextResponse.json({
      success: true,
      data: analytics,
      insights: {
        partnerEngagement: analytics.totalSuppliers > 3 ? 'High' : 'Low',
        referralActivity: analytics.totalReferrals > 5 ? 'Active' : 'Inactive',
        spendingLevel: analytics.totalSpend > 100000 ? 'High Volume' : 'Standard'
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get partner analytics'
    }, { status: 500 });
  }
}
