// Centralized route definitions for type-safe navigation

export const ADMIN_ROUTES = {
  DASHBOARD: '/admin',
  SECURITY: '/admin/security',
  USERS: '/admin/users',
  ANALYTICS: '/admin/analytics',
  BILLING: '/admin/billing',
  SYSTEM: '/admin/system',
  AUDIT: '/admin/audit',
  PERMISSIONS: '/admin/permissions',
  SUPPORT: '/admin/support',
  SETTINGS: '/admin/settings',
  BROADCAST: '/admin/broadcast',
  ANNOUNCEMENTS: '/admin/announcements',
} as const;

export const API_ROUTES = {
  // Admin APIs
  ADMIN: {
    MANAGEMENT: '/api/admin/management',
    ANALYTICS: '/api/admin/analytics',
    BILLING: '/api/admin/billing',
    SECURITY: '/api/admin/security',
    SUPPORT: '/api/admin/support/tickets',
    ANNOUNCEMENTS: '/api/admin/announcements',
    BROADCAST: '/api/admin/broadcast',
    API_KEYS: '/api/admin/api-keys',
  },
  // User APIs
  NOTIFICATIONS: '/api/notifications',
  PROFILE: '/api/profile',
} as const;

export type AdminRoute = typeof ADMIN_ROUTES[keyof typeof ADMIN_ROUTES];
export type ApiRoute = string;
