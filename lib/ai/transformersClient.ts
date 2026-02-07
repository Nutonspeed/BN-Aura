/**
 * Transformers.js Client-Side Inference
 * Runs AI models directly in the browser (WebAssembly)
 * Reduces API calls + latency for real-time skin analysis
 * 
 * Models loaded on-demand and cached in IndexedDB
 */

// Dynamic import to avoid SSR issues
let pipeline: any = null;
let env: any = null;

async function loadTransformers() {
  if (!pipeline) {
    const mod = await import('@huggingface/transformers');
    pipeline = mod.pipeline;
    env = mod.env;
    // Use browser cache for model weights
    if (env) {
      env.useBrowserCache = true;
      env.allowLocalModels = false;
    }
  }
  return { pipeline, env };
}

// Model cache to avoid re-loading
const modelCache: Record<string, any> = {};

async function getOrLoadPipeline(task: string, model: string, options?: any): Promise<any> {
  const key = `${task}:${model}`;
  if (!modelCache[key]) {
    const { pipeline: pipelineFn } = await loadTransformers();
    console.log(`[Transformers.js] Loading ${model}...`);
    modelCache[key] = await pipelineFn(task, model, {
      device: 'webgpu' in navigator ? 'webgpu' : 'wasm',
      ...options,
    });
    console.log(`[Transformers.js] ${model} loaded ✅`);
  }
  return modelCache[key];
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface ClientSkinTypeResult {
  label: string;
  score: number;
  allLabels: Array<{ label: string; score: number }>;
}

export interface ClientAgeResult {
  estimatedAge: number;
  ageRange: string;
  confidence: number;
}

export interface ClientInferenceResult {
  skinType: ClientSkinTypeResult | null;
  age: ClientAgeResult | null;
  processingTime: number;
  device: string;
  errors: string[];
}

// ─────────────────────────────────────────────
// Client-Side Inference Functions
// ─────────────────────────────────────────────

/**
 * Classify skin type in browser
 * Model: Xenova/skin-types (quantized for browser)
 * Falls back to server-side if unavailable
 */
export async function classifySkinTypeClient(imageUrl: string): Promise<ClientSkinTypeResult | null> {
  try {
    const classifier = await getOrLoadPipeline(
      'image-classification',
      'dima806/skin_types_image_detection',
      { quantized: true }
    );

    const results = await classifier(imageUrl);

    if (Array.isArray(results) && results.length > 0) {
      const sorted = [...results].sort((a: any, b: any) => b.score - a.score);
      return {
        label: sorted[0].label.toLowerCase(),
        score: sorted[0].score,
        allLabels: sorted.map((r: any) => ({ label: r.label, score: r.score })),
      };
    }
    return null;
  } catch (error) {
    console.warn('[Transformers.js] Skin type classification failed:', error);
    return null;
  }
}

/**
 * Estimate age in browser
 * Model: nateraw/vit-age-classifier (quantized)
 */
export async function estimateAgeClient(imageUrl: string): Promise<ClientAgeResult | null> {
  try {
    const classifier = await getOrLoadPipeline(
      'image-classification',
      'nateraw/vit-age-classifier',
      { quantized: true }
    );

    const results = await classifier(imageUrl);

    if (Array.isArray(results) && results.length > 0) {
      const sorted = [...results].sort((a: any, b: any) => b.score - a.score);
      const topLabel = sorted[0].label;
      const match = topLabel.match(/(\d+)-(\d+)/);
      const midAge = match ? (parseInt(match[1]) + parseInt(match[2])) / 2 : 35;

      return {
        estimatedAge: Math.round(midAge),
        ageRange: topLabel,
        confidence: sorted[0].score,
      };
    }
    return null;
  } catch (error) {
    console.warn('[Transformers.js] Age estimation failed:', error);
    return null;
  }
}

/**
 * Run all available client-side models
 * Fast pre-analysis before sending to server for full HF + Gemini pipeline
 */
export async function runClientInference(imageUrl: string): Promise<ClientInferenceResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const device = 'webgpu' in navigator ? 'webgpu' : 'wasm';

  const [skinType, age] = await Promise.allSettled([
    classifySkinTypeClient(imageUrl),
    estimateAgeClient(imageUrl),
  ]);

  const skinTypeResult = skinType.status === 'fulfilled' ? skinType.value : null;
  if (skinType.status === 'rejected') errors.push('skin_type: ' + skinType.reason);

  const ageResult = age.status === 'fulfilled' ? age.value : null;
  if (age.status === 'rejected') errors.push('age: ' + age.reason);

  return {
    skinType: skinTypeResult,
    age: ageResult,
    processingTime: Date.now() - startTime,
    device,
    errors,
  };
}

/**
 * Check if Transformers.js is supported in the current browser
 */
export function isClientInferenceSupported(): boolean {
  if (typeof window === 'undefined') return false;
  if (typeof navigator === 'undefined') return false;
  // Need WebAssembly support
  return typeof WebAssembly !== 'undefined';
}

/**
 * Preload models in the background (call on page mount)
 */
export async function preloadModels(): Promise<void> {
  if (!isClientInferenceSupported()) return;
  
  try {
    // Load models in background - they'll be cached for later use
    await Promise.allSettled([
      getOrLoadPipeline('image-classification', 'dima806/skin_types_image_detection', { quantized: true }),
      getOrLoadPipeline('image-classification', 'nateraw/vit-age-classifier', { quantized: true }),
    ]);
    console.log('[Transformers.js] Models preloaded ✅');
  } catch (error) {
    console.warn('[Transformers.js] Preload failed (will retry on first use):', error);
  }
}
