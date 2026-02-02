import { NextResponse } from 'next/server';
import { calculateLeadScore, createCustomerProfile } from '@/lib/scoring/leadScoring';
import { createClient } from '@/lib/supabase/client';
import { automationEngine } from '@/lib/automation/smartTriggers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { analysisData, engagementData, leadId, clinicId } = body;

    // Create customer profile from the provided data
    const customerProfile = createCustomerProfile(analysisData, engagementData);
    
    // Calculate lead score using the algorithm
    const leadScore = calculateLeadScore(customerProfile);

    // If leadId is provided, update the lead in database
    if (leadId) {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('sales_leads')
        .update({
          score: leadScore.totalScore,
          category: leadScore.category,
          confidence: leadScore.confidence,
          metadata: {
            scoring: {
              breakdown: leadScore.breakdown,
              reasoning: leadScore.reasoning,
              recommendations: leadScore.recommendations,
              updatedAt: new Date().toISOString()
            },
            customerProfile
          }
        })
        .eq('id', leadId);

      if (error) {
        console.error('Error updating lead score:', error);
        return NextResponse.json(
          { error: 'Failed to update lead score' },
          { status: 500 }
        );
      }

      // Check for automation triggers
      // We fire and forget this to not block the response
      if (clinicId) {
        automationEngine.checkLeadTriggers(leadId, leadScore.totalScore, clinicId).catch(err => {
          console.error('Automation trigger error:', err);
        });
      }
    }

    return NextResponse.json({
      success: true,
      leadScore,
      customerProfile,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Lead scoring error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate lead score' },
      { status: 500 }
    );
  }
}

// Get lead score for existing lead
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');

    if (!leadId) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    
    const { data: lead, error } = await supabase
      .from('sales_leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (error || !lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // If we have scoring metadata, return it
    if (lead.metadata?.scoring) {
      return NextResponse.json({
        success: true,
        leadScore: {
          totalScore: lead.score,
          category: lead.category,
          confidence: lead.confidence,
          ...lead.metadata.scoring
        },
        customerProfile: lead.metadata.customerProfile,
        lastUpdated: lead.metadata.scoring.updatedAt
      });
    }

    // Otherwise, recalculate if we have enough data
    if (lead.metadata?.analysisData) {
      const customerProfile = createCustomerProfile(
        lead.metadata.analysisData,
        lead.metadata.engagementData || {}
      );
      
      const leadScore = calculateLeadScore(customerProfile);

      return NextResponse.json({
        success: true,
        leadScore,
        customerProfile,
        recalculated: true
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Insufficient data to calculate lead score'
    });

  } catch (error) {
    console.error('Get lead score error:', error);
    return NextResponse.json(
      { error: 'Failed to get lead score' },
      { status: 500 }
    );
  }
}
