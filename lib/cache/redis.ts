// Redis Caching Utility for BN-Aura
// Redis cache implementation with intelligent strategies

interface CacheOptions {
  ttl?: number; // Time to live in seconds (default: 300 = 5 minutes)
  key?: string; // Custom cache key (auto-generated if not provided)
  tags?: string[]; // Cache tags for bulk invalidation
}

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
}

class RedisCache {
  private redis: any;
  private memoryCache: any;
  private stats: Map<string, CacheStats> = new Map();
  private isEnabled: boolean;
  private useMemoryFallback: boolean;

  constructor() {
    this.isEnabled = process.env.REDIS_URL !== undefined;
    this.useMemoryFallback = false;
    
    // Always initialize memory cache as fallback
    this.initializeMemoryCache();
    
    if (this.isEnabled) {
      this.initializeRedis();
    } else {
      console.log('[v0] Redis not configured - using memory cache');
      this.useMemoryFallback = true;
    }
  }

  private initializeMemoryCache() {
    // Create simple inline memory cache
    const cache = new Map<string, { value: any; expiresAt: number }>();
    
    this.memoryCache = {
      async get(key: string) {
        const entry = cache.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) {
          cache.delete(key);
          return null;
        }
        return entry.value;
      },
      async set(key: string, value: any, ttl: number) {
        cache.set(key, {
          value,
          expiresAt: Date.now() + (ttl * 1000)
        });
      },
      async del(key: string) {
        cache.delete(key);
      },
      async exists(key: string) {
        const entry = cache.get(key);
        if (!entry) return false;
        if (Date.now() > entry.expiresAt) {
          cache.delete(key);
          return false;
        }
        return true;
      },
      async ttl(key: string) {
        const entry = cache.get(key);
        if (!entry) return -2;
        const remaining = Math.floor((entry.expiresAt - Date.now()) / 1000);
        return remaining > 0 ? remaining : -2;
      },
      async keys(pattern: string) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return Array.from(cache.keys()).filter(k => regex.test(k));
      }
    };
  }

  private async initializeRedis() {
    try {
      const Redis = require('ioredis');
      this.redis = new Redis(process.env.REDIS_URL, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      });

      this.redis.on('error', (error: Error) => {
        console.error('[v0] Redis connection error:', error.message);
        console.log('[v0] Falling back to memory cache');
        this.useMemoryFallback = true;
      });

      this.redis.on('connect', () => {
        console.log('[v0] Redis connected successfully');
        this.useMemoryFallback = false;
      });

      await this.redis.connect();
    } catch (error) {
      console.error('[v0] Failed to initialize Redis:', error);
      console.log('[v0] Using memory cache fallback');
      this.useMemoryFallback = true;
    }
  }

  private generateKey(prefix: string, params: any = {}): string {
    const paramString = JSON.stringify(params, Object.keys(params).sort());
    const hash = require('crypto').createHash('md5').update(paramString).digest('hex');
    return `bn-aura:${prefix}:${hash}`;
  }

  private updateStats(key: string, hit: boolean) {
    if (!this.stats.has(key)) {
      this.stats.set(key, { hits: 0, misses: 0, hitRate: 0, totalRequests: 0 });
    }

    const stats = this.stats.get(key)!;
    stats.totalRequests++;
    
    if (hit) {
      stats.hits++;
    } else {
      stats.misses++;
    }
    
    stats.hitRate = stats.hits / stats.totalRequests;
  }

  /**
   * Get cached data or fetch and cache new data
   */
  async get<T>(
    keyPrefix: string,
    fetchFunction: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const key = options.key || this.generateKey(keyPrefix, { options });
    const ttl = options.ttl || 300;

    try {
      // Use memory cache if Redis is disabled or fallback is active
      if (this.useMemoryFallback || !this.isEnabled) {
        const cached = await this.memoryCache.get(key);
        if (cached !== null && cached !== undefined) {
          this.updateStats(keyPrefix, true);
          return cached;
        }

        this.updateStats(keyPrefix, false);
        const data = await fetchFunction();
        await this.memoryCache.set(key, data, ttl);
        return data;
      }

      // Try Redis
      const cached = await this.redis.get(key);
      if (cached) {
        this.updateStats(keyPrefix, true);
        return JSON.parse(cached);
      }

      // Cache miss - fetch and cache
      this.updateStats(keyPrefix, false);
      
      const data = await fetchFunction();
      
      // Cache the result
      await this.redis.setex(key, ttl, JSON.stringify(data));
      
      // Add tags if provided
      if (options.tags && options.tags.length > 0) {
        for (const tag of options.tags) {
          await this.redis.sadd(`tag:${tag}`, key);
          await this.redis.expire(`tag:${tag}`, ttl);
        }
      }

      return data;
    } catch (error) {
      console.error('[v0] Cache error:', error);
      // Fallback to direct fetch
      return await fetchFunction();
    }
  }

  /**
   * Invalidate cache by key pattern
   */
  async invalidate(keyPrefix: string, params: any = {}): Promise<void> {
    const key = this.generateKey(keyPrefix, params);
    
    try {
      if (this.useMemoryFallback || !this.isEnabled) {
        await this.memoryCache.del(key);
        return;
      }
      
      await this.redis.del(key);
    } catch (error) {
      console.error('[v0] Cache invalidation error:', error);
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTag(tag: string): Promise<void> {
    try {
      if (this.useMemoryFallback || !this.isEnabled) {
        // Memory cache doesn't support tags, clear all matching pattern
        const keys = await this.memoryCache.keys(`*${tag}*`);
        for (const key of keys) {
          await this.memoryCache.del(key);
        }
        return;
      }

      const keys = await this.redis.smembers(`tag:${tag}`);
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
        await this.redis.del(`tag:${tag}`);
      }
    } catch (error) {
      console.error('[v0] Tag invalidation error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(keyPrefix?: string): Map<string, CacheStats> | CacheStats | null {
    if (keyPrefix) {
      return this.stats.get(keyPrefix) || null;
    }
    return this.stats;
  }

  /**
   * Clear all cache (use with caution)
   */
  async clear(): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const keys = await this.redis.keys('bn-aura:*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
        console.log(`Cleared ${keys.length} cache entries`);
      }
      this.stats.clear();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; latency?: number; error?: string }> {
    if (!this.isEnabled) {
      return { status: 'disabled' };
    }

    try {
      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;
      
      return { 
        status: 'healthy', 
        latency 
      };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

// Singleton instance
const cache = new RedisCache();

export default cache;

// Specific cache helpers for common queries
export const clinicCache = {
  getAllClinics: () => cache.get(
    'clinics:all',
    async () => {
      const { createAdminClient } = await import('@/lib/supabase/admin');
      const adminClient = createAdminClient();
      
      const { data } = await adminClient
        .from('clinics')
        .select('id, display_name, is_active, clinic_code, subscription_tier')
        .eq('is_active', true)
        .order('display_name');
      
      return data || [];
    },
    { ttl: 600, tags: ['clinics'] } // 10 minutes cache
  ),

  getClinicById: (clinicId: string) => cache.get(
    'clinics:by-id',
    async () => {
      const { createAdminClient } = await import('@/lib/supabase/admin');
      const adminClient = createAdminClient();
      
      const { data } = await adminClient
        .from('clinics')
        .select('*')
        .eq('id', clinicId)
        .single();
      
      return data;
    },
    { ttl: 1800, tags: ['clinics'] } // 30 minutes cache
  ),

  invalidateClinicCache: () => cache.invalidateByTag('clinics')
};

export const userCache = {
  getUsersByClinic: (clinicId: string) => cache.get(
    'users:by-clinic',
    async () => {
      const { createAdminClient } = await import('@/lib/supabase/admin');
      const adminClient = createAdminClient();
      
      const { data } = await adminClient
        .from('users')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('is_active', true);
      
      return data || [];
    },
    { ttl: 300, tags: ['users'] } // 5 minutes cache
  ),

  invalidateUserCache: () => cache.invalidateByTag('users')
};

export const statsCache = {
  getSystemStats: () => cache.get(
    'stats:system',
    async () => {
      const { createAdminClient } = await import('@/lib/supabase/admin');
      const adminClient = createAdminClient();
      
      const [
        clinicsResult,
        usersResult,
        staffResult
      ] = await Promise.all([
        adminClient.from('clinics').select('id', { count: 'exact', head: true }),
        adminClient.from('users').select('id', { count: 'exact', head: true }),
        adminClient.from('clinic_staff').select('id', { count: 'exact', head: true })
      ]);

      return {
        totalClinics: clinicsResult.count || 0,
        totalUsers: usersResult.count || 0,
        totalStaff: staffResult.count || 0
      };
    },
    { ttl: 120, tags: ['stats'] } // 2 minutes cache
  ),

  invalidateStatsCache: () => cache.invalidateByTag('stats')
};
