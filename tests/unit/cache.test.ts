// Unit Tests for Cache Utilities
// Test Redis caching functionality

// Use the real cache implementation for unit tests.
// jest.setup.ts mocks this module globally, so we explicitly unmock it here.
jest.unmock('@/lib/cache/redis');

// Force memory-cache mode for deterministic tests (avoid Redis init).
delete process.env.REDIS_URL;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const cache = require('@/lib/cache/redis').default as {
  get: <T>(keyPrefix: string, fetchFunction: () => Promise<T>, options?: any) => Promise<T>;
  getStats: (keyPrefix?: string) => any;
};

describe('Cache Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const makeKey = () => `test-key-${Math.random().toString(36).slice(2)}`;

  describe('Basic Cache Operations', () => {
    it('should cache and retrieve data', async () => {
      const key = makeKey();
      const mockData = { id: '1', name: 'Test Clinic' };
      const mockFetch = jest.fn().mockResolvedValue(mockData);
      
      const result = await cache.get(key, mockFetch);
      
      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should return cached data on subsequent calls', async () => {
      const key = makeKey();
      const mockData = { id: '1', name: 'Test Clinic' };
      const mockFetch = jest.fn().mockResolvedValue(mockData);
      
      // First call
      await cache.get(key, mockFetch);
      // Second call
      const result = await cache.get(key, mockFetch);
      
      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle cache miss gracefully', async () => {
      const key = makeKey();
      const mockData = { id: '1', name: 'Test Clinic' };
      const mockFetch = jest.fn().mockResolvedValue(mockData);
      
      const result = await cache.get(key, mockFetch);
      
      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      const key = makeKey();
      const mockFetch = jest.fn().mockRejectedValue(new Error('Fetch failed'));
      
      await expect(cache.get(key, mockFetch)).rejects.toThrow('Fetch failed');
    });
  });

  describe('Cache Statistics', () => {
    it('should track cache hits and misses', async () => {
      const key = makeKey();
      const mockData = { id: '1' };
      const mockFetch = jest.fn().mockResolvedValue(mockData);
      
      // First call (miss)
      await cache.get(key, mockFetch);
      // Second call (hit)
      await cache.get(key, mockFetch);
      
      const stats = cache.getStats(key);
      
      expect(stats).toBeDefined();
      expect(stats.totalRequests).toBe(2);
      expect(stats.hits + stats.misses).toBe(2);
    });
  });
});
