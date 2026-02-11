import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import EnhancedFoodAnalysisEngine from '@/lib/ai/enhancedFoodAnalysisEngine';

// API route สำหรับ Enhanced AI Food Analysis
// ใช้ API ที่มีอยู่แล้วใน BN-Aura ร่วมกับ API ใหม่
export async function POST(request: NextRequest) {
  try {
    // รับข้อมูลจาก request
    const body = await request.json();
    const { image, userId, clinicId, userPreferences } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'กรุณาส่งรูปภาพ' },
        { status: 400 }
      );
    }

    if (!userId || !clinicId) {
      return NextResponse.json(
        { error: 'กรุณาระบุ userId และ clinicId' },
        { status: 400 }
      );
    }

    // ตรวจสอบ permissions
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'ไม่ได้รับอนุญาตให้เข้าถึง' },
        { status: 401 }
      );
    }

    // ตรวจสอบว่า user เป็นสมาชิกของ clinic หรือเป็น clinic owner
    const { data: clinicStaff, error: staffError } = await supabase
      .from('clinic_staff')
      .select('*')
      .eq('user_id', user.id)
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .single();

    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .select('owner_id')
      .eq('id', clinicId)
      .single();

    if (!clinic && !clinicStaff) {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์เข้าถึงคลินิกนี้' },
        { status: 403 }
      );
    }

    // ตรวจสอบว่าเป็นการวิเคราะห์ของตัวเองหรือลูกค้าที่ดูแลอยู่
    if (user.id !== userId && !clinicStaff) {
      // ถ้าเป็น staff ต้องตรวจสอบว่าลูกค้าเป็นของตัวเอง
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', userId)
        .eq('assigned_staff_id', user.id)
        .eq('clinic_id', clinicId)
        .single();

      if (!customer) {
        return NextResponse.json(
          { error: 'ไม่มีสิทธิ์วิเคราะห์ข้อมูลลูกค้าคนนี้' },
          { status: 403 }
        );
      }
    }

    // เริ่มการวิเคราะห์ด้วย Enhanced Engine
    const analysisEngine = new EnhancedFoodAnalysisEngine();
    
    // ตรวจสอบ API ที่มีอยู่
    const availableAPIs = analysisEngine.getAvailableAPIs();
    console.log('Available APIs:', availableAPIs);

    const analysisResult = await analysisEngine.analyzeFoodImage(image);

    // aiModelsUsed is already populated by the engine

    // บันทึกผลลัพธ์ลงฐานข้อมูล
    const { data: savedResult, error: saveError } = await supabase
      .from('food_analysis_results')
      .insert({
        user_id: userId,
        clinic_id: clinicId,
        image_url: null, // จะเก็บใน storage ภายหลัง
        image_storage_path: null,
        analysis_data: {
          components: analysisResult.components,
          confidence: analysisResult.confidence,
          image_analysis: analysisResult.imageAnalysis,
          apis_used: availableAPIs
        },
        nutrition_info: analysisResult.totalNutrition,
        confidence_score: analysisResult.confidence,
        processing_time_ms: analysisResult.processingTime
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save analysis result:', saveError);
      // ยังคงส่งผลลัพธ์กลับไปแม้ว่าจะบันทึกล้มเหลว
    }

    // อัปเดต session ประจำวัน
    const today = new Date().toISOString().split('T')[0];
    const { data: existingSession } = await supabase
      .from('food_analysis_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('clinic_id', clinicId)
      .eq('session_date', today)
      .single();

    if (existingSession) {
      await supabase
        .from('food_analysis_sessions')
        .update({
          total_calories: existingSession.total_calories + analysisResult.totalNutrition.calories,
          total_protein: existingSession.total_protein + analysisResult.totalNutrition.protein,
          total_carbs: existingSession.total_carbs + analysisResult.totalNutrition.carbs,
          total_fat: existingSession.total_fat + analysisResult.totalNutrition.fat,
          total_fiber: existingSession.total_fiber + analysisResult.totalNutrition.fiber,
          total_sugar: existingSession.total_sugar + 0, // ยังไม่มีข้อมูล sugar
          total_sodium: existingSession.total_sodium + analysisResult.totalNutrition.sodium,
          meals_analyzed: existingSession.meals_analyzed + 1,
          session_data: {
            ...existingSession.session_data,
            last_analysis: new Date().toISOString(),
            recommendations: analysisResult.recommendations,
            warnings: analysisResult.warnings,
            apis_used: availableAPIs
          }
        })
        .eq('id', existingSession.id);
    } else {
      await supabase
        .from('food_analysis_sessions')
        .insert({
          user_id: userId,
          clinic_id: clinicId,
          session_date: today,
          total_calories: analysisResult.totalNutrition.calories,
          total_protein: analysisResult.totalNutrition.protein,
          total_carbs: analysisResult.totalNutrition.carbs,
          total_fat: analysisResult.totalNutrition.fat,
          total_fiber: analysisResult.totalNutrition.fiber,
          total_sugar: 0,
          total_sodium: analysisResult.totalNutrition.sodium,
          meals_analyzed: 1,
          session_data: {
            first_analysis: new Date().toISOString(),
            recommendations: analysisResult.recommendations,
            warnings: analysisResult.warnings,
            apis_used: availableAPIs
          }
        });
    }

    // ส่งผลลัพธ์กลับ
    return NextResponse.json({
      success: true,
      result: {
        ...analysisResult,
        id: savedResult?.id,
        saved_at: savedResult?.created_at,
        apis_used: availableAPIs
      }
    });

  } catch (error) {
    console.error('Enhanced food analysis API error:', error);
    return NextResponse.json(
      { error: 'การวิเคราะห์อาหารล้มเหลว กรุณาลองใหม่' },
      { status: 500 }
    );
  }
}

// GET - ดูประวัติการวิเคราะห์
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const clinicId = searchParams.get('clinicId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!userId || !clinicId) {
      return NextResponse.json(
        { error: 'กรุณาระบุ userId และ clinicId' },
        { status: 400 }
      );
    }

    // ตรวจสอบ permissions
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'ไม่ได้รับอนุญาตให้เข้าถึง' },
        { status: 401 }
      );
    }

    // ตรวจสอบสิทธิ์
    const { data: clinicStaff, error: staffError } = await supabase
      .from('clinic_staff')
      .select('*')
      .eq('user_id', user.id)
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .single();

    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .select('owner_id')
      .eq('id', clinicId)
      .single();

    if (!clinic && !clinicStaff) {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์เข้าถึงคลินิกนี้' },
        { status: 403 }
      );
    }

    if (user.id !== userId && !clinicStaff) {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์ดูประวัติของผู้ใช้คนนี้' },
        { status: 403 }
      );
    }

    // ดึงประวัติการวิเคราะห์
    const { data: history, error: historyError } = await supabase
      .from('food_analysis_results')
      .select('*')
      .eq('user_id', userId)
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (historyError) {
      throw historyError;
    }

    return NextResponse.json({
      success: true,
      history: history || []
    });

  } catch (error) {
    console.error('Get enhanced food analysis history error:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถดึงประวัติการวิเคราะห์ได้' },
      { status: 500 }
    );
  }
}

// PUT - อัปเดตค่ากำหนดผู้ใช้
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, clinicId, preferences } = body;

    if (!userId || !clinicId || !preferences) {
      return NextResponse.json(
        { error: 'กรุณาระบุ userId, clinicId และ preferences' },
        { status: 400 }
      );
    }

    // ตรวจสอบ permissions
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'ไม่ได้รับอนุญาตให้เข้าถึง' },
        { status: 401 }
      );
    }

    // ตรวจสอบสิทธิ์
    const { data: clinicStaff, error: staffError } = await supabase
      .from('clinic_staff')
      .select('*')
      .eq('user_id', user.id)
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .single();

    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .select('owner_id')
      .eq('id', clinicId)
      .single();

    if (!clinic && !clinicStaff) {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์เข้าถึงคลินิกนี้' },
        { status: 403 }
      );
    }

    // อัปเดตหรือสร้างค่ากำหนดผู้ใช้
    const { data: existingPrefs, error: prefsError } = await supabase
      .from('user_food_preferences')
      .select('*')
      .eq('user_id', userId)
      .eq('clinic_id', clinicId)
      .single();

    let result;
    if (existingPrefs) {
      result = await supabase
        .from('user_food_preferences')
        .update({
          dietary_restrictions: preferences.dietary_restrictions || [],
          allergies: preferences.allergies || [],
          preferences: preferences.preferences || {},
          goals: preferences.goals || {},
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPrefs.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from('user_food_preferences')
        .insert({
          user_id: userId,
          clinic_id: clinicId,
          dietary_restrictions: preferences.dietary_restrictions || [],
          allergies: preferences.allergies || [],
          preferences: preferences.preferences || {},
          goals: preferences.goals || {}
        })
        .select()
        .single();
    }

    if (result.error) {
      throw result.error;
    }

    return NextResponse.json({
      success: true,
      preferences: result.data
    });

  } catch (error) {
    console.error('Update enhanced food preferences error:', error);
    return NextResponse.json(
      { error: 'ไม่สามารอัปเดตค่ากำหนดได้' },
      { status: 500 }
    );
  }
}

// GET - ตรวจสอบ API ที่มีอยู่
export async function OPTIONS(request: NextRequest) {
  try {
    const analysisEngine = new EnhancedFoodAnalysisEngine();
    const availableAPIs = analysisEngine.getAvailableAPIs();

    return NextResponse.json({
      success: true,
      available_apis: availableAPIs,
      status: {
        gemini: availableAPIs.gemini ? 'connected' : 'not_configured',
        huggingface: availableAPIs.huggingface ? 'connected' : 'not_configured',
        open_food_facts: 'connected (free, no key required)'
      },
      thai_foods_count: analysisEngine.getThaiFoodsCount(),
      features: [
        'multi_api_integration',
        'thai_food_specialization',
        'huggingface_food_model',
        'gemini_vision',
        'open_food_facts_free',
        'thai_food_database_100plus',
        'enhanced_accuracy',
        'real_time_analysis'
      ]
    });

  } catch (error) {
    console.error('API status check error:', error);
    return NextResponse.json(
      { error: 'ไม่สามารตรวจสอบสถานะะะ API' },
      { status: 500 }
    );
  }
}
