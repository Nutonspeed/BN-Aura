/**
 * Production Transformers.js Client-Side Inference
 * Dynamically loads transformers.js from CDN for production
 * Fallback to server-side if CDN unavailable
 */

// Dynamic import to avoid SSR issues
let pipeline: any = null;
let env: any = null;
let isLoading = false;
let loadPromise: Promise<{ pipeline: any; env: any }> | null = null;

async function loadTransformers(): Promise<{ pipeline: any; env: any }> {
  if (!pipeline && !isLoading) {
    isLoading = true;
    loadPromise = (async () => {
      try {
        // Try to load from CDN first
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js';
        script.type = 'module';
        
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
        
        // Import the module
        const mod = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js');
        pipeline = mod.pipeline;
        env = mod.env;
        
        // Use browser cache for model weights
        if (env) {
          env.useBrowserCache = true;
          env.allowLocalModels = false;
        }
        
        console.log('[Transformers.js] Loaded from CDN ✅');
        return { pipeline, env };
      } catch (error) {
        console.warn('[Transformers.js] CDN load failed, falling back to server-side:', error);
        throw error;
      } finally {
        isLoading = false;
        loadPromise = null;
      }
    })();
  }
  
  if (loadPromise) return loadPromise;
  return loadTransformers();
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
 * Model: Xenova/skin_types (quantized for browser)
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
 * Estimate age from face image
 * Model: nateraw/vit-age-classifier (quantized for browser)
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
      const age = parseInt(sorted[0].label);
      
      // Calculate age range based on confidence
      const confidence = sorted[0].score;
      let ageRange = '';
      if (confidence > 0.8) {
        ageRange = `${age - 2}-${age + 2}`;
      } else if (confidence > 0.6) {
        ageRange = `${age - 5}-${age + 5}`;
      } else {
        ageRange = `${age - 10}-${age + 10}`;
      }

      return {
        estimatedAge: age,
        ageRange,
        confidence,
      };
    }
    return null;
  } catch (error) {
    console.warn('[Transformers.js] Age estimation failed:', error);
    return null;
  }
}

/**
 * Run both skin type and age estimation
 * Returns combined results with processing time
 */
export async function runClientInference(imageUrl: string): Promise<ClientInferenceResult> {
  const startTime = Date.now();
  const device = 'webgpu' in navigator ? 'webgpu' : 'wasm';
  const errors: string[] = [];

  // Run both in parallel
  const [skinType, age] = await Promise.allSettled([
    classifySkinTypeClient(imageUrl),
    estimateAgeClient(imageUrl),
  ]);

  if (skinType.status === 'rejected') errors.push('skin_type: ' + skinType.reason);
  const skinTypeResult = skinType.status === 'fulfilled' ? skinType.value : null;

  if (age.status === 'rejected') errors.push('age: ' + age.reason);
  const ageResult = age.status === 'fulfilled' ? age.value : null;

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
