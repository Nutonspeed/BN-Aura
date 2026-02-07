import { generateText, streamText } from 'ai';

/**
 * BN-Aura AI Provider Configuration
 * Uses Vercel AI Gateway (ai-gateway.vercel.sh)
 * Env: AI_GATEWAY_API_KEY (auto-detected by AI SDK)
 * Docs: https://vercel.com/docs/ai-gateway/getting-started
 */

/**
 * Call AI model via Vercel AI Gateway and get full text response
 * Model format: 'provider/model-name' e.g. 'google/gemini-2.5-flash'
 */
export async function callGemini(
  prompt: string,
  modelId: string = 'google/gemini-2.5-flash',
  options: { clinicId?: string; userId?: string; tier?: string; useCache?: boolean } = {}
) {
  try {
    const { text } = await generateText({
      model: modelId as any,
      prompt: prompt,
    });

    return text;
  } catch (error) {
    console.error('AI Gateway Error:', error);
    throw error;
  }
}

/**
 * Stream AI model response via Vercel AI Gateway
 */
export async function streamGemini(
  prompt: string,
  modelId: string = 'google/gemini-2.5-flash',
  options: { clinicId?: string; userId?: string; tier?: string; useCache?: boolean } = {}
) {
  return streamText({
    model: modelId as any,
    prompt: prompt,
  });
}

/**
 * Call AI with structured messages (chat format)
 */
export async function callAIChat(
  messages: Array<{ role: 'user' | 'system' | 'assistant'; content: string }>,
  modelId: string = 'google/gemini-2.5-flash',
) {
  try {
    const { text } = await generateText({
      model: modelId as any,
      messages: messages as any,
    });

    return text;
  } catch (error) {
    console.error('AI Gateway Chat Error:', error);
    throw error;
  }
}
