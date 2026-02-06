import { NextRequest, NextResponse } from 'next/server';
import { MultiClinicManagement } from '@/lib/management/multiClinicManagement';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'register-clinic';
    const body = await request.json();

    switch (action) {
      case 'register-clinic':
        const clinic = MultiClinicManagement.registerClinic(body);
        return NextResponse.json({
          success: true,
          data: clinic,
          message: `Clinic ${clinic.clinicName} registered as ${clinic.franchiseType}`
        });

      case 'create-franchise':
        const franchise = MultiClinicManagement.createFranchise(
          body.clinicId,
          body.royaltyRate
        );
        return NextResponse.json({
          success: true,
          data: franchise,
          message: `Franchise agreement created with ${franchise.royaltyRate}% royalty`
        });

      case 'centralize-customer':
        const customer = MultiClinicManagement.centralizeCustomer(body);
        return NextResponse.json({
          success: true,
          data: customer,
          message: `Customer ${customer.profile.name} centralized across network`
        });

      case 'generate-report':
        const report = MultiClinicManagement.generateCrossClinicReport(body.clinicIds);
        return NextResponse.json({
          success: true,
          data: report,
          insights: {
            averageRevenue: Math.round(report.totalRevenue / report.clinics.length),
            averageBookings: Math.round(report.totalBookings / report.clinics.length),
            topPerformingClinic: report.topPerformer
          }
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Multi-Clinic Management API failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const overview = MultiClinicManagement.getNetworkOverview();
    
    return NextResponse.json({
      success: true,
      data: overview,
      insights: {
        networkHealth: overview.averagePerformance > 80 ? 'Excellent' : 'Good',
        expansionPotential: overview.totalClinics < 10 ? 'High' : 'Moderate',
        customerBase: overview.totalCustomers > 1000 ? 'Large' : 'Growing',
        revenuePerClinic: Math.round(overview.networkRevenue / overview.totalClinics)
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get network overview'
    }, { status: 500 });
  }
}
