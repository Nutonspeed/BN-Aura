/**
 * Mobile AR Optimization System
 */

interface DeviceCapabilities {
  platform: 'iOS' | 'Android' | 'Desktop';
  processingPower: 'low' | 'medium' | 'high';
  memoryLevel: 'low' | 'medium' | 'high';
  supportsCamera: boolean;
}

interface OptimizationSettings {
  renderQuality: 'low' | 'medium' | 'high';
  frameRate: 15 | 30 | 60;
  resolution: { width: number; height: number };
  compressionLevel: number;
}

class MobileArOptimizer {
  private static capabilities: DeviceCapabilities | null = null;
  private static settings: OptimizationSettings | null = null;

  static async initialize(): Promise<boolean> {
    try {
      this.capabilities = await this.detectDevice();
      this.settings = this.generateSettings(this.capabilities);
      
      console.log(`📱 Mobile AR optimized for ${this.capabilities.platform} (${this.capabilities.processingPower})`);
      return true;
    } catch (error) {
      console.error('❌ Mobile AR optimization failed:', error);
      return false;
    }
  }

  static getOptimizedCameraConstraints(): MediaStreamConstraints {
    if (!this.settings) throw new Error('Not initialized');
    
    return {
      video: {
        facingMode: 'user',
        width: { ideal: this.settings.resolution.width },
        height: { ideal: this.settings.resolution.height },
        frameRate: { ideal: this.settings.frameRate }
      }
    };
  }

  static optimizeImage(imageData: string, canvas: HTMLCanvasElement): string {
    if (!this.settings) return imageData;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return imageData;
    
    const img = new Image();
    img.src = imageData;
    
    canvas.width = this.settings.resolution.width;
    canvas.height = this.settings.resolution.height;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    const quality = 1 - this.settings.compressionLevel;
    return canvas.toDataURL('image/jpeg', quality);
  }

  static getProcessingInterval(): number {
    if (!this.capabilities) return 1000;
    
    const intervals = {
      high: 500,    // 2 FPS processing
      medium: 1000, // 1 FPS processing  
      low: 2000     // 0.5 FPS processing
    };
    
    return intervals[this.capabilities.processingPower];
  }

  static getCapabilities(): DeviceCapabilities | null {
    return this.capabilities;
  }

  static getSettings(): OptimizationSettings | null {
    return this.settings;
  }

  private static async detectDevice(): Promise<DeviceCapabilities> {
    const userAgent = navigator.userAgent.toLowerCase();
    
    let platform: 'iOS' | 'Android' | 'Desktop' = 'Desktop';
    if (/iphone|ipad|ipod/.test(userAgent)) platform = 'iOS';
    else if (/android/.test(userAgent)) platform = 'Android';
    
    let processingPower: 'low' | 'medium' | 'high' = 'medium';
    if (platform === 'iOS') processingPower = 'high';
    else if (platform === 'Desktop') processingPower = 'high';
    
    let memoryLevel: 'low' | 'medium' | 'high' = 'medium';
    if ((navigator as any).deviceMemory) {
      const memory = (navigator as any).deviceMemory;
      if (memory <= 2) memoryLevel = 'low';
      else if (memory > 4) memoryLevel = 'high';
    }

    let supportsCamera = false;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      supportsCamera = devices.some(d => d.kind === 'videoinput');
    } catch {}

    return { platform, processingPower, memoryLevel, supportsCamera };
  }

  private static generateSettings(capabilities: DeviceCapabilities): OptimizationSettings {
    const { processingPower, memoryLevel } = capabilities;
    
    const configs = {
      high: { quality: 'high' as const, fps: 60 as const, res: { width: 1920, height: 1080 } },
      medium: { quality: 'medium' as const, fps: 30 as const, res: { width: 1280, height: 720 } },
      low: { quality: 'low' as const, fps: 15 as const, res: { width: 640, height: 480 } }
    };
    
    const config = configs[processingPower];
    const compression = memoryLevel === 'low' ? 0.4 : memoryLevel === 'medium' ? 0.2 : 0.1;
    
    return {
      renderQuality: config.quality,
      frameRate: config.fps,
      resolution: config.res,
      compressionLevel: compression
    };
  }
}

export { MobileArOptimizer, type DeviceCapabilities, type OptimizationSettings };
