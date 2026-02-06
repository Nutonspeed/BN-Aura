import { NextRequest, NextResponse } from 'next/server';
import { AutomatedMarketingHub } from '@/lib/marketing/automatedMarketingHub';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'create-campaign';
    
    const body = await request.json();

    switch (action) {
      case 'create-campaign':
        return createCampaign(body);
        
      case 'add-customer':
        return addCustomer(body);
        
      case 'execute-campaign':
        return executeCampaign(body);
        
      case 'generate-content':
        return generatePersonalizedContent(body);
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Marketing automation API error:', error);
    return NextResponse.json(
      { error: 'Marketing automation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'analytics';
    const clinicId = searchParams.get('clinicId');
    const customerId = searchParams.get('customerId');

    switch (action) {
      case 'analytics':
        return getCampaignAnalytics(clinicId);
        
      case 'segments':
        return getCustomerSegments(clinicId);
        
      case 'personalized-content':
        return getPersonalizedContent(customerId);
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get marketing data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function createCampaign(body: any) {
  const { clinicId, name, type, targetSegment, subject, content } = body;
  
  if (!clinicId || !name || !type || !targetSegment || !subject || !content) {
    return NextResponse.json({ 
      error: 'Missing required fields: clinicId, name, type, targetSegment, subject, content' 
    }, { status: 400 });
  }
  
  try {
    const campaignId = AutomatedMarketingHub.createCampaign(
      clinicId, name, type, targetSegment, subject, content
    );
    
    return NextResponse.json({
      success: true,
      data: {
        campaignId,
        name,
        type,
        targetSegment
      },
      message: `Marketing campaign created: ${name}`
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to create campaign',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function addCustomer(body: any) {
  const { customerId, clinicId, name, email, skinType, concerns, lastVisit, totalSpent, engagementScore } = body;
  
  if (!customerId || !clinicId || !name || !email || !skinType) {
    return NextResponse.json({ 
      error: 'Missing required fields: customerId, clinicId, name, email, skinType' 
    }, { status: 400 });
  }
  
  try {
    const customerProfile = {
      customerId,
      clinicId,
      name,
      email,
      skinType,
      concerns: concerns || [],
      lastVisit: lastVisit || new Date().toISOString(),
      totalSpent: totalSpent || 0,
      engagementScore: engagementScore || 50
    };
    
    AutomatedMarketingHub.addCustomer(customerProfile);
    
    return NextResponse.json({
      success: true,
      data: customerProfile,
      message: `Customer profile added: ${name}`
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to add customer',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function executeCampaign(body: any) {
  const { campaignId } = body;
  
  if (!campaignId) {
    return NextResponse.json({ 
      error: 'Missing campaignId' 
    }, { status: 400 });
  }
  
  try {
    const performance = AutomatedMarketingHub.executeCampaign(campaignId);
    
    const conversionRate = performance.sent > 0 ? (performance.converted / performance.sent) * 100 : 0;
    const roi = performance.sent > 0 ? ((performance.revenue - (performance.sent * 2)) / (performance.sent * 2)) * 100 : 0;
    
    return NextResponse.json({
      success: true,
      data: {
        campaignId,
        performance,
        metrics: {
          conversionRate: conversionRate.toFixed(2),
          roi: roi.toFixed(2),
          revenuePerSend: performance.sent > 0 ? (performance.revenue / performance.sent).toFixed(2) : 0
        }
      },
      message: `Campaign executed: ${performance.sent} sent, ${performance.converted} converted`
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to execute campaign',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function generatePersonalizedContent(body: any) {
  const { customerId } = body;
  
  if (!customerId) {
    return NextResponse.json({ 
      error: 'Missing customerId' 
    }, { status: 400 });
  }
  
  try {
    const personalizedContent = AutomatedMarketingHub.generatePersonalizedContent(customerId);
    
    return NextResponse.json({
      success: true,
      data: {
        customerId,
        personalizedContent,
        timestamp: new Date().toISOString()
      },
      message: 'Personalized content generated successfully'
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to generate personalized content',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getCampaignAnalytics(clinicId?: string | null) {
  if (!clinicId) {
    return NextResponse.json({ 
      error: 'Missing clinicId' 
    }, { status: 400 });
  }
  
  try {
    const analytics = AutomatedMarketingHub.getCampaignAnalytics(clinicId);
    
    return NextResponse.json({
      success: true,
      data: analytics,
      insights: {
        performanceLevel: analytics.averageROI > 200 ? 'Excellent' :
                         analytics.averageROI > 100 ? 'Good' :
                         analytics.averageROI > 50 ? 'Fair' : 'Poor',
        recommendations: generateMarketingRecommendations(analytics)
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get campaign analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getCustomerSegments(clinicId?: string | null) {
  if (!clinicId) {
    return NextResponse.json({ 
      error: 'Missing clinicId' 
    }, { status: 400 });
  }
  
  try {
    const segments = AutomatedMarketingHub.segmentCustomers(clinicId);
    
    const segmentSummary = Object.entries(segments).map(([segmentName, customers]) => ({
      segmentName,
      customerCount: customers.length,
      averageSpent: customers.length > 0 
        ? customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length 
        : 0,
      topConcerns: getTopConcerns(customers)
    }));
    
    return NextResponse.json({
      success: true,
      data: {
        segments: segmentSummary,
        totalCustomers: Object.values(segments).flat().length,
        segmentTypes: ['high_value', 'acne_prone', 'anti_aging', 'dormant']
      },
      recommendations: generateSegmentRecommendations(segmentSummary)
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get customer segments',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getPersonalizedContent(customerId?: string | null) {
  if (!customerId) {
    return NextResponse.json({ 
      error: 'Missing customerId' 
    }, { status: 400 });
  }
  
  try {
    const personalizedContent = AutomatedMarketingHub.generatePersonalizedContent(customerId);
    
    return NextResponse.json({
      success: true,
      data: {
        customerId,
        content: personalizedContent,
        contentType: 'personalized_recommendation',
        generatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to generate personalized content',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateMarketingRecommendations(analytics: any): string[] {
  const recommendations = [];
  
  if (analytics.averageROI < 100) {
    recommendations.push('ROI is below 100% - consider improving targeting or content');
  }
  
  if (analytics.totalCampaigns < 5) {
    recommendations.push('Create more campaigns to test different segments');
  }
  
  if (analytics.totalRevenue < 50000) {
    recommendations.push('Focus on high-value customer segments to increase revenue');
  }
  
  return recommendations;
}

function getTopConcerns(customers: any[]): string[] {
  const concernCount = new Map();
  
  customers.forEach(customer => {
    customer.concerns.forEach((concern: string) => {
      concernCount.set(concern, (concernCount.get(concern) || 0) + 1);
    });
  });
  
  return Array.from(concernCount.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([concern]) => concern);
}

function generateSegmentRecommendations(segments: any[]): string[] {
  const recommendations = [];
  
  const highValueSegment = segments.find(s => s.segmentName === 'high_value');
  if (highValueSegment && highValueSegment.customerCount > 0) {
    recommendations.push('Focus retention campaigns on high-value customers');
  }
  
  const dormantSegment = segments.find(s => s.segmentName === 'dormant');
  if (dormantSegment && dormantSegment.customerCount > 10) {
    recommendations.push('Create win-back campaigns for dormant customers');
  }
  
  const acneSegment = segments.find(s => s.segmentName === 'acne_prone');
  if (acneSegment && acneSegment.customerCount > 5) {
    recommendations.push('Develop acne treatment promotions for younger demographics');
  }
  
  return recommendations;
}
