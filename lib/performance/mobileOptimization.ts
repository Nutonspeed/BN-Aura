/**
 * Mobile Performance Optimization
 * Device detection, lightweight pipeline, and progressive processing
 */

export interface DeviceCapabilities {
  isMobile: boolean;
  isLowEnd: boolean;
  hasLimitedMemory: boolean;
  hasSlowCPU: boolean;
  networkSpeed: 'slow' | 'fast' | 'unknown';
  screenSize: 'small' | 'medium' | 'large';
}

export interface MobileOptimizationConfig {
  useLightweightModels: boolean;
  reduceImageQuality: boolean;
  enableProgressiveLoading: boolean;
  maxProcessingTime: number;
  batchSize: number;
}

/**
 * Detect device capabilities for mobile optimization
 */
export function detectDeviceCapabilities(): DeviceCapabilities {
  if (typeof window === 'undefined') {
    // Server-side fallback
    return {
      isMobile: false,
      isLowEnd: false,
      hasLimitedMemory: false,
      hasSlowCPU: false,
      networkSpeed: 'unknown',
      screenSize: 'medium'
    };
  }

  const userAgent = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  // Detect low-end devices based on hardware and memory
  const isLowEnd = detectLowEndDevice();
  const hasLimitedMemory = detectLimitedMemory();
  const hasSlowCPU = detectSlowCPU();
  const networkSpeed = detectNetworkSpeed();
  const screenSize = detectScreenSize();

  return {
    isMobile,
    isLowEnd,
    hasLimitedMemory,
    hasSlowCPU,
    networkSpeed,
    screenSize
  };
}

/**
 * Get mobile optimization configuration based on device capabilities
 */
export function getMobileOptimizationConfig(capabilities: DeviceCapabilities): MobileOptimizationConfig {
  const baseConfig: MobileOptimizationConfig = {
    useLightweightModels: false,
    reduceImageQuality: false,
    enableProgressiveLoading: false,
    maxProcessingTime: 30000, // 30 seconds default
    batchSize: 1
  };

  // Adjust configuration based on device capabilities
  if (capabilities.isMobile) {
    baseConfig.enableProgressiveLoading = true;
    baseConfig.maxProcessingTime = 20000; // 20 seconds for mobile
  }

  if (capabilities.isLowEnd) {
    baseConfig.useLightweightModels = true;
    baseConfig.reduceImageQuality = true;
    baseConfig.maxProcessingTime = 15000; // 15 seconds for low-end
    baseConfig.batchSize = 1;
  }

  if (capabilities.hasLimitedMemory) {
    baseConfig.useLightweightModels = true;
    baseConfig.batchSize = 1;
  }

  if (capabilities.hasSlowCPU) {
    baseConfig.useLightweightModels = true;
    baseConfig.maxProcessingTime = 10000; // 10 seconds for slow CPU
  }

  if (capabilities.networkSpeed === 'slow') {
    baseConfig.reduceImageQuality = true;
    baseConfig.enableProgressiveLoading = true;
  }

  return baseConfig;
}

/**
 * Optimize image for mobile processing
 */
export function optimizeImageForMobile(
  imageData: string,
  config: MobileOptimizationConfig
): string {
  if (!config.reduceImageQuality) {
    return imageData;
  }

  try {
    // Create canvas to resize image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return imageData;

    const img = new Image();
    img.src = imageData;

    // Calculate new dimensions (reduce to 70% for mobile, 50% for low-end)
    const scaleFactor = config.useLightweightModels ? 0.5 : 0.7;
    canvas.width = img.width * scaleFactor;
    canvas.height = img.height * scaleFactor;

    // Draw and resize image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Convert back to base64 with reduced quality
    return canvas.toDataURL('image/jpeg', 0.7);
  } catch (error) {
    console.warn('Failed to optimize image for mobile:', error);
    return imageData;
  }
}

/**
 * Lightweight model selection for mobile
 */
export function selectLightweightModels(config: MobileOptimizationConfig): string[] {
  if (!config.useLightweightModels) {
    return ['skin-type', 'age-estimation', 'basic-conditions'];
  }

  // For low-end devices, use only essential models
  return ['skin-type', 'basic-conditions'];
}

/**
 * Progressive processing handler
 */
export class ProgressiveProcessor {
  private config: MobileOptimizationConfig;
  private onProgress?: (progress: number, stage: string) => void;

  constructor(config: MobileOptimizationConfig, onProgress?: (progress: number, stage: string) => void) {
    this.config = config;
    this.onProgress = onProgress;
  }

  async processWithProgress<T>(
    stages: Array<{
      name: string;
      weight: number;
      processor: () => Promise<T>;
    }>
  ): Promise<T[]> {
    if (!this.config.enableProgressiveLoading) {
      // Process all stages sequentially without progress updates
      const results = [];
      for (const stage of stages) {
        results.push(await stage.processor());
      }
      return results;
    }

    const results: T[] = [];
    const totalWeight = stages.reduce((sum, stage) => sum + stage.weight, 0);
    let currentProgress = 0;

    for (const stage of stages) {
      this.onProgress?.(currentProgress, `Starting ${stage.name}...`);
      
      try {
        const result = await this.processStageWithTimeout(stage);
        results.push(result);
        
        currentProgress += (stage.weight / totalWeight) * 100;
        this.onProgress?.(currentProgress, `Completed ${stage.name}`);
      } catch (error) {
        console.warn(`Stage ${stage.name} failed:`, error);
        // Continue with next stage even if current fails
      }
    }

    return results;
  }

  private async processStageWithTimeout<T>(stage: { processor: () => Promise<T> }): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Stage timeout')), this.config.maxProcessingTime);
    });

    return Promise.race([stage.processor(), timeoutPromise]);
  }
}

/**
 * Memory management for mobile
 */
export class MobileMemoryManager {
  private static instance: MobileMemoryManager;
  private cache = new Map<string, any>();
  private maxCacheSize = 10; // Limit cache size for mobile

  static getInstance(): MobileMemoryManager {
    if (!MobileMemoryManager.instance) {
      MobileMemoryManager.instance = new MobileMemoryManager();
    }
    return MobileMemoryManager.instance;
  }

  set(key: string, value: any): void {
    // Implement LRU cache for mobile
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  get(key: string): any {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  clear(): void {
    this.cache.clear();
  }

  getMemoryUsage(): number {
    return this.cache.size;
  }
}

// Helper functions for device detection
function detectLowEndDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  
  // Check for common low-end device indicators
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Android devices with less than 4GB RAM
  if (userAgent.includes('android')) {
    // Check for specific low-end Android models
    const lowEndModels = ['moto g', 'galaxy a', 'redmi', 'oppo a', 'vivo y'];
    return lowEndModels.some(model => userAgent.includes(model));
  }
  
  // Older iOS devices (iPhone 8 and below)
  if (userAgent.includes('iphone')) {
    const iOSVersion = userAgent.match(/os (\d+)_(\d+)/);
    if (iOSVersion) {
      const majorVersion = parseInt(iOSVersion[1]);
      return majorVersion <= 13; // iOS 13 and below considered low-end
    }
  }
  
  return false;
}

function detectLimitedMemory(): boolean {
  if (typeof navigator === 'undefined') return false;
  
  // Check device memory API if available
  if ('deviceMemory' in navigator) {
    const memory = (navigator as any).deviceMemory;
    return memory < 4; // Less than 4GB considered limited
  }
  
  return detectLowEndDevice(); // Fallback to low-end detection
}

function detectSlowCPU(): boolean {
  if (typeof navigator === 'undefined') return false;
  
  // Check hardware concurrency
  if ('hardwareConcurrency' in navigator) {
    const cores = navigator.hardwareConcurrency;
    return cores < 4; // Less than 4 cores considered slow
  }
  
  return detectLowEndDevice(); // Fallback to low-end detection
}

function detectNetworkSpeed(): 'slow' | 'fast' | 'unknown' {
  if (typeof navigator === 'undefined') return 'unknown';
  
  // Check connection API if available
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    if (connection) {
      const effectiveType = connection.effectiveType;
      if (effectiveType === 'slow-2g' || effectiveType === '2g') {
        return 'slow';
      }
      if (effectiveType === '4g') {
        return 'fast';
      }
    }
  }
  
  return 'unknown';
}

function detectScreenSize(): 'small' | 'medium' | 'large' {
  if (typeof window === 'undefined') return 'medium';
  
  const width = window.screen.width;
  const height = window.screen.height;
  const minDimension = Math.min(width, height);
  
  if (minDimension < 768) return 'small';
  if (minDimension < 1200) return 'medium';
  return 'large';
}

/**
 * Mobile-specific error messages
 */
export const MOBILE_ERROR_MESSAGES = {
  LOW_PERFORMANCE: '📱 อุปกรณ์มีประสิทธิภาพต่ำ กำลังใช้โหมดวิเคราะห์แบบกระชับ',
  SLOW_NETWORK: '📶 ความเร็วเครือข่ายช้า กำลังลดคุณภาพภาพเพื่อความเร็ว',
  TIMEOUT: '⏰ หมดเวลาวิเคราะห์ กรุณาลองใหม่ในภายหลัง',
  MEMORY_LIMIT: '🧠 หน่วยความจำเต็ม กำลังลดข้อมูลชั่วคราว',
  PROGRESSIVE_LOADING: '⚡ กำลังโหลดแบบทีละส่วนเพื่อประสิทธิภาพที่ดีขึ้น'
};
