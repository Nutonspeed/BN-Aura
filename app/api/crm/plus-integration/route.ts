import { NextRequest, NextResponse } from 'next/server';
import { CRMPlusIntegration } from '@/lib/crm/crmPlusIntegration';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'calculate-clv';
    
    const body = await request.json();

    switch (action) {
      case 'calculate-clv':
        return calculateCLV(body);
        
      case 'update-loyalty':
        return updateLoyalty(body);
        
      case 'generate-insights':
        return generateInsights(body);
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('CRM Plus API error:', error);
    return NextResponse.json(
      { error: 'CRM Plus operation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'analytics';
    const customerId = searchParams.get('customerId');

    switch (action) {
      case 'analytics':
        return getCRMAnalytics();
        
      case 'customer-profile':
        return getCustomerProfile(customerId);
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get CRM data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function calculateCLV(body: any) {
  const { customerId, transactionHistory } = body;
  
  if (!customerId || !transactionHistory || !Array.isArray(transactionHistory)) {
    return NextResponse.json({ 
      error: 'Missing or invalid fields: customerId, transactionHistory (array)' 
    }, { status: 400 });
  }
  
  try {
    const clv = CRMPlusIntegration.calculateCLV(customerId, transactionHistory);
    
    return NextResponse.json({
      success: true,
      data: clv,
      analysis: {
        revenueCategory: clv.clvCategory,
        loyaltyLevel: clv.loyaltyScore > 70 ? 'High' : clv.loyaltyScore > 40 ? 'Medium' : 'Low',
        investmentPriority: clv.clvCategory === 'high' ? 'Critical' : clv.clvCategory === 'medium' ? 'Important' : 'Monitor'
      },
      recommendations: generateCLVRecommendations(clv)
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to calculate CLV',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function updateLoyalty(body: any) {
  const { customerId, transactionAmount } = body;
  
  if (!customerId || transactionAmount === undefined || transactionAmount <= 0) {
    return NextResponse.json({ 
      error: 'Missing or invalid fields: customerId, transactionAmount (must be positive)' 
    }, { status: 400 });
  }
  
  try {
    const loyalty = CRMPlusIntegration.updateLoyalty(customerId, transactionAmount);
    const pointsEarned = Math.floor(transactionAmount / 100);
    
    return NextResponse.json({
      success: true,
      data: loyalty,
      transaction: {
        pointsEarned,
        newBalance: loyalty.pointsBalance,
        membershipLevel: loyalty.membershipLevel
      },
      benefits: {
        currentBenefits: loyalty.benefits,
        nextTierBenefits: getNextTierBenefits(loyalty.membershipLevel),
        pointsToNextTier: getPointsToNextTier(loyalty.pointsBalance, loyalty.membershipLevel)
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to update loyalty program',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function generateInsights(body: any) {
  const { customerId } = body;
  
  if (!customerId) {
    return NextResponse.json({ 
      error: 'Missing customerId' 
    }, { status: 400 });
  }
  
  try {
    const insights = CRMPlusIntegration.generateInsights(customerId);
    
    return NextResponse.json({
      success: true,
      data: insights,
      actionPlan: {
        urgency: insights.churnRisk === 'high' ? 'Immediate' : insights.churnRisk === 'medium' ? 'Within 7 days' : 'Within 30 days',
        expectedOutcome: `Potential revenue increase of ฿${insights.expectedROI * 100}`,
        campaignSuggestion: getCampaignSuggestion(insights)
      },
      timeline: {
        immediate: insights.churnRisk === 'high' ? 'Send retention offer today' : 'Schedule follow-up',
        shortTerm: 'Execute recommended action within timeframe',
        longTerm: 'Monitor results and adjust strategy'
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to generate insights',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getCRMAnalytics() {
  try {
    const analytics = CRMPlusIntegration.getCRMAnalytics();
    
    const insights = {
      customerHealth: analytics.averageCLV > 75000 ? 'Excellent' : 
                     analytics.averageCLV > 50000 ? 'Good' : 'Needs Improvement',
      
      loyaltyProgram: {
        engagement: (analytics.loyaltyDistribution.silver + analytics.loyaltyDistribution.gold + analytics.loyaltyDistribution.platinum) / 
                   analytics.totalCustomers * 100,
        premiumMembers: (analytics.loyaltyDistribution.gold + analytics.loyaltyDistribution.platinum)
      },
      
      riskAssessment: {
        highRisk: analytics.churnRisk.high,
        totalAtRisk: analytics.churnRisk.high + analytics.churnRisk.medium,
        retentionRequired: analytics.churnRisk.high > 0
      }
    };
    
    return NextResponse.json({
      success: true,
      data: analytics,
      insights,
      summary: {
        totalRevenuePotential: analytics.averageCLV * analytics.totalCustomers,
        loyaltyEngagement: `${insights.loyaltyProgram.engagement.toFixed(1)}%`,
        customersAtRisk: insights.riskAssessment.totalAtRisk,
        actionRequired: insights.riskAssessment.retentionRequired
      },
      recommendations: generateAnalyticsRecommendations(analytics, insights)
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get CRM analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getCustomerProfile(customerId?: string | null) {
  if (!customerId) {
    return NextResponse.json({ 
      error: 'Missing customerId parameter' 
    }, { status: 400 });
  }
  
  try {
    // This would normally fetch from the CRM system
    // For now, we'll return a mock profile
    const profile = {
      customerId,
      name: `Customer ${customerId.slice(-6)}`,
      clv: await calculateCLVForCustomer(customerId),
      loyalty: await getLoyaltyForCustomer(customerId),
      insights: await getInsightsForCustomer(customerId)
    };
    
    return NextResponse.json({
      success: true,
      data: profile,
      completeness: calculateProfileCompleteness(profile)
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get customer profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper functions
function generateCLVRecommendations(clv: any): string[] {
  const recommendations = [];
  
  if (clv.clvCategory === 'high') {
    recommendations.push('VIP treatment - prioritize this customer for premium services');
    recommendations.push('Consider exclusive offers and personalized experiences');
  } else if (clv.clvCategory === 'medium') {
    recommendations.push('Focus on increasing order frequency and value');
    recommendations.push('Implement targeted upselling campaigns');
  } else {
    recommendations.push('Work on building relationship and increasing engagement');
    recommendations.push('Offer entry-level promotions to increase spending');
  }
  
  if (clv.loyaltyScore < 40) {
    recommendations.push('Low loyalty score - implement retention strategies');
  }
  
  return recommendations;
}

function getNextTierBenefits(currentLevel: string): string[] {
  const tierBenefits = {
    bronze: ['10% discount', 'Birthday special'],
    silver: ['15% discount', 'Priority booking'],
    gold: ['20% discount', 'VIP treatment', 'Free consultation'],
    platinum: ['Already at highest tier']
  };
  
  const nextTier = {
    bronze: 'silver',
    silver: 'gold', 
    gold: 'platinum',
    platinum: 'platinum'
  };
  
  return tierBenefits[nextTier[currentLevel as keyof typeof nextTier] as keyof typeof tierBenefits] || [];
}

function getPointsToNextTier(currentPoints: number, currentLevel: string): number {
  const tierRequirements = {
    bronze: 2000,
    silver: 5000,
    gold: 10000,
    platinum: 0
  };
  
  const nextTier = {
    bronze: 'silver',
    silver: 'gold',
    gold: 'platinum',
    platinum: 'platinum'
  };
  
  const nextTierLevel = nextTier[currentLevel as keyof typeof nextTier] as keyof typeof tierRequirements;
  const requiredPoints = tierRequirements[nextTierLevel];
  
  return Math.max(0, requiredPoints - currentPoints);
}

function getCampaignSuggestion(insights: any): string {
  if (insights.churnRisk === 'high') {
    return 'Urgent Retention Campaign: "We Miss You" with 20% discount';
  } else if (insights.recommendedAction.includes('Upsell')) {
    return 'Premium Upgrade Campaign: Showcase advanced treatments';
  } else if (insights.recommendedAction.includes('Cross-sell')) {
    return 'Complementary Services Campaign: Bundle offerings';
  } else {
    return 'Regular Engagement Campaign: Health and beauty tips';
  }
}

function generateAnalyticsRecommendations(analytics: any, insights: any): string[] {
  const recommendations = [];
  
  if (insights.customerHealth === 'Needs Improvement') {
    recommendations.push('Focus on increasing average customer lifetime value');
  }
  
  if (insights.loyaltyProgram.engagement < 50) {
    recommendations.push('Improve loyalty program engagement through better benefits');
  }
  
  if (analytics.churnRisk.high > 0) {
    recommendations.push(`Immediate action required for ${analytics.churnRisk.high} high-risk customers`);
  }
  
  if (insights.loyaltyProgram.premiumMembers < analytics.totalCustomers * 0.2) {
    recommendations.push('Work on upgrading more customers to premium tiers');
  }
  
  return recommendations;
}

async function calculateCLVForCustomer(customerId: string): Promise<any> {
  // Mock transaction history for testing
  const mockTransactions = [
    { amount: 5000, date: '2025-01-15' },
    { amount: 8500, date: '2025-02-20' },
    { amount: 12000, date: '2025-03-10' }
  ];
  
  return CRMPlusIntegration.calculateCLV(customerId, mockTransactions);
}

async function getLoyaltyForCustomer(customerId: string): Promise<any> {
  return CRMPlusIntegration.updateLoyalty(customerId, 5000);
}

async function getInsightsForCustomer(customerId: string): Promise<any> {
  return CRMPlusIntegration.generateInsights(customerId);
}

function calculateProfileCompleteness(profile: any): number {
  let score = 0;
  if (profile.clv) score += 25;
  if (profile.loyalty) score += 25;
  if (profile.insights) score += 25;
  if (profile.name) score += 25;
  return score;
}
