import { NextRequest, NextResponse } from 'next/server';
import { AICostTracker } from '@/lib/ai/aiCostTracker';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    
    const report = AICostTracker.getUsageReport(days);
    const budgetCheck = AICostTracker.canMakeRequest();
    
    return NextResponse.json({
      success: true,
      data: {
        ...report,
        budgetStatus: budgetCheck,
        dailyBudget: parseFloat(process.env.AI_DAILY_BUDGET_THB || '500'),
        rateLimit: parseInt(process.env.AI_RATE_LIMIT_PER_DAY || '1000'),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('AI Usage API error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get AI usage' }, { status: 500 });
  }
}
