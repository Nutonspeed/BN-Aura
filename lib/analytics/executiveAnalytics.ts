/**
 * Executive Analytics - High-level KPI tracking and multi-clinic comparison
 */

interface ClinicPerformance {
  clinicId: string;
  clinicName: string;
  region: string;
  subscriptionTier: string;
  quotaMetrics: {
    totalQuota: number;
    usedQuota: number;
    utilizationRate: number;
    efficiency: number;
    costPerScan: number;
  };
  revenueMetrics: {
    monthlyRevenue: number;
    averageDealSize: number;
    customerAcquisitionCost: number;
    customerLifetimeValue: number;
  };
  operationalMetrics: {
    staffCount: number;
    customerCount: number;
    conversionRate: number;
    satisfactionScore: number;
  };
  growthMetrics: {
    monthOverMonthGrowth: number;
    customerGrowthRate: number;
    revenueGrowthRate: number;
    marketShare: number;
  };
}

interface ExecutiveKPIs {
  totalRevenue: number;
  totalCustomers: number;
  totalClinics: number;
  systemUtilization: number;
  averageMargin: number;
  customerSatisfaction: number;
  growthRate: number;
  churnRate: number;
  totalQuotaAllocated: number;
  totalQuotaUsed: number;
  systemEfficiency: number;
  costOptimization: number;
}

interface RegionalAnalysis {
  region: string;
  clinicCount: number;
  revenue: number;
  customers: number;
  growthRate: number;
  marketPenetration: number;
  competitorAnalysis: {
    marketShare: number;
    competitorCount: number;
    priceCompetitiveness: number;
  };
}

interface ExecutiveDashboard {
  kpis: ExecutiveKPIs;
  clinicPerformance: ClinicPerformance[];
  regionalAnalysis: RegionalAnalysis[];
  trends: {
    revenue: Array<{date: string; value: number}>;
    customers: Array<{date: string; value: number}>;
    efficiency: Array<{date: string; value: number}>;
  };
  alerts: {
    underperformingClinics: string[];
    growthOpportunities: string[];
    riskMitigation: string[];
  };
  forecasts: {
    nextQuarterRevenue: number;
    expectedGrowth: number;
    resourceNeeds: string[];
  };
}

class ExecutiveAnalytics {
  /**
   * Generate comprehensive executive dashboard
   */
  static async generateExecutiveDashboard(): Promise<ExecutiveDashboard> {
    const clinicPerformance = await this.generateClinicPerformance();
    const kpis = await this.calculateExecutiveKPIs(clinicPerformance);
    const regionalAnalysis = await this.generateRegionalAnalysis(clinicPerformance);
    const trends = await this.generateTrends();
    const alerts = await this.generateExecutiveAlerts(clinicPerformance);
    const forecasts = await this.generateForecasts(clinicPerformance, trends);

    return {
      kpis,
      clinicPerformance,
      regionalAnalysis,
      trends,
      alerts,
      forecasts
    };
  }

  /**
   * Generate clinic performance data
   */
  private static async generateClinicPerformance(): Promise<ClinicPerformance[]> {
    // Mock data representing realistic clinic performance
    const clinics = [
      {
        clinicId: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab',
        clinicName: 'คลินิกความงามสาธิต',
        region: 'Bangkok',
        subscriptionTier: 'Professional'
      },
      {
        clinicId: 'clinic-bangkok-central',
        clinicName: 'Bangkok Beauty Center',
        region: 'Bangkok',
        subscriptionTier: 'Enterprise'
      },
      {
        clinicId: 'clinic-chiang-mai',
        clinicName: 'Chiang Mai Aesthetic',
        region: 'North',
        subscriptionTier: 'Professional'
      },
      {
        clinicId: 'clinic-phuket-premium',
        clinicName: 'Phuket Premium Clinic',
        region: 'South',
        subscriptionTier: 'Enterprise'
      },
      {
        clinicId: 'clinic-pattaya-boutique',
        clinicName: 'Pattaya Boutique Clinic',
        region: 'East',
        subscriptionTier: 'Starter'
      }
    ];

    return clinics.map(clinic => ({
      ...clinic,
      quotaMetrics: {
        totalQuota: clinic.subscriptionTier === 'Enterprise' ? 500 : 
                    clinic.subscriptionTier === 'Professional' ? 200 : 100,
        usedQuota: Math.round(Math.random() * 150 + 50),
        utilizationRate: Math.round((Math.random() * 40 + 40)), // 40-80%
        efficiency: Math.round((Math.random() * 20 + 70)), // 70-90%
        costPerScan: clinic.subscriptionTier === 'Enterprise' ? 45 : 
                     clinic.subscriptionTier === 'Professional' ? 55 : 65
      },
      revenueMetrics: {
        monthlyRevenue: Math.round((Math.random() * 200000 + 100000)), // 100k-300k
        averageDealSize: Math.round((Math.random() * 3000 + 2000)), // 2k-5k
        customerAcquisitionCost: Math.round((Math.random() * 500 + 300)), // 300-800
        customerLifetimeValue: Math.round((Math.random() * 15000 + 10000)) // 10k-25k
      },
      operationalMetrics: {
        staffCount: clinic.subscriptionTier === 'Enterprise' ? 8 : 
                   clinic.subscriptionTier === 'Professional' ? 5 : 3,
        customerCount: Math.round((Math.random() * 200 + 100)), // 100-300
        conversionRate: Math.round((Math.random() * 30 + 60)), // 60-90%
        satisfactionScore: Math.round((Math.random() * 15 + 80)) // 80-95%
      },
      growthMetrics: {
        monthOverMonthGrowth: Math.round((Math.random() * 20 + 5)), // 5-25%
        customerGrowthRate: Math.round((Math.random() * 25 + 10)), // 10-35%
        revenueGrowthRate: Math.round((Math.random() * 30 + 15)), // 15-45%
        marketShare: Math.round((Math.random() * 10 + 5)) // 5-15%
      }
    }));
  }

  /**
   * Calculate executive-level KPIs
   */
  private static async calculateExecutiveKPIs(clinics: ClinicPerformance[]): Promise<ExecutiveKPIs> {
    const totalRevenue = clinics.reduce((sum, c) => sum + c.revenueMetrics.monthlyRevenue, 0);
    const totalCustomers = clinics.reduce((sum, c) => sum + c.operationalMetrics.customerCount, 0);
    const totalQuotaAllocated = clinics.reduce((sum, c) => sum + c.quotaMetrics.totalQuota, 0);
    const totalQuotaUsed = clinics.reduce((sum, c) => sum + c.quotaMetrics.usedQuota, 0);

    return {
      totalRevenue,
      totalCustomers,
      totalClinics: clinics.length,
      systemUtilization: Math.round((totalQuotaUsed / totalQuotaAllocated) * 100),
      averageMargin: Math.round(clinics.reduce((sum, c) => sum + (c.revenueMetrics.monthlyRevenue * 0.35), 0) / clinics.length),
      customerSatisfaction: Math.round(clinics.reduce((sum, c) => sum + c.operationalMetrics.satisfactionScore, 0) / clinics.length),
      growthRate: Math.round(clinics.reduce((sum, c) => sum + c.growthMetrics.revenueGrowthRate, 0) / clinics.length),
      churnRate: Math.round(Math.random() * 10 + 5), // 5-15%
      totalQuotaAllocated,
      totalQuotaUsed,
      systemEfficiency: Math.round(clinics.reduce((sum, c) => sum + c.quotaMetrics.efficiency, 0) / clinics.length),
      costOptimization: 14400 // From AI analytics
    };
  }

  /**
   * Generate regional analysis
   */
  private static async generateRegionalAnalysis(clinics: ClinicPerformance[]): Promise<RegionalAnalysis[]> {
    const regions = ['Bangkok', 'North', 'South', 'East'];
    
    return regions.map(region => {
      const regionalClinics = clinics.filter(c => c.region === region);
      const clinicCount = regionalClinics.length;
      const revenue = regionalClinics.reduce((sum, c) => sum + c.revenueMetrics.monthlyRevenue, 0);
      const customers = regionalClinics.reduce((sum, c) => sum + c.operationalMetrics.customerCount, 0);

      return {
        region,
        clinicCount,
        revenue,
        customers,
        growthRate: clinicCount > 0 ? 
          Math.round(regionalClinics.reduce((sum, c) => sum + c.growthMetrics.revenueGrowthRate, 0) / clinicCount) : 0,
        marketPenetration: Math.round(Math.random() * 20 + 10), // 10-30%
        competitorAnalysis: {
          marketShare: Math.round(Math.random() * 25 + 15), // 15-40%
          competitorCount: Math.round(Math.random() * 10 + 5), // 5-15
          priceCompetitiveness: Math.round(Math.random() * 30 + 70) // 70-100%
        }
      };
    });
  }

  /**
   * Generate trend data
   */
  private static async generateTrends() {
    const last12Months = Array.from({length: 12}, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (11 - i));
      return date;
    });

    return {
      revenue: last12Months.map(date => ({
        date: date.toISOString().split('T')[0],
        value: Math.round(Math.random() * 200000 + 800000) // 800k-1M
      })),
      customers: last12Months.map(date => ({
        date: date.toISOString().split('T')[0],
        value: Math.round(Math.random() * 200 + 1000) // 1000-1200
      })),
      efficiency: last12Months.map(date => ({
        date: date.toISOString().split('T')[0],
        value: Math.round(Math.random() * 15 + 80) // 80-95%
      }))
    };
  }

  /**
   * Generate executive alerts
   */
  private static async generateExecutiveAlerts(clinics: ClinicPerformance[]) {
    const underperformingClinics = clinics
      .filter(c => c.quotaMetrics.efficiency < 75 || c.growthMetrics.revenueGrowthRate < 10)
      .map(c => c.clinicName);

    const growthOpportunities = [];
    if (clinics.some(c => c.quotaMetrics.utilizationRate > 90)) {
      growthOpportunities.push('High quota utilization - consider plan upgrades');
    }
    if (clinics.some(c => c.operationalMetrics.satisfactionScore > 90)) {
      growthOpportunities.push('High satisfaction scores - expand marketing in successful regions');
    }

    const riskMitigation = [];
    if (clinics.some(c => c.growthMetrics.monthOverMonthGrowth < 5)) {
      riskMitigation.push('Low growth rates detected - review market strategy');
    }

    return {
      underperformingClinics,
      growthOpportunities,
      riskMitigation
    };
  }

  /**
   * Generate forecasts
   */
  private static async generateForecasts(clinics: ClinicPerformance[], trends: any) {
    const currentRevenue = trends.revenue[trends.revenue.length - 1].value;
    const revenueGrowthRate = clinics.reduce((sum, c) => sum + c.growthMetrics.revenueGrowthRate, 0) / clinics.length;

    return {
      nextQuarterRevenue: Math.round(currentRevenue * 3 * (1 + revenueGrowthRate / 100)),
      expectedGrowth: Math.round(revenueGrowthRate),
      resourceNeeds: [
        'Additional quota allocation for high-performing clinics',
        'Staff training for underperforming regions',
        'Technology infrastructure scaling'
      ]
    };
  }

  /**
   * Export executive reports
   */
  static async exportExecutiveReport(format: 'json' | 'csv' = 'json') {
    const dashboard = await this.generateExecutiveDashboard();
    
    if (format === 'csv') {
      // Convert to CSV format
      const csvData = dashboard.clinicPerformance.map(clinic => ({
        clinic_name: clinic.clinicName,
        region: clinic.region,
        revenue: clinic.revenueMetrics.monthlyRevenue,
        customers: clinic.operationalMetrics.customerCount,
        quota_utilization: clinic.quotaMetrics.utilizationRate,
        growth_rate: clinic.growthMetrics.revenueGrowthRate,
        satisfaction: clinic.operationalMetrics.satisfactionScore
      }));

      return {
        format: 'csv',
        data: csvData,
        summary: dashboard.kpis,
        exportTime: new Date().toISOString()
      };
    }

    return {
      format: 'json',
      data: dashboard,
      exportTime: new Date().toISOString()
    };
  }

  /**
   * Get clinic ranking by performance
   */
  static async getClinicRanking() {
    const clinics = await this.generateClinicPerformance();
    
    return clinics
      .map(clinic => ({
        clinicId: clinic.clinicId,
        clinicName: clinic.clinicName,
        region: clinic.region,
        performanceScore: Math.round(
          (clinic.quotaMetrics.efficiency * 0.3) +
          (clinic.operationalMetrics.satisfactionScore * 0.25) +
          (clinic.growthMetrics.revenueGrowthRate * 0.25) +
          (clinic.quotaMetrics.utilizationRate * 0.2)
        ),
        revenue: clinic.revenueMetrics.monthlyRevenue,
        growth: clinic.growthMetrics.revenueGrowthRate
      }))
      .sort((a, b) => b.performanceScore - a.performanceScore);
  }
}

export { ExecutiveAnalytics, type ExecutiveDashboard, type ClinicPerformance, type ExecutiveKPIs };
