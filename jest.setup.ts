// Jest Setup File for BN-Aura
// Global test configuration and mocks

import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Mock Supabase
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
      getSession: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
        order: jest.fn(() => ({
          limit: jest.fn(),
        })),
      })),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    })),
  })),
}));

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
        order: jest.fn(() => ({
          limit: jest.fn(),
        })),
      })),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    })),
  })),
}));

// Mock Redis cache
jest.mock('@/lib/cache/redis', () => ({
  default: {
    get: jest.fn(),
    invalidate: jest.fn(),
    invalidateByTag: jest.fn(),
    getStats: jest.fn(),
    clear: jest.fn(),
    healthCheck: jest.fn(),
  },
  clinicCache: {
    getAllClinics: jest.fn(),
    getClinicById: jest.fn(),
    invalidateClinicCache: jest.fn(),
  },
  userCache: {
    getUsersByClinic: jest.fn(),
    invalidateUserCache: jest.fn(),
  },
  statsCache: {
    getSystemStats: jest.fn(),
    invalidateStatsCache: jest.fn(),
  },
}));

// Mock Sentry
jest.mock('@/lib/monitoring/sentry', () => ({
  PerformanceTracker: {
    startTransaction: jest.fn(),
    trackAPICall: jest.fn(),
    trackDatabaseQuery: jest.fn(),
    trackCacheOperation: jest.fn(),
    trackUserAction: jest.fn(),
  },
  ErrorHandler: {
    captureException: jest.fn(),
    captureMessage: jest.fn(),
    setUser: jest.fn(),
    clearUser: jest.fn(),
    setTag: jest.fn(),
    setContext: jest.fn(),
  },
  HealthMonitor: {
    checkPerformance: jest.fn(),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch
global.fetch = jest.fn();

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.SENTRY_DSN = 'https://test-sentry-dsn';

// Global test utilities
(global as any).createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  role: 'super_admin',
  clinic_id: 'test-clinic-id',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

(global as any).createMockClinic = (overrides = {}) => ({
  id: 'test-clinic-id',
  clinic_code: 'TEST001',
  display_name: { en: 'Test Clinic', th: 'คลินิกทดสอบ' },
  is_active: true,
  subscription_tier: 'professional',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

(global as any).createMockStaff = (overrides = {}) => ({
  id: 'test-staff-id',
  user_id: 'test-user-id',
  clinic_id: 'test-clinic-id',
  role: 'clinic_admin',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

// Suppress console warnings during tests
const originalWarn = console.warn;
const originalError = console.error;

beforeEach(() => {
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  console.warn = originalWarn;
  console.error = originalError;
  jest.clearAllMocks();
});

// Add custom matchers
expect.extend({
  toBeValidClinic(received: any) {
    const pass = received && 
      typeof received.id === 'string' &&
      typeof received.clinic_code === 'string' &&
      typeof received.display_name === 'object' &&
      typeof received.is_active === 'boolean';
    
    return {
      message: () => `expected ${received} to be a valid clinic object`,
      pass,
    };
  },
  
  toBeValidUser(received: any) {
    const pass = received && 
      typeof received.id === 'string' &&
      typeof received.email === 'string' &&
      typeof received.role === 'string';
    
    return {
      message: () => `expected ${received} to be a valid user object`,
      pass,
    };
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidClinic(): R;
      toBeValidUser(): R;
    }
  }
}
