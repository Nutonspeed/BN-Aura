/**
 * Food Analysis API Route
 * Handles food image analysis and nutritional information
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/admin';
import FoodAnalysisEngine from '@/lib/ai/foodAnalysisEngine';

const foodEngine = new FoodAnalysisEngine();

export async function POST(request: NextRequest) {
  try {
    const { image, userId, clinicId, userPreferences } = await request.json();

    if (!image || !userId || !clinicId) {
      return NextResponse.json(
        { error: 'Missing required fields: image, userId, clinicId' },
        { status: 400 }
      );
    }

    // Validate user permissions
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has permission to analyze food for this clinic
    const adminClient = createAdminClient();
    const { data: staffData, error: staffError } = await adminClient
      .from('clinic_staff')
      .select('clinic_id, role, is_active')
      .eq('user_id', user.id)
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .single();

    if (staffError || !staffData) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Check clinic subscription limits
    const { data: clinicSettings, error: settingsError } = await adminClient
      .from('clinic_food_settings')
      .select('subscription_plan, usage_limits, is_active')
      .eq('clinic_id', clinicId)
      .single();

    if (settingsError || !clinicSettings || !clinicSettings.is_active) {
      return NextResponse.json(
        { error: 'Food analysis not enabled for this clinic' },
        { status: 403 }
      );
    }

    // Check usage limits
    const today = new Date().toISOString().split('T')[0];
    const { data: todayUsage, error: usageError } = await adminClient
      .from('food_analysis_results')
      .select('id')
      .eq('user_id', userId)
      .eq('clinic_id', clinicId)
      .gte('created_at', today)
      .limit(1);

    const usageCount = todayUsage?.length || 0;
    const maxUsage = clinicSettings.usage_limits?.analyses_per_day || 100;

    if (usageCount >= maxUsage) {
      return NextResponse.json(
        { error: 'Daily analysis limit reached' },
        { status: 429 }
      );
    }

    // Analyze food image
    const analysisResult = await foodEngine.analyzeFoodImage(image, userPreferences);

    if (!analysisResult.success) {
      return NextResponse.json(
        { error: 'Food analysis failed', details: analysisResult.recommendations },
        { status: 500 }
      );
    }

    // Store analysis result in database
    const { data: savedResult, error: saveError } = await adminClient
      .from('food_analysis_results')
      .insert({
        user_id: userId,
        clinic_id: clinicId,
        image_url: null, // Will be updated after image upload
        analysis_data: {
          foodItems: analysisResult.foodItems,
          confidence: analysisResult.confidence,
          processingTimeMs: analysisResult.processingTimeMs
        },
        nutrition_info: analysisResult.overallNutrition,
        confidence_score: analysisResult.confidence,
        processing_time_ms: analysisResult.processingTimeMs
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save analysis result:', saveError);
      return NextResponse.json(
        { error: 'Failed to save analysis result' },
        { status: 500 }
      );
    }

    // Update or create daily session
    const { data: sessionData, error: sessionError } = await adminClient
      .from('food_analysis_sessions')
      .upsert({
        user_id: userId,
        clinic_id: clinicId,
        session_date: today,
        total_calories: analysisResult.overallNutrition.totalCalories,
        total_protein: analysisResult.overallNutrition.totalProtein,
        total_carbs: analysisResult.overallNutrition.totalCarbs,
        total_fat: analysisResult.overallNutrition.totalFat,
        total_fiber: analysisResult.overallNutrition.totalFiber,
        total_sugar: analysisResult.overallNutrition.totalSugar,
        total_sodium: analysisResult.overallNutrition.totalSodium,
        meals_analyzed: usageCount + 1,
        session_data: {
          last_analysis: savedResult.id,
          recommendations: analysisResult.recommendations,
          warnings: analysisResult.warnings
        }
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Failed to update session:', sessionError);
    }

    return NextResponse.json({
      success: true,
      analysisId: savedResult.id,
      foodItems: analysisResult.foodItems,
      overallNutrition: analysisResult.overallNutrition,
      confidence: analysisResult.confidence,
      processingTimeMs: analysisResult.processingTimeMs,
      recommendations: analysisResult.recommendations,
      warnings: analysisResult.warnings,
      usageCount: usageCount + 1,
      maxUsage: maxUsage
    });

  } catch (error) {
    console.error('Food analysis API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const clinicId = searchParams.get('clinicId');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (!userId || !clinicId) {
      return NextResponse.json(
        { error: 'Missing required parameters: userId, clinicId' },
        { status: 400 }
      );
    }

    // Validate user permissions
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has permission to view data for this clinic
    const adminClient = createAdminClient();
    const { data: staffData, error: staffError } = await adminClient
      .from('clinic_staff')
      .select('clinic_id, role, is_active')
      .eq('user_id', user.id)
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .single();

    if (staffError || !staffData) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Get analysis history
    const { data: analysisHistory, error: historyError } = await adminClient
      .from('food_analysis_results')
      .select('*')
      .eq('user_id', userId)
      .eq('clinic_id', clinicId)
      .gte('created_at', date + 'T00:00:00Z')
      .lte('created_at', date + 'T23:59:59Z')
      .order('created_at', { ascending: false });

    if (historyError) {
      console.error('Failed to fetch analysis history:', historyError);
      return NextResponse.json(
        { error: 'Failed to fetch analysis history' },
        { status: 500 }
      );
    }

    // Get daily session data
    const { data: sessionData, error: sessionError } = await adminClient
      .from('food_analysis_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('clinic_id', clinicId)
      .eq('session_date', date)
      .single();

    if (sessionError && sessionError.code !== 'PGRST116') {
      console.error('Failed to fetch session data:', sessionError);
    }

    return NextResponse.json({
      success: true,
      analysisHistory: analysisHistory || [],
      sessionData: sessionData || null,
      date: date
    });

  } catch (error) {
    console.error('Food analysis GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId, clinicId, preferences } = await request.json();

    if (!userId || !clinicId || !preferences) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, clinicId, preferences' },
        { status: 400 }
      );
    }

    // Validate user permissions
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has permission to update preferences for this clinic
    const adminClient = createAdminClient();
    const { data: staffData, error: staffError } = await adminClient
      .from('clinic_staff')
      .select('clinic_id, role, is_active')
      .eq('user_id', user.id)
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .single();

    if (staffError || !staffData) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Update user preferences
    const { data: updatedPreferences, error: updateError } = await adminClient
      .from('user_food_preferences')
      .upsert({
        user_id: userId,
        clinic_id: clinicId,
        dietary_restrictions: preferences.dietaryRestrictions || [],
        allergies: preferences.allergies || [],
        preferences: preferences.preferences || {},
        goals: preferences.goals || {}
      })
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update preferences:', updateError);
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      preferences: updatedPreferences
    });

  } catch (error) {
    console.error('Food analysis PUT API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
