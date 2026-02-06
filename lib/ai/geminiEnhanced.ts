/**
 * BN-Aura Enhanced Gemini AI Service
 * Advanced AI features for skin analysis
 */

const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export interface SkinAnalysisPrompt {
  imageBase64?: string;
  skinType: string;
  age: number;
  concerns: string[];
  previousTreatments?: string[];
}

export interface AIRecommendation {
  treatments: { name: string; priority: number; reason: string }[];
  products: { name: string; type: string; reason: string }[];
  lifestyle: string[];
  followUp: string;
}

// Generate personalized treatment recommendations
export async function generateTreatmentRecommendations(
  prompt: SkinAnalysisPrompt
): Promise<AIRecommendation> {
  const systemPrompt = `You are an expert dermatologist AI assistant for BN-Aura aesthetic clinic.
Analyze the patient's skin profile and provide personalized recommendations in JSON format.

Patient Profile:
- Skin Type: ${prompt.skinType}
- Age: ${prompt.age}
- Concerns: ${prompt.concerns.join(', ')}
- Previous Treatments: ${prompt.previousTreatments?.join(', ') || 'None'}

Provide recommendations in this exact JSON format:
{
  "treatments": [{"name": "...", "priority": 1-5, "reason": "..."}],
  "products": [{"name": "...", "type": "...", "reason": "..."}],
  "lifestyle": ["..."],
  "followUp": "..."
}`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    });

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return getDefaultRecommendation();
  } catch (error) {
    console.error('[Gemini] Error:', error);
    return getDefaultRecommendation();
  }
}

// Generate skin analysis report
export async function generateAnalysisReport(
  metrics: Record<string, number>,
  customerName: string
): Promise<string> {
  const prompt = `Generate a professional skin analysis report in Thai for ${customerName}.

Metrics:
${Object.entries(metrics).map(([k, v]) => `- ${k}: ${v}/100`).join('\n')}

Format as a professional report with sections:
1. Executive Summary
2. Detailed Analysis
3. Recommendations
4. Next Steps`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5, maxOutputTokens: 2048 },
      }),
    });

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Report generation failed';
  } catch (error) {
    console.error('[Gemini] Report error:', error);
    return 'Unable to generate report';
  }
}

// AI Chat for skin consultation
export async function chatWithAI(
  message: string,
  context: { skinType?: string; history?: string[] }
): Promise<string> {
  const systemContext = `You are a friendly Thai-speaking skin care consultant for BN-Aura clinic.
Skin Type: ${context.skinType || 'Unknown'}
Previous messages: ${context.history?.slice(-3).join('\n') || 'None'}

Respond helpfully in Thai. Be concise and professional.`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: systemContext }] },
          { role: 'user', parts: [{ text: message }] },
        ],
        generationConfig: { temperature: 0.8, maxOutputTokens: 512 },
      }),
    });

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'ขออภัย ไม่สามารถตอบได้ในขณะนี้';
  } catch (error) {
    console.error('[Gemini] Chat error:', error);
    return 'ขออภัย เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
  }
}

function getDefaultRecommendation(): AIRecommendation {
  return {
    treatments: [
      { name: 'HydraFacial', priority: 1, reason: 'Deep cleansing and hydration' },
      { name: 'LED Therapy', priority: 2, reason: 'Skin rejuvenation' },
    ],
    products: [
      { name: 'Vitamin C Serum', type: 'serum', reason: 'Brightening and antioxidant' },
      { name: 'SPF 50 Sunscreen', type: 'sunscreen', reason: 'UV protection' },
    ],
    lifestyle: ['Drink 8 glasses of water daily', 'Get 7-8 hours of sleep'],
    followUp: '2 weeks',
  };
}

export default {
  generateTreatmentRecommendations,
  generateAnalysisReport,
  chatWithAI,
};
