/**
 * Vercel AI Gateway Integration
 * Unified interface for multiple AI providers with cost optimization
 * Supports: OpenAI, Anthropic, Google, xAI via Vercel AI Gateway
 */

import { generateText, streamText, generateObject } from 'ai';
import { z } from 'zod';
import { AICostTracker } from './aiCostTracker';

// Model configurations with cost tiers - using Vercel AI Gateway format
const MODEL_CONFIG = {
  // Tier 1: Fast & Cheap (for simple queries)
  fast: {
    modelId: 'google/gemini-2.5-flash',
    maxTokens: 1024,
    costPer1kTokens: 0.0001,
    supportsVision: true,
  },
  // Tier 2: Balanced (for standard analysis)
  balanced: {
    modelId: 'google/gemini-2.5-pro',
    maxTokens: 2048,
    costPer1kTokens: 0.001,
    supportsVision: true,
  },
  // Tier 3: Premium (for complex recommendations)
  premium: {
    modelId: 'anthropic/claude-sonnet-4-20250514',
    maxTokens: 4096,
    costPer1kTokens: 0.003,
    supportsVision: true,
  },
  // Tier 4: Vision Analysis (for image-based skin analysis)
  vision: {
    modelId: 'openai/gpt-4o',
    maxTokens: 4096,
    costPer1kTokens: 0.005,
    supportsVision: true,
  },
};

type ModelTier = 'fast' | 'balanced' | 'premium' | 'vision';

interface AIRequest {
  prompt: string;
  systemPrompt?: string;
  tier?: ModelTier;
  stream?: boolean;
  imageBase64?: string; // For vision analysis
  context?: Record<string, any>;
}

interface AIResponse {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: number;
  model: string;
  latency: number;
}

// Skin Analysis Prompts
const SKIN_ANALYSIS_SYSTEM_PROMPT = `คุณคือ AI ผู้เชี่ยวชาญด้านการวิเคราะห์ผิวหน้าและให้คำแนะนำ Treatment สำหรับคลินิกความงาม
คุณมีความรู้เกี่ยวกับ:
- การวิเคราะห์สภาพผิว 8 ประเภท (Spots, Wrinkles, Texture, Pores, UV Spots, Brown Spots, Red Areas, Porphyrins)
- Treatment ต่างๆ (Laser, Botox, Filler, Facial, Skincare)
- ผลิตภัณฑ์ดูแลผิว และส่วนผสมสำคัญ
- สภาพแวดล้อมที่ส่งผลต่อผิว (UV, มลพิษ, ความชื้น)

ตอบเป็นภาษาไทยเสมอ ยกเว้นชื่อ Treatment หรือส่วนผสมที่เป็นภาษาอังกฤษ
ให้คำตอบที่เป็นประโยชน์ สุภาพ และเป็นมืออาชีพ`;

const TREATMENT_RECOMMENDATION_PROMPT = `วิเคราะห์ข้อมูลผิวหน้าและแนะนำ Treatment ที่เหมาะสม
ตอบในรูปแบบ JSON ดังนี้:
{
  "analysis": "สรุปสภาพผิว",
  "concerns": ["ปัญหาที่พบ"],
  "recommendations": [
    {
      "name": "ชื่อ Treatment",
      "reason": "เหตุผลที่แนะนำ",
      "sessions": จำนวนครั้ง,
      "priceRange": "ช่วงราคา",
      "priority": 1-3
    }
  ],
  "homecare": ["คำแนะนำการดูแลที่บ้าน"],
  "followUp": "คำแนะนำการติดตามผล"
}`;

class VercelAIGateway {
  
  /**
   * Generate text response from AI using Vercel AI Gateway
   * Model string format: 'provider/model-name' routes through Gateway automatically
   */
  static async generate(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    const tier = request.tier || 'balanced';
    const config = MODEL_CONFIG[tier];
    
    try {
      // Build messages array for vision support
      const messages: Array<{ role: 'user' | 'system'; content: string | Array<{ type: string; text?: string; image?: string }> }> = [];
      
      if (request.systemPrompt || SKIN_ANALYSIS_SYSTEM_PROMPT) {
        messages.push({
          role: 'system',
          content: request.systemPrompt || SKIN_ANALYSIS_SYSTEM_PROMPT,
        });
      }

      // If image provided, use multimodal content
      if (request.imageBase64 && config.supportsVision) {
        messages.push({
          role: 'user',
          content: [
            { type: 'text', text: request.prompt },
            { type: 'image', image: request.imageBase64 },
          ],
        });
      } else {
        messages.push({
          role: 'user',
          content: request.prompt,
        });
      }

      // Use model string directly - Vercel AI Gateway routes automatically
      const result = await generateText({
        model: config.modelId as any, // Vercel AI Gateway format: 'provider/model'
        messages: messages as any,
      });

      const latency = Date.now() - startTime;
      const promptTokens = (result.usage as any)?.promptTokens || (result.usage as any)?.input_tokens || 0;
      const completionTokens = (result.usage as any)?.completionTokens || (result.usage as any)?.output_tokens || 0;
      const totalTokens = promptTokens + completionTokens;
      const cost = (totalTokens / 1000) * config.costPer1kTokens;

      // Track usage
      AICostTracker.record({
        model: config.modelId,
        tokens: totalTokens,
        cost,
        clinicId: request.context?.clinicId,
        feature: 'generate',
      });

      return {
        text: result.text,
        usage: { promptTokens, completionTokens, totalTokens },
        cost,
        model: config.modelId,
        latency,
      };
    } catch (error) {
      console.error('AI Gateway error:', error);
      return {
        text: this.getFallbackResponse(request.prompt),
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        cost: 0,
        model: 'fallback',
        latency: Date.now() - startTime,
      };
    }
  }

  /**
   * Check if request is allowed based on budget
   */
  static checkBudget(clinicId?: string): { allowed: boolean; reason?: string } {
    return AICostTracker.canMakeRequest(clinicId);
  }

  /**
   * Stream text response from AI
   */
  static async *stream(request: AIRequest): AsyncGenerator<string> {
    const tier = request.tier || 'balanced';
    const config = MODEL_CONFIG[tier];
    
    try {
      const result = await streamText({
        model: config.modelId as any,
        system: request.systemPrompt || SKIN_ANALYSIS_SYSTEM_PROMPT,
        prompt: request.prompt,
      });

      for await (const chunk of result.textStream) {
        yield chunk;
      }
    } catch (error) {
      console.error('AI Gateway stream error:', error);
      yield this.getFallbackResponse(request.prompt);
    }
  }

  /**
   * Analyze skin image with Vision AI
   */
  static async analyzeSkinImage(
    imageBase64: string,
    customerAge: number,
    hfContext?: string
  ): Promise<AIResponse> {
    const hfSection = hfContext 
      ? `\n\nข้อมูลจาก AI Models อื่น (ใช้ประกอบการวิเคราะห์):\n${hfContext}\n`
      : '';
    
    const prompt = `วิเคราะห์ภาพใบหน้านี้และให้คะแนนสภาพผิวแบบ VISIA 8 Metrics
${hfSection}    
อายุลูกค้า: ${customerAge} ปี

กรุณาวิเคราะห์และตอบเป็น JSON:
{
  "overallScore": 0-100,
  "skinAge": ตัวเลข,
  "metrics": {
    "spots": { "score": 0-100, "count": จำนวน, "severity": "mild/moderate/severe" },
    "wrinkles": { "score": 0-100, "depth": "fine/moderate/deep", "zones": ["forehead", "nasolabial"] },
    "texture": { "score": 0-100, "smoothness": 0-100 },
    "pores": { "score": 0-100, "visibility": "minimal/visible/enlarged" },
    "uvSpots": { "score": 0-100, "estimated": true },
    "brownSpots": { "score": 0-100, "pigmentation": "light/moderate/heavy" },
    "redAreas": { "score": 0-100, "vascularity": "low/medium/high" },
    "porphyrins": { "score": 0-100, "estimated": true }
  },
  "concerns": ["รายการปัญหาที่พบ"],
  "recommendations": ["Treatment ที่แนะนำ"]
}`;

    return this.generate({
      prompt,
      tier: 'vision',
      imageBase64,
      systemPrompt: 'คุณเป็น AI ผู้เชี่ยวชาญวิเคราะห์ผิวหน้าระดับ VISIA ตอบเป็น JSON เท่านั้น',
    });
  }

  /**
   * Analyze skin and recommend treatments
   */
  static async analyzeSkinAndRecommend(
    skinMetrics: {
      overallScore: number;
      skinAge: number;
      concerns: string[];
      metrics: Record<string, number>;
    },
    customerInfo: {
      age: number;
      skinType: string;
      budget?: string;
    }
  ): Promise<AIResponse> {
    const prompt = `
${TREATMENT_RECOMMENDATION_PROMPT}

ข้อมูลลูกค้า:
- อายุ: ${customerInfo.age} ปี
- ประเภทผิว: ${customerInfo.skinType}
- งบประมาณ: ${customerInfo.budget || 'ไม่ระบุ'}

ผลวิเคราะห์ผิว:
- คะแนนรวม: ${skinMetrics.overallScore}/100
- อายุผิว: ${skinMetrics.skinAge} ปี
- ปัญหาที่พบ: ${skinMetrics.concerns.join(', ')}
- Metrics: ${JSON.stringify(skinMetrics.metrics)}

กรุณาวิเคราะห์และแนะนำ Treatment ที่เหมาะสม`;

    return this.generate({
      prompt,
      tier: 'premium',
    });
  }

  /**
   * Answer skin consultation question
   */
  static async answerConsultation(
    question: string,
    context?: {
      skinScore?: number;
      concerns?: string[];
      previousMessages?: string[];
    }
  ): Promise<AIResponse> {
    let prompt = `คำถามจากลูกค้า: "${question}"`;
    
    if (context?.skinScore) {
      prompt += `\n\nข้อมูลผิวลูกค้า: Skin Score ${context.skinScore}/100`;
    }
    if (context?.concerns?.length) {
      prompt += `\nปัญหาผิว: ${context.concerns.join(', ')}`;
    }
    if (context?.previousMessages?.length) {
      prompt += `\n\nประวัติการสนทนา:\n${context.previousMessages.slice(-3).join('\n')}`;
    }

    prompt += '\n\nกรุณาตอบคำถามอย่างเป็นประโยชน์และเป็นมืออาชีพ';

    return this.generate({
      prompt,
      tier: 'fast',
    });
  }

  /**
   * Analyze product compatibility
   */
  static async analyzeProductCompatibility(
    product: {
      name: string;
      ingredients: string[];
    },
    skinProfile: {
      skinType: string;
      concerns: string[];
      allergies?: string[];
    }
  ): Promise<AIResponse> {
    const prompt = `
วิเคราะห์ความเหมาะสมของผลิตภัณฑ์:
ผลิตภัณฑ์: ${product.name}
ส่วนผสม: ${product.ingredients.join(', ')}

ข้อมูลผิวลูกค้า:
- ประเภทผิว: ${skinProfile.skinType}
- ปัญหาผิว: ${skinProfile.concerns.join(', ')}
${skinProfile.allergies?.length ? `- แพ้: ${skinProfile.allergies.join(', ')}` : ''}

กรุณาวิเคราะห์:
1. ความเหมาะสม (0-100%)
2. ประโยชน์ที่จะได้รับ
3. ข้อควรระวัง
4. วิธีใช้ที่ถูกต้อง
5. ผลิตภัณฑ์ทางเลือก (ถ้ามี)`;

    return this.generate({
      prompt,
      tier: 'balanced',
    });
  }

  /**
   * Get fallback response when AI is unavailable
   */
  private static getFallbackResponse(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('สิว')) {
      return `สิวเป็นปัญหาผิวที่พบบ่อย สาเหตุหลักมาจากรูขุมขนอุดตัน ความมัน และแบคทีเรีย

คำแนะนำเบื้องต้น:
• ล้างหน้าวันละ 2 ครั้ง ด้วยผลิตภัณฑ์ที่มี Salicylic Acid
• หลีกเลี่ยงการบีบสิวเอง
• ใช้ครีมกันแดดทุกวัน

Treatment ที่แนะนำ: Carbon Peel, Blue Light Therapy

แนะนำให้ปรึกษาผู้เชี่ยวชาญเพื่อวางแผนการรักษาที่เหมาะสมค่ะ`;
    }
    
    if (lowerPrompt.includes('ฝ้า') || lowerPrompt.includes('กระ')) {
      return `ฝ้าและกระเกิดจากการสร้างเม็ดสีมากเกินไป สาเหตุหลักคือแสง UV และฮอร์โมน

คำแนะนำเบื้องต้น:
• ใช้ครีมกันแดด SPF50+ PA++++ ทุกวัน
• ใช้ผลิตภัณฑ์ที่มี Vitamin C หรือ Niacinamide
• หลีกเลี่ยงแสงแดดช่วง 10.00-16.00

Treatment ที่แนะนำ: Laser Toning, Pico Laser

แนะนำให้วิเคราะห์ผิวอย่างละเอียดเพื่อวางแผนการรักษาค่ะ`;
    }

    return `ขอบคุณสำหรับคำถามค่ะ 

เพื่อให้คำแนะนำที่เหมาะสมที่สุด แนะนำให้:
1. ทำ AI Skin Analysis เพื่อวิเคราะห์ผิวอย่างละเอียด
2. ปรึกษาผู้เชี่ยวชาญของเรา
3. รับคำแนะนำ Treatment ที่เหมาะกับคุณโดยเฉพาะ

ต้องการนัดปรึกษาไหมคะ?`;
  }

  /**
   * Get usage statistics
   */
  static getModelConfig(tier: ModelTier) {
    return MODEL_CONFIG[tier];
  }
}

export { VercelAIGateway, MODEL_CONFIG };
export type { AIRequest, AIResponse, ModelTier };
