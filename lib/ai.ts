import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, streamText } from 'ai';

/**
 * BN-Aura AI Provider Configuration
 * Uses Vercel AI Gateway to proxy requests to Google Gemini
 */
export function getAIProvider(options: { 
  clinicId?: string; 
  userId?: string; 
  tier?: string;
  useCache?: boolean;
} = {}) {
  const gatewayUrl = process.env.VERCEL_AI_GATEWAY_URL;
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  if (!gatewayUrl || !apiKey) {
    throw new Error('AI Gateway configuration missing in environment variables');
  }

  // Configure Google provider to route through Vercel AI Gateway
  return createGoogleGenerativeAI({
    apiKey,
    baseURL: `${gatewayUrl}/google`, // Vercel AI Gateway convention
    headers: {
      'x-gateway-cache': options.useCache !== false ? 'enable' : 'disable',
      'x-clinic-id': options.clinicId || 'system',
      'x-user-id': options.userId || 'system',
      'x-subscription-tier': options.tier || 'starter',
    },
  });
}

/**
 * Utility to call Gemini and get full text response
 */
export async function callGemini(
  prompt: string,
  modelId: 'gemini-2.5-pro' | 'gemini-2.0-flash' = 'gemini-2.0-flash',
  options: { clinicId?: string; userId?: string; tier?: string; useCache?: boolean } = {}
) {
  const google = getAIProvider(options);

  try {
    const { text } = await generateText({
      model: google(modelId),
      prompt: prompt,
    });

    return text;
  } catch (error) {
    console.error('AI SDK Error:', error);
    throw error;
  }
}

/**
 * Utility to stream Gemini responses for real-time UI updates
 */
export async function streamGemini(
  prompt: string,
  modelId: 'gemini-2.5-pro' | 'gemini-2.0-flash' = 'gemini-2.0-flash',
  options: { clinicId?: string; userId?: string; tier?: string; useCache?: boolean } = {}
) {
  const google = getAIProvider(options);

  return streamText({
    model: google(modelId),
    prompt: prompt,
  });
}
