import { callGemini } from '@/lib/ai';
import { createClient } from '@/lib/supabase/client';

/**
 * AI Sales Coach Engine
 * ให้คำแนะนำการขายแบบ Real-time ตามบริบทของลูกค้า
 */

export interface CustomerContext {
  name: string;
  skinAnalysis?: {
    skinType: string;
    concerns: string[];
    ageEstimate: number;
    urgencyScore: number;
  };
  previousTreatments?: string[];
  budget?: string;
  objections?: string[];
}

export interface SalesCoachResponse {
  suggestion: string;
  talkingPoints: string[];
  closingTechnique: string;
  confidence: number;
}

/**
 * AI Sales Coach - แนะนำวิธีการขายตามบริบท
 */
export async function getSalesCoachAdvice(
  context: CustomerContext,
  currentConversation: string,
  clinicId: string
): Promise<SalesCoachResponse> {
  const prompt = `คุณคือ AI Sales Coach มืออาชีพสำหรับคลินิกความงาม

บริบทลูกค้า:
- ชื่อ: ${context.name}
- ประเภทผิว: ${context.skinAnalysis?.skinType || 'ไม่ระบุ'}
- ปัญหาผิว: ${context.skinAnalysis?.concerns.join(', ') || 'ไม่ระบุ'}
- อายุผิวประมาณ: ${context.skinAnalysis?.ageEstimate || 'ไม่ระบุ'} ปี
- ความเร่งด่วน: ${context.skinAnalysis?.urgencyScore || 0}/100
- งบประมาณ: ${context.budget || 'ไม่ระบุ'}
${context.objections?.length ? `- ข้อโต้แย้ง: ${context.objections.join(', ')}` : ''}

การสนทนาปัจจุบัน:
${currentConversation}

โปรดให้คำแนะนำการขายในรูปแบบ JSON:
{
  "suggestion": "คำแนะนำหลักสำหรับเซลส์ (1-2 ประโยค)",
  "talkingPoints": ["จุดขาย 1", "จุดขาย 2", "จุดขาย 3"],
  "closingTechnique": "เทคนิคปิดการขายที่เหมาะสม",
  "confidence": 85
}

เน้นการสร้างความเชื่อมั่น ใช้ข้อมูลจากผลสแกนผิว และแนะนำแบบเป็นมิตร`;

  try {
    const response = await callGemini(prompt, 'gemini-2.0-flash', {
      clinicId,
      useCache: true
    });

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback
    return {
      suggestion: response.substring(0, 200),
      talkingPoints: ['ใช้ผลสแกนผิวเป็นหลักฐาน', 'เน้นผลลัพธ์ที่เห็นได้จริง', 'สร้างความเชื่อมั่น'],
      closingTechnique: 'ถามคำถามปิด: "คุณพร้อมเริ่มดูแลผิวแบบมืออาชีพไหมคะ?"',
      confidence: 75
    };
  } catch (error) {
    console.error('Sales Coach Error:', error);
    throw error;
  }
}

/**
 * Real-time Objection Handler
 * วิเคราะห์ข้อโต้แย้งและแนะนำวิธีตอบ
 */
export async function handleObjection(
  objection: string,
  context: CustomerContext,
  clinicId: string
): Promise<{
  objectionType: string;
  response: string;
  alternativeApproach: string;
}> {
  const prompt = `คุณคือผู้เชี่ยวชาญด้านการจัดการข้อโต้แย้งในการขาย

ข้อโต้แย้งของลูกค้า: "${objection}"

บริบท:
- ประเภทผิว: ${context.skinAnalysis?.skinType || 'ไม่ระบุ'}
- ปัญหา: ${context.skinAnalysis?.concerns.join(', ') || 'ไม่ระบุ'}
- งบประมาณ: ${context.budget || 'ไม่ระบุ'}

วิเคราะห์และตอบกลับในรูปแบบ JSON:
{
  "objectionType": "ประเภทข้อโต้แย้ง (price/time/trust/need)",
  "response": "คำตอบที่เหมาะสม พร้อมเหตุผลสนับสนุน",
  "alternativeApproach": "แนวทางทางเลือกถ้าลูกค้ายังไม่พอใจ"
}`;

  try {
    const response = await callGemini(prompt, 'gemini-2.0-flash', {
      clinicId,
      useCache: false
    });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      objectionType: 'general',
      response: 'เข้าใจความกังวลของคุณค่ะ ผลสแกนผิวของคุณแสดงให้เห็นว่า...',
      alternativeApproach: 'เสนอแพ็กเกจที่เล็กกว่าหรือผ่อนชำระ'
    };
  } catch (error) {
    console.error('Objection Handler Error:', error);
    throw error;
  }
}

/**
 * Upsell Recommender
 * แนะนำผลิตภัณฑ์เสริมจากผลสแกนผิว
 */
export async function getUpsellRecommendations(
  context: CustomerContext,
  currentTreatments: string[],
  clinicId: string
): Promise<{
  recommendations: Array<{
    product: string;
    reason: string;
    timing: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}> {
  const supabase = createClient();
  
  // ดึงข้อมูล treatments และ products ที่มีในคลินิก
  const { data: availableProducts } = await supabase
    .from('treatments')
    .select('name, category, price')
    .eq('clinic_id', clinicId)
    .eq('active', true);

  const prompt = `คุณคือผู้เชี่ยวชาญด้าน Cross-sell และ Upsell

ข้อมูลลูกค้า:
- ประเภทผิว: ${context.skinAnalysis?.skinType || 'ไม่ระบุ'}
- ปัญหาผิว: ${context.skinAnalysis?.concerns.join(', ') || 'ไม่ระบุ'}
- Treatment ที่เลือกแล้ว: ${currentTreatments.join(', ')}

ผลิตภัณฑ์ที่มีในคลินิก:
${availableProducts?.map(p => `- ${p.name} (${p.category})`).join('\n') || 'ไม่มีข้อมูล'}

แนะนำผลิตภัณฑ์เสริมในรูปแบบ JSON:
{
  "recommendations": [
    {
      "product": "ชื่อผลิตภัณฑ์",
      "reason": "เหตุผลที่แนะนำ (เชื่อมโยงกับปัญหาผิว)",
      "timing": "ควรแนะนำเมื่อไหร่ (now/after_treatment/follow_up)",
      "priority": "high/medium/low"
    }
  ]
}

เลือกแค่ 2-3 รายการที่เหมาะสมที่สุด`;

  try {
    const response = await callGemini(prompt, 'gemini-2.0-flash', {
      clinicId,
      useCache: true
    });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      recommendations: []
    };
  } catch (error) {
    console.error('Upsell Recommender Error:', error);
    return { recommendations: [] };
  }
}

/**
 * Deal Probability Calculator
 * คำนวณโอกาสปิดการขาย
 */
export function calculateDealProbability(
  context: CustomerContext,
  conversationMetrics: {
    duration: number; // นาที
    questionsAsked: number;
    objections: number;
    positiveSignals: number;
  }
): {
  probability: number;
  factors: Array<{ factor: string; impact: number }>;
  recommendation: string;
} {
  let probability = 50; // Base probability
  const factors: Array<{ factor: string; impact: number }> = [];

  // Urgency Score Impact (0-30%)
  if (context.skinAnalysis?.urgencyScore) {
    const urgencyImpact = (context.skinAnalysis.urgencyScore / 100) * 30;
    probability += urgencyImpact;
    factors.push({
      factor: 'ความเร่งด่วนของปัญหาผิว',
      impact: urgencyImpact
    });
  }

  // Conversation Duration (0-15%)
  if (conversationMetrics.duration > 10) {
    probability += 15;
    factors.push({ factor: 'ระยะเวลาสนทนายาว (มีความสนใจ)', impact: 15 });
  } else if (conversationMetrics.duration > 5) {
    probability += 8;
    factors.push({ factor: 'ระยะเวลาสนทนาปานกลาง', impact: 8 });
  }

  // Questions Asked (0-10%)
  if (conversationMetrics.questionsAsked > 5) {
    probability += 10;
    factors.push({ factor: 'ถามคำถามมาก (สนใจรายละเอียด)', impact: 10 });
  }

  // Objections (-20% to 0%)
  if (conversationMetrics.objections > 3) {
    probability -= 20;
    factors.push({ factor: 'มีข้อโต้แย้งมาก', impact: -20 });
  } else if (conversationMetrics.objections > 0) {
    probability -= 10;
    factors.push({ factor: 'มีข้อโต้แย้งบ้าง', impact: -10 });
  }

  // Positive Signals (0-15%)
  if (conversationMetrics.positiveSignals > 3) {
    probability += 15;
    factors.push({ factor: 'สัญญาณบวกมาก', impact: 15 });
  }

  // Budget Clarity (0-10%)
  if (context.budget && context.budget !== 'ไม่ระบุ') {
    probability += 10;
    factors.push({ factor: 'ระบุงบประมาณชัดเจน', impact: 10 });
  }

  // Cap probability
  probability = Math.max(0, Math.min(100, probability));

  // Recommendation
  let recommendation = '';
  if (probability >= 70) {
    recommendation = '🔥 โอกาสสูง! ควรปิดการขายเลย ถามคำถามปิด';
  } else if (probability >= 50) {
    recommendation = '⚡ โอกาสปานกลาง จัดการข้อโต้แย้งและเสนอ value เพิ่ม';
  } else if (probability >= 30) {
    recommendation = '💡 โอกาสต่ำ สร้างความเชื่อมั่นเพิ่ม ใช้ผลสแกนเป็นหลักฐาน';
  } else {
    recommendation = '⚠️ โอกาสต่ำมาก พิจารณา follow-up ภายหลัง';
  }

  return {
    probability: Math.round(probability),
    factors,
    recommendation
  };
}
