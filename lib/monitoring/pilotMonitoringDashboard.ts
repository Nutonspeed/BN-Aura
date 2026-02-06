/**
 * Pilot Monitoring Dashboard System
 * Real-time monitoring for pilot clinic operations
 */

interface ClinicMetrics {
  clinicId: string;
  clinicName: string;
  timestamp: string;
  operational: {
    dailyBookings: number;
    activeCustomers: number;
    aiConsultations: number;
    treatmentsCompleted: number;
    revenue: number;
  };
  performance: {
    systemResponseTime: number;
    appLoadTime: number;
    errorRate: number;
    uptime: number;
  };
  engagement: {
    staffActiveUsers: number;
    customerAppUsage: number;
    featureAdoption: number;
    trainingCompletion: number;
  };
  satisfaction: {
    ownerRating: number;
    staffRating: number;
    customerRating: number;
    nps: number;
  };
}

interface AlertConfig {
  alertId: string;
  type: 'critical' | 'warning' | 'info';
  metric: string;
  threshold: number;
  condition: 'above' | 'below';
  message: string;
  actions: string[];
}

interface DashboardWidget {
  widgetId: string;
  title: string;
  type: 'metric' | 'chart' | 'table' | 'alert';
  data: any;
  refreshInterval: number;
}

class PilotMonitoringDashboard {
  private static clinicMetrics: Map<string, ClinicMetrics> = new Map();
  private static alerts: AlertConfig[] = [];
  private static activeAlerts: any[] = [];

  /**
   * Initialize monitoring for pilot clinics
   */
  static initializeMonitoring(): any {
    const clinics = ['pilot_bangkok_001', 'pilot_phuket_001', 'pilot_chiangmai_001'];
    
    clinics.forEach(clinicId => {
      this.clinicMetrics.set(clinicId, this.generateMockMetrics(clinicId));
    });

    this.setupAlerts();
    
    return {
      monitoringActive: true,
      clinicsMonitored: clinics.length,
      metricsTracked: 16,
      alertsConfigured: this.alerts.length,
      refreshInterval: '30 seconds'
    };
  }

  /**
   * Get real-time dashboard data
   */
  static getDashboardData(): any {
    const allMetrics = Array.from(this.clinicMetrics.values());
    
    return {
      summary: {
        totalClinics: allMetrics.length,
        totalBookingsToday: allMetrics.reduce((sum, m) => sum + m.operational.dailyBookings, 0),
        totalRevenue: allMetrics.reduce((sum, m) => sum + m.operational.revenue, 0),
        avgSatisfaction: Math.round((allMetrics.reduce((sum, m) => sum + m.satisfaction.customerRating, 0) / allMetrics.length) * 10) / 10,
        systemHealth: this.calculateSystemHealth(allMetrics),
        activeAlerts: this.activeAlerts.length
      },
      clinics: allMetrics.map(m => ({
        clinicId: m.clinicId,
        clinicName: m.clinicName,
        status: this.getClinicStatus(m),
        bookings: m.operational.dailyBookings,
        revenue: m.operational.revenue,
        satisfaction: m.satisfaction.customerRating,
        uptime: m.performance.uptime
      })),
      trends: {
        bookingsTrend: '+15%',
        revenueTrend: '+22%',
        satisfactionTrend: '+0.3',
        adoptionTrend: '+8%'
      },
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Get detailed metrics for a specific clinic
   */
  static getClinicDetailedMetrics(clinicId: string): ClinicMetrics | null {
    return this.clinicMetrics.get(clinicId) || null;
  }

  /**
   * Get active alerts
   */
  static getActiveAlerts(): any[] {
    return this.activeAlerts;
  }

  /**
   * Update clinic metrics (simulating real-time data)
   */
  static updateMetrics(clinicId: string, newMetrics: Partial<ClinicMetrics>): ClinicMetrics {
    const current = this.clinicMetrics.get(clinicId)!;
    const updated = { ...current, ...newMetrics, timestamp: new Date().toISOString() };
    this.clinicMetrics.set(clinicId, updated);
    this.checkAlerts(updated);
    return updated;
  }

  // Helper methods
  private static generateMockMetrics(clinicId: string): ClinicMetrics {
    const clinicNames: { [key: string]: string } = {
      'pilot_bangkok_001': 'Elite Beauty Bangkok',
      'pilot_phuket_001': 'Phuket Beauty Center',
      'pilot_chiangmai_001': 'Northern Aesthetics'
    };

    const baseMultiplier = clinicId.includes('bangkok') ? 1.5 : clinicId.includes('phuket') ? 1.0 : 0.7;

    return {
      clinicId,
      clinicName: clinicNames[clinicId] || clinicId,
      timestamp: new Date().toISOString(),
      operational: {
        dailyBookings: Math.round(25 * baseMultiplier),
        activeCustomers: Math.round(180 * baseMultiplier),
        aiConsultations: Math.round(15 * baseMultiplier),
        treatmentsCompleted: Math.round(20 * baseMultiplier),
        revenue: Math.round(85000 * baseMultiplier)
      },
      performance: {
        systemResponseTime: 120 + Math.random() * 50,
        appLoadTime: 1.8 + Math.random() * 0.5,
        errorRate: 0.1 + Math.random() * 0.2,
        uptime: 99.5 + Math.random() * 0.4
      },
      engagement: {
        staffActiveUsers: Math.round(8 * baseMultiplier),
        customerAppUsage: 65 + Math.round(Math.random() * 20),
        featureAdoption: 70 + Math.round(Math.random() * 20),
        trainingCompletion: 85 + Math.round(Math.random() * 15)
      },
      satisfaction: {
        ownerRating: 4.3 + Math.random() * 0.5,
        staffRating: 4.1 + Math.random() * 0.5,
        customerRating: 4.4 + Math.random() * 0.4,
        nps: 45 + Math.round(Math.random() * 20)
      }
    };
  }

  private static setupAlerts(): void {
    this.alerts = [
      { alertId: 'alert_uptime', type: 'critical', metric: 'uptime', threshold: 99, condition: 'below', message: 'System uptime below 99%', actions: ['Notify engineering', 'Check infrastructure'] },
      { alertId: 'alert_error', type: 'warning', metric: 'errorRate', threshold: 1, condition: 'above', message: 'Error rate above 1%', actions: ['Review error logs', 'Investigate cause'] },
      { alertId: 'alert_satisfaction', type: 'warning', metric: 'customerRating', threshold: 4.0, condition: 'below', message: 'Customer satisfaction below 4.0', actions: ['Review feedback', 'Contact clinic owner'] }
    ];
  }

  private static checkAlerts(metrics: ClinicMetrics): void {
    // Simplified alert checking
    if (metrics.performance.uptime < 99) {
      this.activeAlerts.push({ clinic: metrics.clinicName, type: 'critical', message: 'Uptime below threshold' });
    }
  }

  private static calculateSystemHealth(metrics: ClinicMetrics[]): string {
    const avgUptime = metrics.reduce((sum, m) => sum + m.performance.uptime, 0) / metrics.length;
    if (avgUptime >= 99.5) return 'Excellent';
    if (avgUptime >= 99) return 'Good';
    if (avgUptime >= 98) return 'Fair';
    return 'Poor';
  }

  private static getClinicStatus(metrics: ClinicMetrics): string {
    if (metrics.performance.uptime >= 99.5 && metrics.satisfaction.customerRating >= 4.0) return 'Healthy';
    if (metrics.performance.uptime >= 99) return 'Good';
    return 'Needs Attention';
  }
}

export { PilotMonitoringDashboard, type ClinicMetrics, type DashboardWidget };
