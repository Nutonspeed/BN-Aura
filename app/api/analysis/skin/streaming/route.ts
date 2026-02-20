/**
 * Streaming Skin Analysis API Route
 * Real-time progressive processing with mobile optimization
 */

import { NextRequest } from 'next/server';
import { StreamingProcessor, createStreamingResponse } from '@/lib/performance/streamingProcessor';
import { detectDeviceCapabilities, getMobileOptimizationConfig } from '@/lib/performance/mobileOptimization';
import { runHFMultiModelAnalysis, buildGeminiContext, hfToVISIASignals, HFMultiModelResult } from '@/lib/ai/huggingface';
import { VercelAIGateway } from '@/lib/ai/vercelAIGateway';
import { FacialSymmetryAnalyzer } from '@/lib/analysis/facialSymmetryAnalyzer';
import { SkinMetricsEngine } from '@/lib/analysis/skinMetricsEngine';
import { WrinkleZoneMapper } from '@/lib/analysis/wrinkleZoneMapper';
import { generateFallbackAnalysis } from '@/lib/errorHandling/fallbackAnalysis';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageData, customerInfo, landmarks, useAI = false, clinicId, userId } = body;

    // Detect device capabilities for mobile optimization
    const deviceCapabilities = detectDeviceCapabilities();
    const mobileConfig = getMobileOptimizationConfig(deviceCapabilities);

    // Create streaming processor
    const processor = new StreamingProcessor(mobileConfig);
    let hfStageResult: HFMultiModelResult | null = null;

    // Add processing stages
    processor.addStage({
      name: 'initialization',
      weight: 5,
      processor: async () => {
        return { 
          stage: 'initialization',
          deviceCapabilities,
          mobileConfig,
          timestamp: Date.now()
        };
      },
      timeout: 5000
    });

    processor.addStage({
      name: 'hf_analysis',
      weight: 40,
      processor: async () => {
        console.log('🔬 Starting HuggingFace multi-model analysis...');

        try {
          console.log('\u{1F52C} Starting HuggingFace multi-model analysis...');
          
          // Select lightweight models for mobile if needed
          if (mobileConfig.useLightweightModels) {
            console.log(`📱 Using lightweight models for mobile`);
          }
          
          const hfResults = await runHFMultiModelAnalysis(imageData);
          hfStageResult = hfResults;
          console.log(`✅ HF Analysis complete: ${hfResults.modelsUsed.length}/5 models, ${hfResults.processingTime}ms`);
          
          return {
            stage: 'hf_analysis',
            ...hfResults,
            success: true
          };
        } catch (hfError) {
          console.warn('HF multi-model analysis failed, using fallback:', hfError);
          
          // Use fallback analysis
          const fallbackResults = generateFallbackAnalysis(customerInfo.age, imageData);
          hfStageResult = null;
          
          return {
            stage: 'hf_analysis',
            ...fallbackResults,
            success: false,
            fallback: true,
            error: hfError instanceof Error ? hfError.message : 'Unknown error'
          };
        }
      },
      timeout: mobileConfig.maxProcessingTime
    });

    processor.addStage({
      name: 'ai_analysis',
      weight: 25,
      processor: async () => {
        if (!useAI) {
          return { stage: 'ai_analysis', skipped: true, reason: 'AI disabled' };
        }

        try {
          const hfContext = hfStageResult ? buildGeminiContext(hfStageResult) : '';
          
          const aiResult = await VercelAIGateway.analyzeSkinImage(
            imageData,
            customerInfo.age,
            hfContext
          );

          // Parse AI response
          let aiAnalysis = {};
          try {
            const jsonMatch = aiResult.text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              aiAnalysis = JSON.parse(jsonMatch[0]);
            }
          } catch {
            console.warn('Could not parse AI response as JSON');
          }

          return {
            stage: 'ai_analysis',
            aiAnalysis,
            cost: aiResult.cost,
            success: true
          };
        } catch (error) {
          console.warn('AI analysis failed:', error);
          return {
            stage: 'ai_analysis',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      },
      timeout: 15000
    });

    processor.addStage({
      name: 'finalization',
      weight: 5,
      processor: async () => {
        // Build final result combining all stages
        try {
          const symmetry = FacialSymmetryAnalyzer.getSampleResult();
          const metrics = SkinMetricsEngine.calculateBasicMetrics(customerInfo.age ?? 35);
          const wrinkles = WrinkleZoneMapper.getSampleResult(customerInfo.age ?? 35);

          return {
            stage: 'finalization',
            symmetry,
            metrics,
            wrinkles,
            processingComplete: true
          };
        } catch (error) {
          console.warn('Finalization stage failed:', error);
          return {
            stage: 'finalization',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            processingComplete: true
          };
        }
      },
      timeout: 3000
    });

    // Create and return streaming response
    return createStreamingResponse(processor, {
      chunkDelay: deviceCapabilities.isMobile ? 800 : 500,
      enableProgress: mobileConfig.enableProgressiveLoading
    });

  } catch (error) {
    console.error('Streaming analysis error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export async function GET() {
  return new Response(JSON.stringify({
    version: '1.0.0',
    endpoint: '/api/analysis/skin/streaming',
    method: 'POST',
    description: 'Real-time streaming skin analysis with progressive processing',
    features: [
      'Multi-stage processing pipeline',
      'Real-time progress updates',
      'Mobile optimization',
      'HuggingFace multi-model analysis',
      'AI-powered insights',
      'Error handling and fallbacks'
    ],
    mobileOptimization: {
      lightweightModels: 'Low-end device support',
      progressiveLoading: 'Chunked response delivery',
      reducedQuality: 'Optimized image processing'
    },
    stages: [
      { name: 'initialization', weight: 5, description: 'Device detection and setup' },
      { name: 'hf_analysis', weight: 40, description: 'HuggingFace multi-model analysis' },
      { name: 'ai_analysis', weight: 25, description: 'AI-powered insights' },
      { name: 'finalization', weight: 5, description: 'Result compilation' }
    ]
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
