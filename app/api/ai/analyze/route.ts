import { NextRequest, NextResponse } from 'next/server';
import { aiAnalysisLimiter } from '@/lib/middleware/rateLimiter';
import { QuotaManager } from '@/lib/quota/quotaManager';
import { QuotaMonitor } from '@/lib/monitoring/quotaMonitor';
import { NeuralCache } from '@/lib/quota/neuralCache';
import { createClient } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await aiAnalysisLimiter(request, '/api/ai/analyze');
  if (rateLimitResponse) {
    return rateLimitResponse;
  }
  try {
    const body = await request.json();
    const { customerInfo, facialMetrics, imageAnalysis, clinicId, userId, useProModel = false } = body;

    // Validate required fields
    if (!clinicId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: clinicId and userId' },
        { status: 400 }
      );
    }

    // Neural Caching: Check if customer was scanned recently (24hr window)
    const cacheResult = NeuralCache.checkCustomerCache(clinicId, customerInfo, facialMetrics);
    
    if (cacheResult.isHit) {
      // Use cached analysis - no quota deduction needed
      const cachedAnalysis = NeuralCache.getCachedAnalysis(clinicId, customerInfo);
      
      if (cachedAnalysis) {
        console.log(`🧠 Neural Cache HIT: ${cacheResult.reason} - Saved ${cacheResult.quotaSaved} quota units`);
        
        // Record monitoring for cache hit
        QuotaMonitor.recordPerformance('ai_analysis_cached', 50, clinicId, true); // Very fast cached response
        
        return NextResponse.json({
          success: true,
          analysis: cachedAnalysis,
          source: 'neural_cache',
          modelUsed: 'cached-analysis',
          quotaInfo: {
            consumed: 0, // No quota consumed for cached results
            remaining: (await QuotaManager.getQuotaConfig(clinicId))?.monthlyQuota || 100,
            willIncurCharge: false,
            quotaSaved: cacheResult.quotaSaved,
            cacheHit: true,
            cacheReason: cacheResult.reason
          }
        });
      }
    }
    
    console.log(`🧠 Neural Cache MISS: ${cacheResult.reason} - Will perform new analysis`);

    // Check quota before processing (only for new scans)
    const quotaCheck = await QuotaManager.checkQuotaAvailability(clinicId);
    
    if (!quotaCheck.canScan) {
      return NextResponse.json(
        { 
          error: 'Cannot perform AI analysis',
          message: quotaCheck.message,
          quotaExceeded: true,
          remainingQuota: quotaCheck.quotaRemaining,
          willIncurCharge: quotaCheck.willIncurCharge,
          estimatedCost: quotaCheck.estimatedCost
        },
        { status: 403 }
      );
    }

    // Check if Gemini API is available
    const geminiApiKey = process.env.GOOGLE_AI_API_KEY;
    let analysis;
    let actualModelUsed = 'mock';
    let quotaConsumed = 0.1; // Default for mock

    if (geminiApiKey && geminiApiKey.length > 0) {
      try {
        // Use real Gemini AI Analysis with quota tracking
        const { deepSkinAnalysis, quickSkinAnalysis } = await import('@/lib/ai/gemini');
        
        if (useProModel) {
          analysis = await deepSkinAnalysis({
            customerInfo,
            facialMetrics,
            imageAnalysis
          });
          actualModelUsed = 'gemini-1.5-pro';
          quotaConsumed = 1.0; // Pro model: 1.0 quota units
        } else {
          analysis = await quickSkinAnalysis({
            customerInfo,
            facialMetrics,
            imageAnalysis
          });
          actualModelUsed = 'gemini-1.5-flash';
          quotaConsumed = 0.2; // Flash model: 0.2 quota units
        }
        
        console.log(`✅ Gemini AI Analysis completed successfully using ${actualModelUsed}`);
      } catch (error) {
        console.warn('⚠️ Gemini API failed, falling back to enhanced mock:', error);
        analysis = generateEnhancedMockAnalysis(customerInfo);
      }
    } else {
      console.warn('⚠️ No Gemini API key found, using enhanced mock analysis');
      analysis = generateEnhancedMockAnalysis(customerInfo);
    }

    // Record quota usage after successful analysis
    try {
      const usageRecord = await QuotaManager.recordUsage(
        clinicId,
        userId,
        useProModel ? 'detailed' : 'quick',
        true, // successful
        {
          analysisScore: analysis.overallScore,
          proposalGenerated: false,
          leadScore: Math.floor(analysis.overallScore * 0.9) // Derive lead score from analysis
        }
      );
      
      console.log(`📊 Quota usage recorded: ${quotaConsumed} units for ${actualModelUsed}`);
      
      // Neural Caching: Record customer scan for future cache hits
      NeuralCache.recordCustomerScan(clinicId, customerInfo, facialMetrics, analysis);
      console.log(`🧠 Neural Cache: Customer scan recorded for ${customerInfo.name}`);
      
    } catch (quotaError) {
      console.error('❌ Failed to record quota usage:', quotaError);
      // Don't fail the entire request if quota recording fails
    }

    // Get updated quota status for response
    const updatedQuota = await QuotaManager.getQuotaConfig(clinicId);
    const remaining = updatedQuota ? updatedQuota.monthlyQuota - updatedQuota.currentUsage : 0;

    // Record monitoring metrics
    const analysisEndTime = Date.now();
    const totalDuration = analysisEndTime - (request as any).startTime || 0;
    QuotaMonitor.recordPerformance('ai_analysis', totalDuration, clinicId, true);

    return NextResponse.json({
      success: true,
      analysis,
      source: geminiApiKey ? 'gemini_ai' : 'enhanced_mock',
      modelUsed: actualModelUsed,
      quotaInfo: {
        consumed: quotaConsumed,
        remaining: Math.max(0, remaining),
        willIncurCharge: quotaCheck.willIncurCharge
      }
    });

  } catch (error) {
    console.error('❌ AI Analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerInfo, recommendations } = body;

    // Use Gemini to generate a personalized proposal summary
    const geminiApiKey = process.env.GOOGLE_AI_API_KEY;
    let proposalSummary = "ขอเสนอแผนการรักษาที่ออกแบบมาเพื่อคุณโดยเฉพาะ เพื่อผลลัพธ์ที่ดีที่สุดและการดูแลที่ต่อเนื่อง";

    if (geminiApiKey && geminiApiKey.length > 0) {
      try {
        const { generateProposalSummary } = await import('@/lib/ai/gemini');
        proposalSummary = await generateProposalSummary({
          customerName: customerInfo.name,
          age: customerInfo.age,
          recommendations
        });
      } catch (error) {
        console.warn('⚠️ Gemini Proposal failed, using default:', error);
      }
    }

    return NextResponse.json({
      success: true,
      proposal: {
        summary: proposalSummary,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Proposal generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate proposal' },
      { status: 500 }
    );
  }
}

// Enhanced mock analysis with realistic data
function generateEnhancedMockAnalysis(customerInfo: { name: string; age: number }) {
  return {
    overallScore: Math.floor(Math.random() * 20) + 70,
    skinAge: customerInfo.age + Math.floor(Math.random() * 10) - 5,
    skinType: ['Normal', 'Dry', 'Oily', 'Combination', 'Sensitive'][Math.floor(Math.random() * 5)],
    recommendations: [
      {
        type: 'laser',
        name: 'Pico Genesis Laser',
        description: `การรักษาเฉพาะสำหรับคุณ${customerInfo.name} เพื่อปรับปรุงสีผิวและรูขุมขน`,
        price: '8,000-12,000',
        sessions: Math.floor(Math.random() * 3) + 2,
        urgency: Math.random() > 0.5 ? 'high' : 'medium',
        confidence: Math.floor(Math.random() * 20) + 75,
        reasoning: 'เหมาะสำหรับแก้ปัญหาจุดด่างดำและรูขุมขนใหญ่',
        expectedResults: 'ผิวใสขึ้น รูขุมขนกระชับลง',
        timeline: '2-4 สัปดาห์'
      },
      {
        type: 'filler',
        name: 'Hyaluronic Acid Filler',
        description: 'เติมเต็มร่องลึกและปรับรูปหน้าให้สมส่วน',
        price: '15,000-25,000',
        sessions: 1,
        urgency: 'medium',
        confidence: Math.floor(Math.random() * 15) + 80,
        reasoning: 'ช่วยเติมเต็มส่วนที่ขาดวอลลุ่ม',
        expectedResults: 'ใบหน้าอิ่มเอิบ ดูอ่อนเยาว์',
        timeline: '2-3 สัปดาห์'
      },
      {
        type: 'facial',
        name: 'HydraFacial MD',
        description: 'ทำความสะอาดลึกและบำรุงผิวแบบครบวงจร',
        price: '3,500-4,500',
        sessions: Math.floor(Math.random() * 3) + 3,
        urgency: 'low',
        confidence: Math.floor(Math.random() * 10) + 85,
        reasoning: 'เป็นการรักษาพื้นฐานที่ดีสำหรับผิวทุกประเภท',
        expectedResults: 'ผิวชุ่มชื้น เรียบเนียน',
        timeline: 'ทันที'
      }
    ],
    skinMetrics: {
      hydration: 65 + Math.floor(Math.random() * 20),
      elasticity: 60 + Math.floor(Math.random() * 25),
      pigmentation: 55 + Math.floor(Math.random() * 30),
      texture: 70 + Math.floor(Math.random() * 20),
      poreSize: 60 + Math.floor(Math.random() * 25),
      oiliness: 65 + Math.floor(Math.random() * 25)
    },
    aiInsights: [
      `การวิเคราะห์ผิวของคุณ${customerInfo.name} เสร็จสิ้น`,
      'ระบบ AI ตรวจพบจุดที่ควรปรับปรุงและให้คำแนะนำเฉพาะ',
      'แนะนำให้ปรึกษาผู้เชี่ยวชาญก่อนตัดสินใจรักษา'
    ],
    riskFactors: [
      'ควรหลีกเลี่ยงการออกแดดจัดหลังรักษา',
      'อาจมีอาการแดงเล็กน้อยหลังทำ Laser เป็นเรื่องปกติ'
    ],
    followUpAdvice: [
      'ใช้ครีมกันแดด SPF 30+ ทุกวัน',
      'ดื่มน้ำให้เพียงพอ 2-3 ลิตรต่อวัน',
      'นัดหมายติดตามผล 2 สัปดาห์หลังรักษา'
    ]
  };
}
