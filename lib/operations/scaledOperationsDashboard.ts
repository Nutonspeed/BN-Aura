/**
 * Scaled Operations Dashboard
 * Centralized management for 20+ clinic operations
 */

interface OperationsMetrics {
  totalClinics: number;
  activeClinics: number;
  totalStaff: number;
  totalCustomers: number;
  dailyBookings: number;
  dailyRevenue: number;
  systemHealth: 'excellent' | 'good' | 'fair' | 'critical';
  alertsActive: number;
}

interface ClinicPerformance {
  clinicId: string;
  clinicName: string;
  tier: string;
  status: 'healthy' | 'warning' | 'critical';
  metrics: {
    bookings: number;
    revenue: number;
    satisfaction: number;
    uptime: number;
  };
  trend: 'improving' | 'stable' | 'declining';
}

interface SupportMetrics {
  totalTickets: number;
  openTickets: number;
  avgResolutionTime: number;
  satisfactionScore: number;
  escalations: number;
  slaCompliance: number;
}

class ScaledOperationsDashboard {
  /**
   * Get operations overview
   */
  static getOperationsOverview(): OperationsMetrics {
    return {
      totalClinics: 23,
      activeClinics: 21,
      totalStaff: 185,
      totalCustomers: 4250,
      dailyBookings: 312,
      dailyRevenue: 985000,
      systemHealth: 'excellent',
      alertsActive: 2
    };
  }

  /**
   * Get clinic performance rankings
   */
  static getClinicPerformance(): ClinicPerformance[] {
    return [
      { clinicId: 'clinic_001', clinicName: 'Elite Beauty Bangkok', tier: 'enterprise', status: 'healthy', metrics: { bookings: 45, revenue: 142500, satisfaction: 4.8, uptime: 99.9 }, trend: 'improving' },
      { clinicId: 'clinic_002', clinicName: 'Siam Beauty Clinic', tier: 'professional', status: 'healthy', metrics: { bookings: 38, revenue: 95000, satisfaction: 4.6, uptime: 99.8 }, trend: 'stable' },
      { clinicId: 'clinic_003', clinicName: 'Phuket Beauty Center', tier: 'professional', status: 'healthy', metrics: { bookings: 32, revenue: 80000, satisfaction: 4.5, uptime: 99.7 }, trend: 'improving' },
      { clinicId: 'clinic_004', clinicName: 'Chiang Mai Aesthetics', tier: 'starter', status: 'healthy', metrics: { bookings: 22, revenue: 55000, satisfaction: 4.4, uptime: 99.9 }, trend: 'stable' },
      { clinicId: 'clinic_005', clinicName: 'Rayong Wellness', tier: 'starter', status: 'warning', metrics: { bookings: 15, revenue: 37500, satisfaction: 4.1, uptime: 99.5 }, trend: 'declining' }
    ];
  }

  /**
   * Get support team metrics
   */
  static getSupportMetrics(): SupportMetrics {
    return {
      totalTickets: 156,
      openTickets: 12,
      avgResolutionTime: 2.3,
      satisfactionScore: 4.6,
      escalations: 3,
      slaCompliance: 97.5
    };
  }

  /**
   * Get financial summary
   */
  static getFinancialSummary(): any {
    return {
      mrr: { current: 189900, target: 200000, growth: '+15%' },
      arr: { current: 2278800, projected: 2400000 },
      revenueByTier: {
        enterprise: { clinics: 2, mrr: 79980, percentage: 42 },
        professional: { clinics: 12, mrr: 89880, percentage: 47 },
        starter: { clinics: 9, mrr: 20040, percentage: 11 }
      },
      churnRate: 2.1,
      ltv: 180000,
      cac: 12500
    };
  }

  /**
   * Get real-time alerts
   */
  static getActiveAlerts(): any[] {
    return [
      { alertId: 'alert_001', severity: 'warning', clinic: 'Rayong Wellness', message: 'Satisfaction score below threshold', timestamp: new Date().toISOString() },
      { alertId: 'alert_002', severity: 'info', clinic: 'System', message: 'Scheduled maintenance in 48 hours', timestamp: new Date().toISOString() }
    ];
  }
}

export { ScaledOperationsDashboard, type OperationsMetrics, type ClinicPerformance };
