/**
 * Standard API Contracts and Response Types
 * Ensures consistent API responses across all endpoints
 */

// Standard API Response Interface
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
    version?: string;
    [key: string]: unknown; // Allow additional meta properties
  };
}

// Error Codes Enum
export enum APIErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELDS = 'MISSING_REQUIRED_FIELDS',
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // Business Logic
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',
  
  // External Services
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  EMAIL_SEND_FAILED = 'EMAIL_SEND_FAILED',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Server Errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

// Pagination Parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Standard Validation Schema Types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: unknown;
}

// Common Request Headers
export interface StandardHeaders {
  'user-agent'?: string;
  'x-clinic-id'?: string;
  'x-request-id'?: string;
  authorization?: string;
}

// Commission API Contracts
export interface CommissionCreateRequest {
  salesId: string;
  customerId: string;
  treatmentName: string;
  amount: number;
  commissionRate: number;
  clinicId: string;
}

export interface CommissionResponse {
  id: string;
  salesStaffId: string;
  customerId: string;
  transactionType: string;
  baseAmount: number;
  commissionRate: number;
  commissionAmount: number;
  paymentStatus: 'pending' | 'paid' | 'cancelled';
  createdAt: string;
}

// Staff Invitation API Contracts
export interface StaffInvitationRequest {
  email: string;
  fullName: string;
  role: 'clinic_admin' | 'clinic_staff' | 'sales_staff';
}

export interface StaffInvitationResponse {
  id: string;
  email: string;
  role: string;
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: string;
  invitedBy: string;
  createdAt: string;
}

// Chat API Contracts
export interface ChatMessageRequest {
  customerId: string;
  salesId: string;
  senderType: 'customer' | 'sales';
  messageText: string;
  messageType?: 'text' | 'image' | 'treatment_recommendation';
  contextData?: unknown;
}

export interface ChatMessageResponse {
  id: string;
  customerId: string;
  salesStaffId: string;
  senderType: 'customer' | 'sales';
  messageText: string;
  messageType: string;
  isRead: boolean;
  createdAt: string;
  attachmentUrl?: string;
}

// Analytics API Contracts
export interface AnalyticsRequest {
  clinicId: string;
  type: 'revenue' | 'staff' | 'predictive';
  period?: 'daily' | 'weekly' | 'monthly';
  startDate?: string;
  endDate?: string;
}

export interface RevenueData {
  name: string;
  revenue: number;
  date: string;
}

export interface StaffMetric {
  id: string;
  name: string;
  role: string;
  totalSales: number;
  totalCommission: number;
  dealCount: number;
}

export interface AnalyticsResponse {
  revenue?: RevenueData[];
  staff?: StaffMetric[];
  predictive?: unknown;
  summary?: {
    totalRevenue: number;
    totalCommissions: number;
    activeStaff: number;
    totalCustomers: number;
  };
}

// Quota API Contracts
export interface QuotaCheckRequest {
  clinicId: string;
  quotaType: 'ai_scans' | 'users' | 'storage_gb' | 'proposals';
  requiredAmount?: number;
}

export interface QuotaResponse {
  quotaType: string;
  quotaLimit: number;
  quotaUsed: number;
  quotaRemaining: number;
  resetPeriod: string;
  lastResetDate: string;
  canUse: boolean;
}
