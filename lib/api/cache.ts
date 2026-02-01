/**
 * API Cache System
 * ระบบแคชสำหรับ API responses เพื่อลดการเรียก API ซ้ำซ้อน
 * และเพิ่มความเร็วในการแสดงผลข้อมูล
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheConfig {
  defaultTTL?: number; // Time to live in milliseconds
  maxSize?: number;    // Maximum number of cache entries
}

export class APICache {
  private cache = new Map<string, CacheItem<any>>();
  private config: Required<CacheConfig>;

  constructor(config: CacheConfig = {}) {
    this.config = {
      defaultTTL: config.defaultTTL ?? 5 * 60 * 1000, // Default: 5 minutes
      maxSize: config.maxSize ?? 100, // Default: 100 entries
    };
  }

  /**
   * ดึงข้อมูลจาก cache
   * @param key - Cache key
   * @returns ข้อมูลที่แคชไว้ หรือ null ถ้าไม่มีหรือหมดอายุ
   */
  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }

    // ตรวจสอบว่าหมดอายุหรือไม่
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * เก็บข้อมูลลง cache
   * @param key - Cache key
   * @param data - ข้อมูลที่ต้องการแคช
   * @param ttl - Time to live (optional, ใช้ defaultTTL ถ้าไม่ระบุ)
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // ถ้า cache เต็ม ให้ลบรายการที่เก่าที่สุดออก
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const expirationTime = ttl ?? this.config.defaultTTL;
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + expirationTime,
    };

    this.cache.set(key, cacheItem);
  }

  /**
   * ลบข้อมูลจาก cache
   * @param key - Cache key (ถ้าไม่ระบุจะลบทั้งหมด)
   * @param pattern - Pattern สำหรับลบหลายรายการ (optional)
   */
  invalidate(key?: string, pattern?: string): void {
    if (!key && !pattern) {
      // ลบทั้งหมด
      this.cache.clear();
      return;
    }

    if (key) {
      // ลบรายการเดียว
      this.cache.delete(key);
    }

    if (pattern) {
      // ลบรายการที่ตรงกับ pattern
      for (const cacheKey of this.cache.keys()) {
        if (cacheKey.includes(pattern)) {
          this.cache.delete(cacheKey);
        }
      }
    }
  }

  /**
   * ตรวจสอบว่ามีข้อมูลใน cache หรือไม่
   * @param key - Cache key
   */
  has(key: string): boolean {
    const data = this.get(key);
    return data !== null;
  }

  /**
   * ดึงข้อมูลสถิติของ cache
   */
  getStats() {
    const now = Date.now();
    let activeCount = 0;
    let expiredCount = 0;

    for (const item of this.cache.values()) {
      if (now > item.expiresAt) {
        expiredCount++;
      } else {
        activeCount++;
      }
    }

    return {
      total: this.cache.size,
      active: activeCount,
      expired: expiredCount,
      maxSize: this.config.maxSize,
      defaultTTL: this.config.defaultTTL,
    };
  }

  /**
   * ทำความสะอาด cache โดยลบรายการที่หมดอายุ
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * สร้าง cache key จาก endpoint และ params
   */
  static createKey(endpoint: string, params?: Record<string, any>): string {
    if (!params) {
      return endpoint;
    }

    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');

    return `${endpoint}?${sortedParams}`;
  }
}

// Singleton instance สำหรับใช้งานทั่วไป
export const apiCache = new APICache({
  defaultTTL: 5 * 60 * 1000,  // 5 นาที
  maxSize: 100,
});

// Cache instance สำหรับ analytics (TTL นานกว่า)
export const analyticsCache = new APICache({
  defaultTTL: 10 * 60 * 1000, // 10 นาที
  maxSize: 50,
});

// Cache instance สำหรับข้อมูลที่เปลี่ยนบ่อย (TTL สั้นกว่า)
export const realtimeCache = new APICache({
  defaultTTL: 1 * 60 * 1000,  // 1 นาที
  maxSize: 50,
});
