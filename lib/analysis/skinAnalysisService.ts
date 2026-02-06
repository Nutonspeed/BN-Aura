/**
 * Skin Analysis Service
 * Handles saving and retrieving skin analysis data from Supabase
 */

import { createClient } from '@/lib/supabase/client';

interface SaveAnalysisInput {
  customerId?: string;
  clinicId: string;
  userId?: string;
  salesRepId?: string;
  imageUrl?: string;
  actualAge: number;
  
  // Overall Scores
  overallScore: number;
  skinAge: number;
  skinHealthGrade?: string;
  skinType?: string;
  
  // Symmetry
  symmetryScore?: number;
  goldenRatio?: number;
  goldenRatioScore?: number;
  facialThirds?: any;
  leftRightComparison?: any;
  
  // 8 Metrics
  spotsScore?: number;
  wrinklesScore?: number;
  textureScore?: number;
  poresScore?: number;
  uvSpotsScore?: number;
  brownSpotsScore?: number;
  redAreasScore?: number;
  porphyrinsScore?: number;
  
  // Wrinkle Analysis
  wrinkleZones?: any[];
  wrinkleLevel?: number;
  totalWrinkleCount?: number;
  
  // Detections & Recommendations
  spotsDetections?: any;
  recommendations?: any[];
  
  // Time Travel
  timeTravelData?: any;
  
  // Skin Twins
  skinTwinMatches?: any;
  skinTwinCount?: number;
  
  // Metadata
  modelsUsed?: string[];
  processingTimeMs?: number;
  confidenceScore?: number;
}

interface AnalysisResult {
  id: string;
  success: boolean;
  error?: string;
}

interface AnalysisHistory {
  analyses: any[];
  total: number;
  hasMore: boolean;
}

class SkinAnalysisService {
  
  /**
   * Save a new skin analysis to the database
   */
  static async saveAnalysis(input: SaveAnalysisInput): Promise<AnalysisResult> {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('skin_analyses')
        .insert({
          customer_id: input.customerId,
          clinic_id: input.clinicId,
          user_id: input.userId,
          sales_rep_id: input.salesRepId,
          image_url: input.imageUrl || '',
          actual_age: input.actualAge,
          
          // Overall
          overall_score: input.overallScore,
          skin_age: input.skinAge,
          skin_health_grade: input.skinHealthGrade,
          skin_type: input.skinType,
          
          // Symmetry
          symmetry_score: input.symmetryScore,
          golden_ratio: input.goldenRatio,
          golden_ratio_score: input.goldenRatioScore,
          facial_thirds: input.facialThirds,
          left_right_comparison: input.leftRightComparison,
          
          // 8 Metrics
          spots_score: input.spotsScore,
          wrinkles_score: input.wrinklesScore,
          texture_score: input.textureScore,
          pores_score: input.poresScore,
          uv_spots_score: input.uvSpotsScore,
          brown_spots_score: input.brownSpotsScore,
          red_areas_score: input.redAreasScore,
          porphyrins_score: input.porphyrinsScore,
          
          // Wrinkle Analysis
          wrinkle_zones: input.wrinkleZones,
          wrinkle_level: input.wrinkleLevel,
          total_wrinkle_count: input.totalWrinkleCount,
          
          // Detections & Recommendations
          spots_detections: input.spotsDetections,
          recommendations: input.recommendations,
          
          // Time Travel
          time_travel_data: input.timeTravelData,
          time_travel_generated_at: input.timeTravelData ? new Date().toISOString() : null,
          
          // Skin Twins
          skin_twin_matches: input.skinTwinMatches,
          skin_twin_count: input.skinTwinCount,
          
          // Metadata
          models_used: input.modelsUsed,
          processing_time_ms: input.processingTimeMs,
          confidence_score: input.confidenceScore,
          analysis_version: 'v2.0',
        })
        .select('id')
        .single();

      if (error) {
        console.error('Save analysis error:', error);
        return { id: '', success: false, error: error.message };
      }

      return { id: data.id, success: true };
    } catch (error: any) {
      console.error('Save analysis exception:', error);
      return { id: '', success: false, error: error.message };
    }
  }

  /**
   * Get analysis by ID
   */
  static async getAnalysis(analysisId: string): Promise<any | null> {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('skin_analyses')
        .select(`
          *,
          customer:customers(id, full_name, phone, email),
          clinic:clinics(id, display_name)
        `)
        .eq('id', analysisId)
        .single();

      if (error) {
        console.error('Get analysis error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Get analysis exception:', error);
      return null;
    }
  }

  /**
   * Get analysis history for a customer
   */
  static async getCustomerHistory(
    customerId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<AnalysisHistory> {
    try {
      const supabase = createClient();
      
      const { data, error, count } = await supabase
        .from('skin_analyses')
        .select('*', { count: 'exact' })
        .eq('customer_id', customerId)
        .order('analyzed_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Get history error:', error);
        return { analyses: [], total: 0, hasMore: false };
      }

      return {
        analyses: data || [],
        total: count || 0,
        hasMore: (count || 0) > offset + limit,
      };
    } catch (error) {
      console.error('Get history exception:', error);
      return { analyses: [], total: 0, hasMore: false };
    }
  }

  /**
   * Get clinic analysis statistics
   */
  static async getClinicStats(clinicId: string, days: number = 30): Promise<any> {
    try {
      const supabase = createClient();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('skin_analyses')
        .select('overall_score, skin_age, actual_age, analyzed_at')
        .eq('clinic_id', clinicId)
        .gte('analyzed_at', startDate.toISOString());

      if (error) {
        console.error('Get stats error:', error);
        return null;
      }

      const analyses = data || [];
      const totalAnalyses = analyses.length;
      
      if (totalAnalyses === 0) {
        return {
          totalAnalyses: 0,
          averageScore: 0,
          averageSkinAge: 0,
          averageAgeDifference: 0,
        };
      }

      const avgScore = analyses.reduce((sum, a) => sum + (a.overall_score || 0), 0) / totalAnalyses;
      const avgSkinAge = analyses.reduce((sum, a) => sum + (a.skin_age || 0), 0) / totalAnalyses;
      const avgAgeDiff = analyses.reduce((sum, a) => sum + ((a.skin_age || 0) - (a.actual_age || 0)), 0) / totalAnalyses;

      return {
        totalAnalyses,
        averageScore: Math.round(avgScore * 10) / 10,
        averageSkinAge: Math.round(avgSkinAge * 10) / 10,
        averageAgeDifference: Math.round(avgAgeDiff * 10) / 10,
        period: `${days} days`,
      };
    } catch (error) {
      console.error('Get stats exception:', error);
      return null;
    }
  }

  /**
   * Compare two analyses (progress tracking)
   */
  static async compareAnalyses(analysisId1: string, analysisId2: string): Promise<any> {
    try {
      const [analysis1, analysis2] = await Promise.all([
        this.getAnalysis(analysisId1),
        this.getAnalysis(analysisId2),
      ]);

      if (!analysis1 || !analysis2) {
        return null;
      }

      const calculateChange = (v1: number, v2: number) => ({
        before: v1,
        after: v2,
        change: v2 - v1,
        percentChange: v1 > 0 ? Math.round(((v2 - v1) / v1) * 100) : 0,
      });

      return {
        overallScore: calculateChange(analysis1.overall_score, analysis2.overall_score),
        skinAge: calculateChange(analysis1.skin_age, analysis2.skin_age),
        metrics: {
          spots: calculateChange(analysis1.spots_score, analysis2.spots_score),
          wrinkles: calculateChange(analysis1.wrinkles_score, analysis2.wrinkles_score),
          texture: calculateChange(analysis1.texture_score, analysis2.texture_score),
          pores: calculateChange(analysis1.pores_score, analysis2.pores_score),
        },
        daysBetween: Math.floor(
          (new Date(analysis2.analyzed_at).getTime() - new Date(analysis1.analyzed_at).getTime()) 
          / (1000 * 60 * 60 * 24)
        ),
      };
    } catch (error) {
      console.error('Compare analyses exception:', error);
      return null;
    }
  }

  /**
   * Log AI usage for billing/analytics
   */
  static async logAIUsage(
    clinicId: string,
    userId: string,
    usageType: string,
    modelUsed: string,
    tokensConsumed: number,
    costUsd: number,
    processingTimeMs: number,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    try {
      const supabase = createClient();
      
      await supabase.from('ai_usage_logs').insert({
        clinic_id: clinicId,
        user_id: userId,
        usage_type: usageType,
        model_used: modelUsed,
        tokens_consumed: tokensConsumed,
        cost_usd: costUsd,
        processing_time_ms: processingTimeMs,
        success,
        error_message: errorMessage,
      });
    } catch (error) {
      console.error('Log AI usage error:', error);
    }
  }
}

export { SkinAnalysisService };
export type { SaveAnalysisInput, AnalysisResult, AnalysisHistory };
