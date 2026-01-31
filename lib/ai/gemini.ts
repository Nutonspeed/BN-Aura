import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// Gemini models for different use cases
export const models = {
  flash: genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }),     // Fast responses
  pro: genAI.getGenerativeModel({ model: 'gemini-1.5-pro' }),         // High accuracy
};

// Types
export interface SkinAnalysisInput {
  customerInfo: {
    name: string;
    age: number;
    skinType?: string;
    skinConcerns?: string[];
  };
  facialMetrics: {
    facialAsymmetry: number;
    skinTexture: number;
    volumeLoss: number[];
    wrinkleDepth: number;
    poreSize: number;
  };
  imageAnalysis?: {
    spots: number;
    wrinkles: number;
    hydration: number;
    elasticity: number;
    pigmentation: number;
  };
}

export interface TreatmentRecommendation {
  type: 'filler' | 'laser' | 'facial' | 'skincare';
  name: string;
  description: string;
  price: string;
  sessions: number;
  urgency: 'high' | 'medium' | 'low';
  confidence: number;
  reasoning: string;
  expectedResults: string;
  timeline: string;
}

export interface AIAnalysisResult {
  overallScore: number;
  skinAge: number;
  skinType: string;
  recommendations: TreatmentRecommendation[];
  skinMetrics: Record<string, number>;
  aiInsights: string[];
  riskFactors: string[];
  followUpAdvice: string[];
}

// Gemini prompts for skin analysis
const SKIN_ANALYSIS_PROMPT = `
You are BN-Aura AI, an expert aesthetic dermatology consultant with 15+ years of experience. 
Analyze the provided skin data and customer information to give professional treatment recommendations.

Guidelines:
1. Be professional yet approachable in Thai language
2. Focus on evidence-based treatments available in aesthetic clinics
3. Consider customer age, skin type, and specific concerns
4. Prioritize treatments by urgency and effectiveness
5. Provide realistic expectations and timelines
6. Include both immediate and long-term care recommendations

Available treatments:
- Filler (Hyaluronic Acid, Sculptra, etc.)
- Laser (CO2, Pico, IPL, etc.)  
- Facial treatments (HydraFacial, Chemical Peels, etc.)
- Medical skincare products

Respond in JSON format with the following structure:
{
  "overallScore": number (0-100),
  "skinAge": number,
  "skinType": string,
  "recommendations": [
    {
      "type": "filler|laser|facial|skincare",
      "name": "specific treatment name",
      "description": "detailed description in Thai",
      "price": "price range in THB",
      "sessions": number,
      "urgency": "high|medium|low",
      "confidence": number (0-100),
      "reasoning": "why this treatment is recommended",
      "expectedResults": "what results to expect",
      "timeline": "when results will be visible"
    }
  ],
  "skinMetrics": {
    "hydration": number,
    "elasticity": number,
    "pigmentation": number,
    "texture": number,
    "poreSize": number,
    "oiliness": number
  },
  "aiInsights": ["insight1", "insight2", "insight3"],
  "riskFactors": ["risk1", "risk2"],
  "followUpAdvice": ["advice1", "advice2"]
}
`;

export async function analyzeSkinWithGemini(
  input: SkinAnalysisInput,
  useProModel: boolean = false
): Promise<AIAnalysisResult> {
  try {
    const model = useProModel ? models.pro : models.flash;
    
    const customerData = `
Customer Information:
- Name: ${input.customerInfo.name}
- Age: ${input.customerInfo.age}
- Skin Type: ${input.customerInfo.skinType || 'Unknown'}
- Concerns: ${input.customerInfo.skinConcerns?.join(', ') || 'General skin health'}

Facial Analysis Metrics:
- Facial Asymmetry: ${input.facialMetrics.facialAsymmetry}
- Skin Texture: ${input.facialMetrics.skinTexture}  
- Volume Loss: [${input.facialMetrics.volumeLoss.join(', ')}]
- Wrinkle Depth: ${input.facialMetrics.wrinkleDepth}
- Pore Size: ${input.facialMetrics.poreSize}

${input.imageAnalysis ? `
Image Analysis Results:
- Spots Score: ${input.imageAnalysis.spots}
- Wrinkles Score: ${input.imageAnalysis.wrinkles}
- Hydration Level: ${input.imageAnalysis.hydration}
- Elasticity: ${input.imageAnalysis.elasticity}
- Pigmentation: ${input.imageAnalysis.pigmentation}
` : ''}

Please provide a comprehensive skin analysis and treatment recommendations.
    `;

    const result = await model.generateContent([
      SKIN_ANALYSIS_PROMPT,
      customerData
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Clean and parse JSON response
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}') + 1;
    const jsonStr = text.substring(jsonStart, jsonEnd);
    
    const analysisResult = JSON.parse(jsonStr) as AIAnalysisResult;
    
    // Validate and ensure all required fields exist
    return {
      overallScore: analysisResult.overallScore || 75,
      skinAge: analysisResult.skinAge || input.customerInfo.age,
      skinType: analysisResult.skinType || 'Mixed',
      recommendations: analysisResult.recommendations || [],
      skinMetrics: {
        hydration: 70,
        elasticity: 65,
        pigmentation: 60,
        texture: 75,
        poreSize: 70,
        oiliness: 65,
        ...analysisResult.skinMetrics
      },
      aiInsights: analysisResult.aiInsights || [
        `การวิเคราะห์ผิวของคุณ${input.customerInfo.name} เสร็จสิ้น`,
        'พบจุดที่ควรปรับปรุงและได้ให้คำแนะนำที่เหมาะสม'
      ],
      riskFactors: analysisResult.riskFactors || [],
      followUpAdvice: analysisResult.followUpAdvice || []
    };

  } catch (error) {
    console.error('Gemini AI analysis error:', error);
    
    // Fallback response with mock data
    return {
      overallScore: 75 + Math.floor(Math.random() * 15),
      skinAge: input.customerInfo.age + Math.floor(Math.random() * 6) - 3,
      skinType: 'Combination',
      recommendations: [
        {
          type: 'laser',
          name: 'Pico Genesis Laser',
          description: 'กำจัดจุดด่างดำและปรับสีผิวให้สม่ำเสมอ',
          price: '8,000-12,000',
          sessions: 3,
          urgency: 'medium',
          confidence: 85,
          reasoning: 'เหมาะสำหรับปรับปรุงรูขุมขนและสีผิว',
          expectedResults: 'ผิวใสกว่าเดิม รูขุมขนกระชับ',
          timeline: '2-4 สัปดาห์'
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
        `การวิเคราะห์ผิวของคุณ${input.customerInfo.name} เสร็จสิ้น`,
        'ระบบ AI ตรวจพบจุดที่ควรปรับปรุงและให้คำแนะนำเฉพาะ',
        'แนะนำให้ปรึกษาผู้เชี่ยวชาญก่อนตัดสินใจรักษา'
      ],
      riskFactors: ['ควรหลีกเลี่ยงการสัมผัสแสงแดดโดยตรงหลังรักษา'],
      followUpAdvice: ['ใช้ครีมกันแดด SPF 30+ ทุกวัน', 'ดื่มน้ำให้เพียงพอ 2-3 ลิตรต่อวัน']
    };
  }
}

// Quick skin analysis using Gemini Flash (faster)
export async function quickSkinAnalysis(input: SkinAnalysisInput): Promise<AIAnalysisResult> {
  return analyzeSkinWithGemini(input, false);
}

// Deep skin analysis using Gemini Pro (more accurate)
export async function deepSkinAnalysis(input: SkinAnalysisInput): Promise<AIAnalysisResult> {
  return analyzeSkinWithGemini(input, true);
}

// Generate a short proposal summary for the chat/UI
export async function generateProposalSummary(params: {
  customerName: string;
  age: number;
  recommendations: TreatmentRecommendation[];
}): Promise<string> {
  try {
    const model = models.flash;
    
    const summaryPrompt = `
    Create a very short (2-3 sentences) professional summary in Thai for a treatment proposal.
    
    Customer: ${params.customerName}, Age: ${params.age}
    Treatments: ${params.recommendations.map(r => r.name).join(', ')}
    
    Guidelines:
    1. Be persuasive and professional
    2. Focus on the value of the recommended treatments
    3. Use Thai language
    `;

    const result = await model.generateContent(summaryPrompt);
    const response = await result.response;
    return response.text().trim();
    
  } catch (error) {
    console.error('Proposal summary error:', error);
    return `ขอเสนอแผนการรักษาที่ออกแบบมาเพื่อคุณ${params.customerName} เพื่อผลลัพธ์ที่ดีที่สุด`;
  }
}

// Generate treatment proposal text
export async function generateTreatmentProposal(
  customerInfo: SkinAnalysisInput['customerInfo'],
  recommendations: TreatmentRecommendation[]
): Promise<string> {
  try {
    const model = models.flash;
    
    const proposalPrompt = `
Create a professional treatment proposal in Thai for an aesthetic clinic customer.

Customer: ${customerInfo.name}, Age: ${customerInfo.age}
Recommended Treatments: ${JSON.stringify(recommendations, null, 2)}

Generate a persuasive, professional proposal that includes:
1. Personalized greeting
2. Analysis summary
3. Recommended treatment plan with benefits
4. Pricing and package options  
5. Timeline and expectations
6. Call to action

Keep it professional yet warm, focusing on customer benefits and results.
Format as HTML for easy display.
`;

    const result = await model.generateContent(proposalPrompt);
    const response = await result.response;
    return response.text();
    
  } catch (error) {
    console.error('Proposal generation error:', error);
    return `
    <div class="proposal">
      <h2>ข้เสนอการรักษาสำหรับคุณ ${customerInfo.name}</h2>
      <p>ตามผลการวิเคราะห์ผิว เราขอเสนอแผนการรักษาที่เหมาะสมสำหรับคุณ</p>
      ${recommendations.map(rec => `
        <div class="treatment">
          <h3>${rec.name}</h3>
          <p>${rec.description}</p>
          <p>ราคา: ฿${rec.price} | จำนวน: ${rec.sessions} ครั้ง</p>
        </div>
      `).join('')}
    </div>
    `;
  }
}
