import { NextRequest, NextResponse } from 'next/server';
import { TreatmentSuccessPredictor, type PatientProfile } from '@/lib/ai/treatmentSuccessPredictor';
import { createClient } from '@/lib/supabase/server';
import { aiMonitor } from '@/lib/monitoring/aiPipelineMonitor';

export async function POST(request: NextRequest) {
  let operationId: string | undefined;
  
  try {
    const body = await request.json();
    const { 
      customerId, 
      patientProfile, 
      treatmentIds,
      clinicId 
    } = body;

    // Validate required fields
    if (!patientProfile || !treatmentIds || !Array.isArray(treatmentIds)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: patientProfile, treatmentIds' 
        },
        { status: 400 }
      );
    }

    // Validate patient profile structure
    const requiredFields = ['age', 'gender', 'skinType'];
    for (const field of requiredFields) {
      if (!patientProfile[field]) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Missing required patient profile field: ${field}` 
          },
          { status: 400 }
        );
      }
    }

    // Start monitoring
    operationId = aiMonitor.startOperation('treatmentPrediction', {
      endpoint: 'POST',
      treatmentCount: treatmentIds?.length || 0,
      customerId: customerId || 'anonymous'
    });

    // Initialize predictor
    const predictor = new TreatmentSuccessPredictor();

    // Get predictions
    const predictions = await predictor.predictTreatmentSuccess(
      patientProfile as PatientProfile,
      treatmentIds
    );

    // Log prediction for analytics
    if (customerId && clinicId) {
      await logPrediction(customerId, clinicId, treatmentIds, predictions);
    }

    // End monitoring with success
    aiMonitor.endOperation(operationId, {
      success: true,
      predictionCount: predictions.length,
      averageConfidence: predictions.reduce((sum, p) => sum + p.confidenceScore, 0) / predictions.length
    });

    return NextResponse.json({
      success: true,
      data: {
        predictions,
        summary: {
          totalTreatments: predictions.length,
          averageSuccess: Math.round(
            predictions.reduce((sum, p) => sum + p.successProbability, 0) / predictions.length
          ),
          topRecommendation: predictions[0],
          confidence: Math.round(
            predictions.reduce((sum, p) => sum + p.confidenceScore, 0) / predictions.length
          )
        },
        timestamp: new Date().toISOString(),
        processingTime: predictions[0]?.processingTime || 0
      }
    });

  } catch (error) {
    console.error('[Treatment Success Prediction] Error:', error);
    
    // End monitoring with error if operation was started
    if (operationId) {
      aiMonitor.endOperation(operationId, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate treatment success predictions',
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
    const clinicId = searchParams.get('clinicId');

    if (!customerId || !clinicId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required parameters: customerId, clinicId' 
        },
        { status: 400 }
      );
    }

    // Get customer's profile from database
    const supabase = await createClient();
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Customer not found' 
        },
        { status: 404 }
      );
    }

    // Get available treatments for the clinic
    const { data: treatments } = await supabase
      .from('treatments')
      .select('id, names, category, price_min, price_max')
      .eq('clinic_id', clinicId);

    if (!treatments) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No treatments found for this clinic' 
        },
        { status: 404 }
      );
    }

    // Build patient profile from customer data
    const patientProfile: PatientProfile = {
      age: customer.age || 30,
      gender: customer.gender || 'female',
      skinType: customer.skin_type || 'normal',
      skinConditions: customer.skin_conditions || [],
      previousTreatments: customer.previous_treatments || [],
      lifestyleFactors: customer.lifestyle_factors || {
        stress: 'medium',
        sleep: 'average',
        diet: 'average',
        smoking: false,
        alcohol: 'occasional'
      },
      environmentalFactors: customer.environmental_factors || {
        pollution: 'medium',
        sunExposure: 'medium',
        climate: 'temperate'
      }
    };

    // Get predictions for all available treatments
    const treatmentIds = treatments.map(t => t.id);
    const predictor = new TreatmentSuccessPredictor();
    const predictions = await predictor.predictTreatmentSuccess(
      patientProfile,
      treatmentIds
    );

    return NextResponse.json({
      success: true,
      data: {
        customer: {
          id: customer.id,
          name: customer.full_name,
          age: patientProfile.age,
          skinType: patientProfile.skinType
        },
        patientProfile,
        predictions,
        availableTreatments: treatments,
        summary: {
          totalTreatments: predictions.length,
          averageSuccess: Math.round(
            predictions.reduce((sum, p) => sum + p.successProbability, 0) / predictions.length
          ),
          topRecommendation: predictions[0],
          confidence: Math.round(
            predictions.reduce((sum, p) => sum + p.confidenceScore, 0) / predictions.length
          )
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[Treatment Success Prediction GET] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get treatment predictions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function logPrediction(
  customerId: string, 
  clinicId: string, 
  treatmentIds: string[], 
  predictions: any[]
) {
  try {
    const supabase = await createClient();
    
    // Log prediction request for analytics
    await supabase
      .from('prediction_logs')
      .insert({
        customer_id: customerId,
        clinic_id: clinicId,
        treatment_ids: treatmentIds,
        predictions: predictions,
        created_at: new Date().toISOString()
      });

  } catch (error) {
    console.error('Failed to log prediction:', error);
    // Don't throw error, just log it
  }
}