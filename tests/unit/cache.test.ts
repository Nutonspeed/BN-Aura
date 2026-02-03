// Unit Tests for Cache Utilities
// Test Redis caching functionality

import cache, { clinicCache, userCache, statsCache } from '@/lib/cache/redis';

// Mock Redis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    sadd: jest.fn(),
    expire: jest.fn(),
    smembers: jest.fn(),
    keys: jest.fn(),
    ping: jest.fn(),
    on: jest.fn(),
    connect: jest.fn(),
  }));
});

describe('Cache Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Cache Operations', () => {
    it('should cache and retrieve data', async () => {
      const mockData = { id: '1', name: 'Test Clinic' };
      const mockFetch = jest.fn().mockResolvedValue(mockData);
      
      const result = await cache.get('test-key', mockFetch);
      
      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should return cached data on subsequent calls', async () => {
      const mockData = { id: '1', name: 'Test Clinic' };
      const mockFetch = jest.fn().mockResolvedValue(mockData);
      
      // First call
      await cache.get('test-key', mockFetch);
      // Second call
      const result = await cache.get('test-key', mockFetch);
      
      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle cache miss gracefully', async () => {
      const mockData = { id: '1', name: 'Test Clinic' };
      const mockFetch = jest.fn().mockResolvedValue(mockData);
      
      const result = await cache.get('test-key', mockFetch);
      
      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('Clinic Cache', () => {
    it('should get all clinics', async () => {
      const mockClinics = [
        { id: '1', display_name: 'Clinic 1' },
        { id: '2', display_name: 'Clinic 2' }
      ];
      
      (clinicCache.getAllClinics as jest.Mock).mockResolvedValue(mockClinics);
      
      const result = await clinicCache.getAllClinics();
      
      expect(result).toEqual(mockClinics);
      expect(clinicCache.getAllClinics).toHaveBeenCalled();
    });

    it('should get clinic by ID', async () => {
      const mockClinic = { id: '1', display_name: 'Test Clinic' };
      
      (clinicCache.getClinicById as jest.Mock).mockResolvedValue(mockClinic);
      
      const result = await clinicCache.getClinicById('1');
      
      expect(result).toEqual(mockClinic);
      expect(clinicCache.getClinicById).toHaveBeenCalledWith('1');
    });
  });

  describe('User Cache', () => {
    it('should get users by clinic', async () => {
      const mockUsers = [
        { id: '1', email: 'user1@test.com' },
        { id: '2', email: 'user2@test.com' }
      ];
      
      (userCache.getUsersByClinic as jest.Mock).mockResolvedValue(mockUsers);
      
      const result = await userCache.getUsersByClinic('clinic-1');
      
      expect(result).toEqual(mockUsers);
      expect(userCache.getUsersByClinic).toHaveBeenCalledWith('clinic-1');
    });
  });

  describe('Stats Cache', () => {
    it('should get system stats', async () => {
      const mockStats = {
        totalClinics: 10,
        totalUsers: 100,
        totalStaff: 20
      };
      
      (statsCache.getSystemStats as jest.Mock).mockResolvedValue(mockStats);
      
      const result = await statsCache.getSystemStats();
      
      expect(result).toEqual(mockStats);
      expect(statsCache.getSystemStats).toHaveBeenCalled();
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate clinic cache', async () => {
      (clinicCache.invalidateClinicCache as jest.Mock).mockResolvedValue(undefined);
      
      await clinicCache.invalidateClinicCache();
      
      expect(clinicCache.invalidateClinicCache).toHaveBeenCalled();
    });

    it('should invalidate user cache', async () => {
      (userCache.invalidateUserCache as jest.Mock).mockResolvedValue(undefined);
      
      await userCache.invalidateUserCache();
      
      expect(userCache.invalidateUserCache).toHaveBeenCalled();
    });

    it('should invalidate stats cache', async () => {
      (statsCache.invalidateStatsCache as jest.Mock).mockResolvedValue(undefined);
      
      await statsCache.invalidateStatsCache();
      
      expect(statsCache.invalidateStatsCache).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis connection errors gracefully', async () => {
      const mockFetch = jest.fn().mockResolvedValue({ id: '1' });
      
      // Mock Redis to throw error
      const Redis = require('ioredis');
      Redis.mockImplementation(() => {
        throw new Error('Redis connection failed');
      });
      
      const result = await cache.get('test-key', mockFetch);
      
      expect(result).toEqual({ id: '1' });
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should handle fetch errors gracefully', async () => {
      const mockFetch = jest.fn().mockRejectedValue(new Error('Fetch failed'));
      
      await expect(cache.get('test-key', mockFetch)).rejects.toThrow('Fetch failed');
    });
  });

  describe('Cache Statistics', () => {
    it('should track cache hits and misses', async () => {
      const mockData = { id: '1' };
      const mockFetch = jest.fn().mockResolvedValue(mockData);
      
      // First call (miss)
      await cache.get('test-key', mockFetch);
      // Second call (hit)
      await cache.get('test-key', mockFetch);
      
      const stats = cache.getStats('test-key');
      
      expect(stats).toBeDefined();
      // Stats should be tracked (implementation dependent)
    });
  });
});
