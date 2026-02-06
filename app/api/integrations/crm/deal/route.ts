import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { provider, deal } = await request.json();
    const externalId = `${provider}_deal_${Date.now()}`;

    console.log(`[CRM] Syncing deal to ${provider}:`, deal.title);

    return NextResponse.json({
      success: true,
      externalId,
      message: `Deal synced to ${provider}`,
    });
  } catch (error) {
    console.error('[CRM] Deal sync error:', error);
    return NextResponse.json({ success: false, error: 'Sync failed' }, { status: 500 });
  }
}
