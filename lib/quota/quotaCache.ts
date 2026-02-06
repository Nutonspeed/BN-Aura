/**
 * QuotaCache - High-performance caching layer for QuotaManager
 * Reduces database queries and improves API response times
 */

interface CachedQuotaConfig {
  data: any;
  timestamp: number;
  expiresAt: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  updates: number;
  hitRate: number;
}

class QuotaCache {
  private static cache = new Map<string, CachedQuotaConfig>();
  private static stats: CacheStats = { hits: 0, misses: 0, updates: 0, hitRate: 0 };
  
  // Cache TTL configurations
  private static readonly TTL = {
    QUOTA_CONFIG: 60000,      // 1 minute for quota config
    USAGE_STATS: 30000,       // 30 seconds for usage stats  
    RECOMMENDATIONS: 300000,   // 5 minutes for recommendations
  };

  /**
   * Get cached quota config
   */
  static async getQuotaConfig(clinicId: string): Promise<any | null> {
    const cacheKey = `quota_config_${clinicId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() < cached.expiresAt) {
      this.stats.hits++;
      this.updateHitRate();
      console.log(`📈 Cache HIT: quota_config for ${clinicId}`);
      return cached.data;
    }
    
    this.stats.misses++;
    this.updateHitRate();
    console.log(`📉 Cache MISS: quota_config for ${clinicId}`);
    return null;
  }

  /**
   * Cache quota config data
   */
  static setQuotaConfig(clinicId: string, data: any): void {
    const cacheKey = `quota_config_${clinicId}`;
    const now = Date.now();
    
    this.cache.set(cacheKey, {
      data,
      timestamp: now,
      expiresAt: now + this.TTL.QUOTA_CONFIG
    });
    
    this.stats.updates++;
    console.log(`💾 Cached quota_config for ${clinicId} (TTL: ${this.TTL.QUOTA_CONFIG}ms)`);
  }

  /**
   * Get cached usage stats
   */
  static async getUsageStats(clinicId: string, period: string): Promise<any | null> {
    const cacheKey = `usage_stats_${clinicId}_${period}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() < cached.expiresAt) {
      this.stats.hits++;
      this.updateHitRate();
      return cached.data;
    }
    
    this.stats.misses++;
    this.updateHitRate();
    return null;
  }

  /**
   * Cache usage stats data
   */
  static setUsageStats(clinicId: string, period: string, data: any): void {
    const cacheKey = `usage_stats_${clinicId}_${period}`;
    const now = Date.now();
    
    this.cache.set(cacheKey, {
      data,
      timestamp: now,
      expiresAt: now + this.TTL.USAGE_STATS
    });
    
    this.stats.updates++;
  }

  /**
   * Get cached recommendations
   */
  static async getRecommendations(clinicId: string): Promise<any | null> {
    const cacheKey = `recommendations_${clinicId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() < cached.expiresAt) {
      this.stats.hits++;
      this.updateHitRate();
      return cached.data;
    }
    
    this.stats.misses++;
    this.updateHitRate();
    return null;
  }

  /**
   * Cache recommendations data
   */
  static setRecommendations(clinicId: string, data: any): void {
    const cacheKey = `recommendations_${clinicId}`;
    const now = Date.now();
    
    this.cache.set(cacheKey, {
      data,
      timestamp: now,
      expiresAt: now + this.TTL.RECOMMENDATIONS
    });
    
    this.stats.updates++;
  }

  /**
   * Invalidate cache for a clinic (when quota changes)
   */
  static invalidateClinic(clinicId: string): void {
    const keysToDelete: string[] = [];
    
    for (const [key] of this.cache.entries()) {
      if (key.includes(clinicId)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      console.log(`🗑️  Invalidated cache key: ${key}`);
    });
    
    console.log(`♻️  Cache invalidated for clinic: ${clinicId}`);
  }

  /**
   * Clean expired entries
   */
  static cleanExpired(): number {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, cached] of this.cache.entries()) {
      if (now >= cached.expiresAt) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned ${cleanedCount} expired cache entries`);
    }
    
    return cleanedCount;
  }

  /**
   * Get cache statistics
   */
  static getStats(): CacheStats & { cacheSize: number; avgAge: number } {
    const now = Date.now();
    let totalAge = 0;
    let entryCount = 0;
    
    for (const cached of this.cache.values()) {
      totalAge += (now - cached.timestamp);
      entryCount++;
    }
    
    return {
      ...this.stats,
      cacheSize: this.cache.size,
      avgAge: entryCount > 0 ? Math.round(totalAge / entryCount) : 0
    };
  }

  /**
   * Update hit rate calculation
   */
  private static updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? Math.round((this.stats.hits / total) * 100) : 0;
  }

  /**
   * Reset cache and stats (for testing)
   */
  static reset(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, updates: 0, hitRate: 0 };
    console.log('🔄 Cache reset');
  }

  /**
   * Warm up cache for a clinic
   */
  static async warmUp(clinicId: string, quotaManager: any): Promise<void> {
    console.log(`🔥 Warming up cache for clinic: ${clinicId}`);
    
    try {
      // Pre-load quota config
      const quotaConfig = await quotaManager.getQuotaConfig(clinicId);
      if (quotaConfig) {
        this.setQuotaConfig(clinicId, quotaConfig);
      }
      
      // Pre-load usage stats
      const usageStats = await quotaManager.getUsageStats(clinicId, 'current');
      if (usageStats) {
        this.setUsageStats(clinicId, 'current', usageStats);
      }
      
      // Pre-load recommendations
      const recommendations = await quotaManager.getRecommendations(clinicId);
      if (recommendations) {
        this.setRecommendations(clinicId, recommendations);
      }
      
      console.log(`✅ Cache warmed up for clinic: ${clinicId}`);
    } catch (error) {
      console.error(`❌ Cache warmup failed for ${clinicId}:`, error);
    }
  }
}

// Background cache maintenance
setInterval(() => {
  QuotaCache.cleanExpired();
}, 60000); // Clean every minute

export { QuotaCache };
