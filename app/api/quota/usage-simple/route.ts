import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId');

    if (!clinicId) {
      return NextResponse.json(
        { error: 'Clinic ID is required' },
        { status: 400 }
      );
    }

    // Return simple mock data to test basic functionality
    return NextResponse.json({
      success: true,
      quota: {
        clinicId,
        plan: 'professional',
        monthlyQuota: 100,
        currentUsage: 99, // Near limit for testing
        resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        overage: 0,
        overageRate: 60
      },
      message: 'Simple quota check working'
    });

  } catch (error) {
    console.error('Simple quota error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clinicId, userId, scanType } = body;

    if (!clinicId || !userId || !scanType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Mock quota check - always return quota exceeded for testing
    return NextResponse.json(
      {
        error: 'Cannot perform scan',
        message: 'เกินโควตาแล้ว จะเสียค่าใช้จ่าย ฿60 ต่อครั้ง',
        quotaExceeded: true,
        remainingQuota: 0,
        willIncurCharge: true,
        estimatedCost: 60
      },
      { status: 403 }
    );

  } catch (error) {
    console.error('Simple POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
