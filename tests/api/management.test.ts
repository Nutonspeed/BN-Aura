// API Tests for Management Endpoints
// Test Super Admin Management API functionality

import { GET, POST } from '@/app/api/admin/management/route';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/supabase/admin');
jest.mock('@/lib/cache/redis');

describe('Management API', () => {
  let mockRequest: NextRequest;
  let mockAdminClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock admin client
    mockAdminClient = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
    };
    
    const { createAdminClient } = require('@/lib/supabase/admin');
    createAdminClient.mockReturnValue(mockAdminClient);
    
    // Mock request
    mockRequest = {
      headers: {
        get: jest.fn().mockImplementation((header: string) => {
          if (header === 'authorization') {
            return 'Bearer valid-jwt-token';
          }
          return null;
        }),
      },
      url: 'http://localhost:3000/api/admin/management',
    } as any;
  });

  describe('GET /api/admin/management', () => {
    it('should return system stats for super admin', async () => {
      // Mock authentication
      mockAdminClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'super-admin-id' } },
      });
      
      mockAdminClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'super_admin' },
            }),
          }),
        }),
      });

      // Mock stats cache
      const { statsCache } = require('@/lib/cache/redis');
      statsCache.getSystemStats.mockResolvedValue({
        totalClinics: 10,
        totalUsers: 100,
        totalStaff: 20,
      });

      // Mock database queries
      mockAdminClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          count: jest.fn().mockReturnValue({
            head: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                count: 50,
              }),
            }),
          }),
        }),
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.totalClinics).toBe(10);
      expect(data.data.globalCustomers).toBe(50);
    });

    it('should return 401 for unauthorized requests', async () => {
      // Mock missing authorization
      (mockRequest.headers.get as jest.Mock).mockReturnValue(null);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized: No token provided');
    });

    it('should return 403 for non-super admin users', async () => {
      // Mock authentication
      mockAdminClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
      });
      
      mockAdminClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'clinic_owner' },
            }),
          }),
        }),
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden: Super Admin access required');
    });

    it('should return clinics list', async () => {
      // Update URL to include type=clinics
      Object.defineProperty(mockRequest, 'url', {
        value: 'http://localhost:3000/api/admin/management?type=clinics',
        writable: true
      });

      // Mock authentication
      mockAdminClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'super-admin-id' } },
      });
      
      mockAdminClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'super_admin' },
            }),
          }),
        }),
      });

      // Mock clinic cache
      const { clinicCache } = require('@/lib/cache/redis');
      clinicCache.getAllClinics.mockResolvedValue([
        {
          id: '1',
          display_name: { en: 'Test Clinic' },
          is_active: true,
        },
      ]);

      // Mock detailed clinic info
      mockAdminClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { created_at: '2024-01-01', metadata: {} },
            }),
          }),
        }),
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.clinics).toBeDefined();
    });
  });

  describe('POST /api/admin/management', () => {
    it('should create new clinic', async () => {
      // Mock authentication
      mockAdminClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'super-admin-id' } },
      });
      
      mockAdminClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'super_admin' },
            }),
          }),
        }),
      });

      // Mock clinic creation
      mockAdminClient.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'new-clinic-id',
                clinic_code: 'CLINIC001',
                display_name: { en: 'New Clinic' },
              },
            }),
          }),
        }),
      });

      const clinicData = {
        name: 'New Clinic',
        subscription_tier: 'professional',
      };

      mockRequest = {
        ...mockRequest,
        method: 'POST',
        json: jest.fn().mockResolvedValue({
          action: 'createClinic',
          clinicData,
        }),
      } as any;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.clinic.id).toBe('new-clinic-id');
    });

    it('should update clinic status', async () => {
      // Mock authentication
      mockAdminClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'super-admin-id' } },
      });
      
      mockAdminClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'super_admin' },
            }),
          }),
        }),
      });

      // Mock clinic update
      mockAdminClient.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      // Mock cache invalidation
      const { clinicCache, statsCache } = require('@/lib/cache/redis');
      clinicCache.invalidateClinicCache.mockResolvedValue(undefined);
      statsCache.invalidateStatsCache.mockResolvedValue(undefined);

      mockRequest = {
        ...mockRequest,
        method: 'POST',
        json: jest.fn().mockResolvedValue({
          action: 'updateStatus',
          clinicId: 'clinic-1',
          status: 'active',
        }),
      } as any;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Clinic status updated to active');
      
      // Verify cache invalidation
      expect(clinicCache.invalidateClinicCache).toHaveBeenCalled();
      expect(statsCache.invalidateStatsCache).toHaveBeenCalled();
    });

    it('should handle invalid actions', async () => {
      // Mock authentication
      mockAdminClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'super-admin-id' } },
      });
      
      mockAdminClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'super_admin' },
            }),
          }),
        }),
      });

      mockRequest = {
        ...mockRequest,
        method: 'POST',
        json: jest.fn().mockResolvedValue({
          action: 'invalidAction',
        }),
      } as any;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid action');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock authentication
      mockAdminClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'super-admin-id' } },
      });
      
      mockAdminClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(new Error('Database error')),
          }),
        }),
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('should handle invalid JSON in POST requests', async () => {
      // Mock authentication
      mockAdminClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'super-admin-id' } },
      });
      
      mockAdminClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'super_admin' },
            }),
          }),
        }),
      });

      mockRequest = {
        ...mockRequest,
        method: 'POST',
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as any;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
});
