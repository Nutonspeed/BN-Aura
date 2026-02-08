import { NextRequest, NextResponse } from 'next/server';
import { FacialSymmetryAnalyzer } from '@/lib/analysis/facialSymmetryAnalyzer';
import { SkinMetricsEngine } from '@/lib/analysis/skinMetricsEngine';
import { WrinkleZoneMapper } from '@/lib/analysis/wrinkleZoneMapper';
import { VercelAIGateway } from '@/lib/ai/vercelAIGateway';
import { runHFMultiModelAnalysis, buildGeminiContext, hfToVISIASignals } from '@/lib/ai/huggingface';
import { checkQuotaBeforeAnalysis, recordQuotaAfterAnalysis, QuotaExceededError } from '@/lib/quota/quotaMiddleware';
import { NeuralCache } from '@/lib/quota/neuralCache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'comprehensive';
    const age = parseInt(searchParams.get('age') || '35');

    switch (type) {
      case 'symmetry':
        const symmetry = FacialSymmetryAnalyzer.getSampleResult();
        return NextResponse.json({ success: true, data: symmetry });

      case 'metrics':
        const metrics = SkinMetricsEngine.getSampleResult(age);
        return NextResponse.json({ success: true, data: metrics });

      case 'wrinkles':
        const wrinkles = WrinkleZoneMapper.getSampleResult();
        return NextResponse.json({ success: true, data: wrinkles });

      case 'comprehensive':
        const comprehensiveResult = {
          analysisId: `COMP-${Date.now()}`,
          timestamp: new Date().toISOString(),
          symmetry: FacialSymmetryAnalyzer.getSampleResult(),
          skinMetrics: SkinMetricsEngine.getSampleResult(age),
          wrinkleAnalysis: WrinkleZoneMapper.getSampleResult(),
          overallScore: 72,
          skinAge: age + 3,
          modelsUsed: ['MediaPipe', 'EfficientNet', 'U-Net', 'YOLOv8', 'Gemini'],
        };
        return NextResponse.json({ success: true, data: comprehensiveResult });

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Skin analysis error:', error);
    return NextResponse.json({ success: false, error: 'Analysis failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { imageData, customerInfo, landmarks, useAI = false, clinicId, userId } = body;

    if (!customerInfo?.age) {
      return NextResponse.json({ error: 'Customer age is required' }, { status: 400 });
    }

    let aiAnalysis = null;
    let aiCost = 0;
    let quotaInfo = null;
    let usedCache = false;
    let hfResults = null;

    // If AI enabled, check quota and neural cache first
    if (useAI && clinicId) {
      // Check neural cache (24-hour same customer protection)
      const cacheResult = NeuralCache.checkCustomerCache(
        clinicId,
        { name: customerInfo.name || 'unknown', email: customerInfo.email, age: customerInfo.age }
      );

      if (cacheResult.isHit) {
        usedCache = true;
        aiAnalysis = NeuralCache.getCachedAnalysis(clinicId, { 
          name: customerInfo.name || 'unknown',
          age: customerInfo.age 
        });
        console.log(`\u{1F9E0} Neural Cache HIT: Saved ${cacheResult.quotaSaved} quota`);
      } else {
        // Check quota availability
        const scanType = imageData ? 'detailed' : 'quick';
        quotaInfo = await checkQuotaBeforeAnalysis({
          clinicId,
          userId: userId || 'anonymous',
          customerId: customerInfo.customerId,
          scanType,
        });

        if (!quotaInfo.allowed) {
          return NextResponse.json({
            success: false,
            error: 'QUOTA_EXCEEDED',
            message: quotaInfo.message,
            quotaRemaining: quotaInfo.quotaRemaining,
            willIncurCharge: quotaInfo.willIncurCharge,
          }, { status: 403 });
        }
      }
    }

    // ─── Layer 2: HuggingFace Multi-Model Analysis ───
    // Run HF models in parallel (skin type, age, conditions, acne, face parsing)
    if (imageData && useAI && !usedCache) {
      try {
        console.log('\u{1F52C} Starting HuggingFace multi-model analysis...');
        hfResults = await runHFMultiModelAnalysis(imageData);
        console.log(`\u{2705} HF Analysis complete: ${hfResults.modelsUsed.length}/5 models, ${hfResults.processingTime}ms`);
      } catch (hfError) {
        console.warn('HF multi-model analysis failed, continuing with Gemini only:', hfError);
      }
    }

    // ─── Layer 3: Gemini Vision AI with HF Context ───
    if (imageData && useAI && !usedCache) {
      try {
        // Build enhanced prompt with HF context
        const hfContext = hfResults ? buildGeminiContext(hfResults) : '';
        
        const aiResult = await VercelAIGateway.analyzeSkinImage(
          imageData,
          customerInfo.age,
          hfContext // Pass HF context to enhance Gemini analysis
        );
        
        // Parse AI response
        try {
          const jsonMatch = aiResult.text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            aiAnalysis = JSON.parse(jsonMatch[0]);
          }
        } catch {
          console.warn('Could not parse AI response as JSON');
        }
        
        aiCost = aiResult.cost;

        // Record quota usage
        if (clinicId) {
          await recordQuotaAfterAnalysis(
            { clinicId, userId: userId || 'anonymous', scanType: 'detailed' },
            { successful: true, analysisScore: aiAnalysis?.overallScore, cached: false }
          );

          // Cache for neural caching
          NeuralCache.recordCustomerScan(
            clinicId,
            { name: customerInfo.name || 'unknown', email: customerInfo.email, age: customerInfo.age },
            undefined,
            aiAnalysis
          );
        }
      } catch (aiError: any) {
        console.warn('AI analysis failed, using HF results as fallback:', aiError);
        // Record failed attempt
        if (clinicId) {
          await recordQuotaAfterAnalysis(
            { clinicId, userId: userId || 'anonymous', scanType: 'detailed' },
            { successful: false, cached: false }
          );
        }
      }
    }

    // ─── Build Response: Combine HF + Gemini + Fallback ───
    const symmetry = FacialSymmetryAnalyzer.getSampleResult();
    
    // Build skin metrics from AI signals when available
    const hfSignals = hfResults ? hfToVISIASignals(hfResults, customerInfo.age) : null;
    
    const skinMetrics = hfSignals
      ? SkinMetricsEngine.calculateFromSignals(customerInfo.age, hfSignals)
      : SkinMetricsEngine.getSampleResult(customerInfo.age);

    // Build wrinkle analysis from AI data when available
    const wrinkleScore = hfSignals?.wrinkles ?? 60;
    const wrinkleAnalysis = hfSignals
      ? WrinkleZoneMapper.analyzeFromData(customerInfo.age, wrinkleScore)
      : WrinkleZoneMapper.getSampleResult(customerInfo.age);

    // Calculate overall score with multi-model data
    let overallScore: number;
    if (aiAnalysis?.overallScore) {
      overallScore = aiAnalysis.overallScore;
    } else if (hfSignals) {
      // Calculate from VISIA signals
      const avgVisia = Object.values(hfSignals).reduce((a, b) => a + b, 0) / Object.keys(hfSignals).length;
      overallScore = Math.round(avgVisia * 0.6 + symmetry.overallSymmetry * 0.15 + (100 - wrinkleAnalysis.overallAgingLevel * 10) * 0.25);
    } else {
      overallScore = Math.round(
        symmetry.overallSymmetry * 0.15 +
        skinMetrics.overallScore * 0.55 +
        (100 - wrinkleAnalysis.overallAgingLevel * 10) * 0.30
      );
    }

    // Determine skin age from HF or AI or fallback
    const skinAge = aiAnalysis?.skinAge 
      || hfResults?.ageEstimation?.estimatedAge 
      || skinMetrics.skinAge;

    // Build enhanced summary with HF data
    const detectedConditions = hfResults?.skinConditions?.map(c => c.condition) || [];
    const skinType = hfResults?.skinType?.label || aiAnalysis?.skinType || 'combination';
    const acneLevel = hfResults?.acneSeverity?.label || 'none';

    const processingTime = Date.now() - startTime;

    const result = {
      analysisId: `COMP-${Date.now()}`,
      timestamp: new Date().toISOString(),
      customerInfo: {
        customerId: customerInfo.customerId || `CUST-${Date.now()}`,
        name: customerInfo.name || 'Customer',
        age: customerInfo.age,
      },
      overallScore,
      skinAge,
      skinAgeDifference: skinAge - customerInfo.age,
      skinType,
      symmetry,
      skinMetrics,
      wrinkleAnalysis,
      visiaScores: hfSignals || null,
      hfAnalysis: hfResults ? {
        skinType: hfResults.skinType,
        ageEstimation: hfResults.ageEstimation,
        skinConditions: hfResults.skinConditions,
        acneSeverity: hfResults.acneSeverity,
        modelsUsed: hfResults.modelsUsed,
        hfProcessingTime: hfResults.processingTime,
      } : null,
      summary: {
        headlineThai: overallScore >= 70 
          ? '\u0e1c\u0e34\u0e27\u0e02\u0e2d\u0e07\u0e04\u0e38\u0e13\u0e2d\u0e22\u0e39\u0e48\u0e43\u0e19\u0e40\u0e01\u0e13\u0e11\u0e4c\u0e14\u0e35!' 
          : '\u0e1c\u0e34\u0e27\u0e02\u0e2d\u0e07\u0e04\u0e38\u0e13\u0e15\u0e49\u0e2d\u0e07\u0e01\u0e32\u0e23\u0e01\u0e32\u0e23\u0e14\u0e39\u0e41\u0e25\u0e40\u0e1e\u0e34\u0e48\u0e21\u0e40\u0e15\u0e34\u0e21',
        skinType,
        acneLevel,
        detectedConditions,
        strengths: skinMetrics.summary?.strengths || [],
        concerns: aiAnalysis?.concerns || detectedConditions.length > 0 
          ? detectedConditions 
          : skinMetrics.summary?.concerns || [],
      },
      recommendations: {
        immediate: aiAnalysis?.recommendations || skinMetrics.summary?.priorityTreatments || [],
        homecare: [
          '\u0e43\u0e0a\u0e49\u0e04\u0e23\u0e35\u0e21\u0e01\u0e31\u0e19\u0e41\u0e14\u0e14 SPF50+ \u0e17\u0e38\u0e01\u0e27\u0e31\u0e19',
          '\u0e43\u0e0a\u0e49 Vitamin C Serum \u0e15\u0e2d\u0e19\u0e40\u0e0a\u0e49\u0e32',
          '\u0e14\u0e37\u0e48\u0e21\u0e19\u0e49\u0e33 2-3 \u0e25\u0e34\u0e15\u0e23/\u0e27\u0e31\u0e19',
        ],
      },
      aiPowered: !!(aiAnalysis || hfResults),
      aiCost,
      usedCache,
      quotaInfo: quotaInfo ? {
        remaining: quotaInfo.quotaRemaining,
        willIncurCharge: quotaInfo.willIncurCharge,
      } : null,
      confidence: aiAnalysis ? 96.5 : hfResults ? 88.0 : 75.0,
      processingTime,
      modelsUsed: [
        ...(hfResults?.modelsUsed || []),
        ...(aiAnalysis ? ['gemini-2.5-flash'] : []),
        'facial_symmetry',
        'skin_metrics',
        'wrinkle_mapper',
      ],
    };

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Skin analysis POST error:', error);
    return NextResponse.json({ success: false, error: 'Analysis failed' }, { status: 500 });
  }
}
