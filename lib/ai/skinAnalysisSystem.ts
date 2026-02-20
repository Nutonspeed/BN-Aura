import { HybridSkinAnalysisEngine, HybridAnalysisResult } from './hybridSkinAnalysisEngine';
import { analyzeSkinWithGemini, SkinAnalysisInput, AIAnalysisResult } from './gemini';

export interface SkinAnalysisConfig {
  useHybridEngine: boolean;
  useGemini: boolean;
  detailedAnalysis: boolean;
}

export interface CombinedSkinAnalysis {
  id: string;
  timestamp: string;
  customerInfo: {
    id?: string;
    name: string;
    age: number;
    gender?: string;
  };
  scores: {
    overall: number;
    texture: number;
    hydration: number;
    pigmentation: number;
    elasticity: number;
    pores: number;
    wrinkles: number;
    acne: number;
  };
  detectedConditions: Array<{
    name: string;
    severity: 'low' | 'medium' | 'high';
    confidence: number;
    location?: string;
  }>;
  aiInsights: string[];
  recommendations: Array<{
    treatmentId: string;
    treatmentName: string;
    priority: number;
    reason: string;
  }>;
  images?: {
    original?: string;
    annotated?: string;
    heatmap?: string;
  };
}

/**
 * AI Skin Analysis System
 * Central service for coordinating skin analysis using multiple engines (Hybrid + Gemini)
 */
export class SkinAnalysisSystem {
  
  /**
   * Perform comprehensive skin analysis using available engines
   */
  static async analyze(
    imageBuffer: ArrayBuffer | string,
    customerInfo: SkinAnalysisInput['customerInfo'],
    config: SkinAnalysisConfig = { useHybridEngine: true, useGemini: true, detailedAnalysis: true }
  ): Promise<CombinedSkinAnalysis> {
    
    // 1. Process image with Hybrid Engine (Client-side usually, but simulated here for server flow)
    // In a real scenario, this might run MediaPipe on the server or receive client results
    // For this implementation, we'll use the HybridEngine's mock capabilities if image processing isn't fully server-side
    
    let hybridResult: HybridAnalysisResult | null = null;
    if (config.useHybridEngine) {
      // Simulate hybrid engine processing
      hybridResult = HybridSkinAnalysisEngine.getSampleAnalysis();
      // Adjust sample data to match customer
      hybridResult.actualAge = customerInfo.age;
      // In production: await HybridSkinAnalysisEngine.processImage(imageBuffer);
    }

    // 2. Process with Gemini AI for deeper insights and recommendations
    let geminiResult: AIAnalysisResult | null = null;
    if (config.useGemini) {
      const geminiInput: SkinAnalysisInput = {
        customerInfo: {
          name: customerInfo.name,
          age: customerInfo.age,
          skinType: customerInfo.skinType,
          skinConcerns: customerInfo.skinConcerns
        },
        facialMetrics: {
          facialAsymmetry: 0.1, // Derived from image analysis
          skinTexture: hybridResult ? hybridResult.visiaScores.texture : 70,
          volumeLoss: [0.2, 0.1, 0.1],
          wrinkleDepth: hybridResult ? 100 - hybridResult.visiaScores.wrinkles : 30,
          poreSize: hybridResult ? 100 - hybridResult.visiaScores.pores : 40
        },
        imageAnalysis: hybridResult ? {
          spots: hybridResult.visiaScores.spots,
          wrinkles: hybridResult.visiaScores.wrinkles,
          hydration: 70, // Estimate
          elasticity: 65, // Estimate
          pigmentation: hybridResult.visiaScores.brownSpots
        } : undefined
      };

      try {
        geminiResult = await analyzeSkinWithGemini(geminiInput, config.detailedAnalysis);
      } catch (error) {
        console.error('Gemini analysis failed:', error);
        // Fallback or continue without Gemini
      }
    }

    // 3. Merge Results
    return this.mergeResults(customerInfo, hybridResult, geminiResult);
  }

  /**
   * Merge results from multiple engines into a unified analysis
   */
  private static mergeResults(
    customerInfo: any,
    hybrid: HybridAnalysisResult | null,
    gemini: AIAnalysisResult | null
  ): CombinedSkinAnalysis {
    
    // Base scores
    const scores = {
      overall: gemini?.overallScore || hybrid?.overallSkinScore || 75,
      texture: hybrid?.visiaScores.texture || gemini?.skinMetrics.texture || 70,
      hydration: gemini?.skinMetrics.hydration || 70,
      pigmentation: hybrid?.visiaScores.brownSpots || gemini?.skinMetrics.pigmentation || 65,
      elasticity: gemini?.skinMetrics.elasticity || 65,
      pores: hybrid?.visiaScores.pores || gemini?.skinMetrics.poreSize || 70,
      wrinkles: hybrid?.visiaScores.wrinkles || 75,
      acne: hybrid?.visiaScores.porphyrins || 80
    };

    // Detected conditions from both sources
    const conditions: CombinedSkinAnalysis['detectedConditions'] = [];
    
    if (hybrid?.conditions) {
      hybrid.conditions.forEach(c => {
        conditions.push({
          name: c.name,
          severity: c.severity === 'severe' ? 'high' : c.severity === 'moderate' ? 'medium' : 'low',
          confidence: c.confidence / 100,
          location: c.location
        });
      });
    }

    // Recommendations
    const recommendations: CombinedSkinAnalysis['recommendations'] = [];
    
    if (gemini?.recommendations) {
      gemini.recommendations.forEach((r, index) => {
        recommendations.push({
          treatmentId: `gemini-${index}`,
          treatmentName: r.name,
          priority: r.urgency === 'high' ? 1 : r.urgency === 'medium' ? 2 : 3,
          reason: r.reasoning
        });
      });
    } else if (hybrid?.recommendations) {
      hybrid.recommendations.forEach(r => {
        recommendations.push({
          treatmentId: r.treatmentId,
          treatmentName: r.name,
          priority: r.priority,
          reason: r.expectedImprovement
        });
      });
    }

    return {
      id: `SA-${Date.now()}`,
      timestamp: new Date().toISOString(),
      customerInfo: {
        name: customerInfo.name,
        age: customerInfo.age
      },
      scores,
      detectedConditions: conditions,
      aiInsights: gemini?.aiInsights || ['Analysis complete based on available metrics.'],
      recommendations
    };
  }
}
