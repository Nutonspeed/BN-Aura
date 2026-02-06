/**
 * Customer Success & Retention System
 * Proactive customer health monitoring and churn prevention
 */

interface CustomerHealth {
  clinicId: string;
  clinicName: string;
  healthScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  usageMetrics: UsageMetrics;
  engagementScore: number;
  satisfactionScore: number;
  paymentHealth: 'current' | 'late' | 'at_risk';
  lastActivity: string;
  daysSinceLastLogin: number;
}

interface UsageMetrics {
  dailyActiveUsers: number;
  monthlyBookings: number;
  featureAdoption: number;
  apiCalls: number;
  supportTickets: number;
}

interface ChurnRisk {
  clinicId: string;
  riskScore: number;
  riskFactors: string[];
  recommendedActions: string[];
  assignedCSM: string;
  nextCheckIn: string;
}

interface RetentionMetrics {
  totalClinics: number;
  healthyCount: number;
  atRiskCount: number;
  churnedThisMonth: number;
  retentionRate: number;
  nps: number;
  avgHealthScore: number;
}

class CustomerSuccessSystem {
  /**
   * Get overall retention metrics
   */
  static getRetentionMetrics(): RetentionMetrics {
    return {
      totalClinics: 100,
      healthyCount: 85,
      atRiskCount: 12,
      churnedThisMonth: 2,
      retentionRate: 97.9,
      nps: 58,
      avgHealthScore: 82
    };
  }

  /**
   * Get customer health dashboard
   */
  static getHealthDashboard(): any {
    return {
      distribution: {
        excellent: { count: 45, percentage: 45 },
        good: { count: 40, percentage: 40 },
        needsAttention: { count: 12, percentage: 12 },
        critical: { count: 3, percentage: 3 }
      },
      topPerformers: [
        { clinicId: 'elite_beauty', name: 'Elite Beauty Bangkok', score: 98 },
        { clinicId: 'phuket_beauty', name: 'Phuket Beauty Center', score: 96 },
        { clinicId: 'northern_aesthetics', name: 'Northern Aesthetics', score: 95 }
      ],
      atRiskClinics: [
        { clinicId: 'clinic_078', name: 'Beauty Clinic 78', score: 45, risk: 'Low usage' },
        { clinicId: 'clinic_089', name: 'Beauty Clinic 89', score: 38, risk: 'Payment issues' },
        { clinicId: 'clinic_092', name: 'Beauty Clinic 92', score: 32, risk: 'No login 14 days' }
      ]
    };
  }

  /**
   * Get churn prevention actions
   */
  static getChurnPreventionActions(): any[] {
    return [
      { clinicId: 'clinic_078', action: 'Schedule training refresher', priority: 'high', dueDate: '2025-02-10', csm: 'Somchai T.' },
      { clinicId: 'clinic_089', action: 'Payment plan discussion', priority: 'critical', dueDate: '2025-02-08', csm: 'Nattaya P.' },
      { clinicId: 'clinic_092', action: 'Re-engagement call', priority: 'high', dueDate: '2025-02-07', csm: 'Prasert K.' }
    ];
  }

  /**
   * Get success playbooks
   */
  static getSuccessPlaybooks(): any {
    return {
      onboarding: { name: 'New Customer Onboarding', steps: 12, avgDays: 5, successRate: 96 },
      adoption: { name: 'Feature Adoption Program', steps: 8, avgDays: 30, successRate: 78 },
      expansion: { name: 'Upsell & Expansion', steps: 6, avgDays: 45, successRate: 35 },
      rescue: { name: 'At-Risk Recovery', steps: 5, avgDays: 14, successRate: 68 }
    };
  }

  /**
   * Get CSM team performance
   */
  static getCSMPerformance(): any {
    return {
      team: [
        { name: 'Somchai T.', accounts: 25, healthAvg: 85, nps: 62, renewalRate: 98 },
        { name: 'Nattaya P.', accounts: 25, healthAvg: 82, nps: 58, renewalRate: 96 },
        { name: 'Prasert K.', accounts: 25, healthAvg: 80, nps: 55, renewalRate: 95 },
        { name: 'Waraporn S.', accounts: 25, healthAvg: 81, nps: 57, renewalRate: 97 }
      ],
      teamAverage: { healthAvg: 82, nps: 58, renewalRate: 96.5 }
    };
  }
}

export { CustomerSuccessSystem, type CustomerHealth, type RetentionMetrics };
