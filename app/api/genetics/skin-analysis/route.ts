import { NextRequest, NextResponse } from 'next/server';
import { SkinGeneticsAnalyzer, TreatmentGeneticCompatibility } from '@/lib/genetics/skinGeneticsAnalyzer';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      customerId,
      geneticData, // Array of genetic marker IDs
      treatmentIds // Optional: Array of treatment IDs to check compatibility
    } = body;

    // Validate required fields
    if (!customerId || !geneticData || !Array.isArray(geneticData)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: customerId, geneticData' 
        },
        { status: 400 }
      );
    }

    // Initialize genetics analyzer
    const geneticsAnalyzer = new SkinGeneticsAnalyzer();

    // Analyze genetic profile
    const geneticProfile = await geneticsAnalyzer.analyzeGeneticProfile(customerId, geneticData);

    // Get treatment compatibility if requested
    let treatmentCompatibility: TreatmentGeneticCompatibility[] = [];
    if (treatmentIds && Array.isArray(treatmentIds)) {
      treatmentCompatibility = await geneticsAnalyzer.getTreatmentsCompatibility(
        geneticProfile,
        treatmentIds
      );
    }

    // Store genetic analysis in database
    await storeGeneticAnalysis(customerId, geneticProfile);

    return NextResponse.json({
      success: true,
      data: {
        geneticProfile,
        treatmentCompatibility,
        summary: generateGeneticSummary(geneticProfile),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[Skin Genetics Analysis] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to analyze genetic profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required parameter: customerId' 
        },
        { status: 400 }
      );
    }

    // Initialize genetics analyzer
    const geneticsAnalyzer = new SkinGeneticsAnalyzer();

    // Get available genetic markers
    const availableMarkers = geneticsAnalyzer.getAllGeneticMarkers();
    
    // Get available treatment compatibilities
    const treatmentCompatibilities = geneticsAnalyzer.getAllTreatmentCompatibilities();

    // Get existing genetic profile if available
    const existingProfile = await getGeneticProfile(customerId);

    return NextResponse.json({
      success: true,
      data: {
        customerId,
        availableMarkers,
        treatmentCompatibilities,
        existingProfile,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[Skin Genetics GET] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get genetics data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function storeGeneticAnalysis(customerId: string, profile: any) {
  try {
    const supabase = await createClient();
    
    await supabase
      .from('genetic_analyses')
      .upsert({
        customer_id: customerId,
        genetic_profile: profile,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

  } catch (error) {
    console.error('Failed to store genetic analysis:', error);
    // Don't throw error, just log it
  }
}

async function getGeneticProfile(customerId: string) {
  try {
    const supabase = await createClient();
    
    const { data } = await supabase
      .from('genetic_analyses')
      .select('genetic_profile, created_at')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return data?.genetic_profile || null;

  } catch (error) {
    console.error('Failed to get genetic profile:', error);
    return null;
  }
}

function generateGeneticSummary(profile: any) {
  const highRiskConditions = Object.entries(profile.riskAssessment)
    .filter(([_, risk]: [string, any]) => risk.combinedRisk > 70)
    .map(([condition, _]) => condition);

  const topMarkers = profile.geneticMarkers
    .sort((a: any, b: any) => b.impactScore - a.impactScore)
    .slice(0, 3)
    .map((m: any) => ({
      name: m.name,
      significance: m.significance,
      impactScore: m.impactScore
    }));

  const lowPredispositions = Object.entries(profile.predispositions as Record<string, number>)
    .filter(([, value]) => value < 40)
    .map(([trait, value]) => ({ trait, value }));

  return {
    totalMarkers: profile.geneticMarkers.length,
    highRiskConditions,
    topMarkers,
    lowPredispositions,
    overallRiskLevel: calculateOverallRisk(profile.riskAssessment),
    primaryRecommendations: profile.recommendations.skincare.slice(0, 3)
  };
}

function calculateOverallRisk(riskAssessment: any): 'low' | 'medium' | 'high' {
  const risks = Object.values(riskAssessment).map((risk: any) => risk.combinedRisk);
  const averageRisk = risks.reduce((sum: number, risk: number) => sum + risk, 0) / risks.length;

  if (averageRisk < 40) return 'low';
  if (averageRisk < 70) return 'medium';
  return 'high';
}
