/**
 * Burn Rate Analytics - Predicts quota depletion dates for budget planning
 */

interface BurnRateData {
  clinicId: string;
  clinicName: string;
  currentUsage: number;
  monthlyQuota: number;
  dailyBurnRate: number;
  predictedDepletionDate: string | null;
  daysUntilDepletion: number | null;
  utilizationRate: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface BurnRateForecast {
  totalClinics: number;
  averageBurnRate: number;
  clinicsAtRisk: number;
  projectedBudgetNeeds: number;
  clinics: BurnRateData[];
}

class BurnRateAnalytics {
  /**
   * Generate burn rate forecast for all clinics
   */
  static async generateSystemForecast(): Promise<BurnRateForecast> {
    const clinicsData = [
      {
        id: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab',
        name: 'คลินิกความงามสาธิต',
        currentUsage: 95,
        monthlyQuota: 200,
        dailyUsage: [3, 4, 2, 5, 3, 4, 6] // Last 7 days
      },
      {
        id: 'clinic-bangkok-central',
        name: 'Bangkok Beauty Center',
        currentUsage: 185,
        monthlyQuota: 200,
        dailyUsage: [8, 9, 7, 10, 8, 9, 11]
      },
      {
        id: 'clinic-chiang-mai',
        name: 'Chiang Mai Aesthetic',
        currentUsage: 45,
        monthlyQuota: 100,
        dailyUsage: [2, 3, 1, 2, 3, 2, 3]
      }
    ];
    
    const burnRateData = clinicsData.map(clinic => {
      const dailyBurnRate = clinic.dailyUsage.reduce((a, b) => a + b, 0) / clinic.dailyUsage.length;
      const utilizationRate = (clinic.currentUsage / clinic.monthlyQuota) * 100;
      const remainingQuota = clinic.monthlyQuota - clinic.currentUsage;
      const daysUntilDepletion = dailyBurnRate > 0 ? Math.ceil(remainingQuota / dailyBurnRate) : null;
      
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (utilizationRate >= 95) riskLevel = 'critical';
      else if (utilizationRate >= 80) riskLevel = 'high';
      else if (utilizationRate >= 60) riskLevel = 'medium';

      const predictedDepletionDate = daysUntilDepletion 
        ? new Date(Date.now() + (daysUntilDepletion * 24 * 60 * 60 * 1000)).toISOString()
        : null;

      return {
        clinicId: clinic.id,
        clinicName: clinic.name,
        currentUsage: clinic.currentUsage,
        monthlyQuota: clinic.monthlyQuota,
        dailyBurnRate: Math.round(dailyBurnRate * 10) / 10,
        predictedDepletionDate,
        daysUntilDepletion,
        utilizationRate: Math.round(utilizationRate * 10) / 10,
        riskLevel
      };
    });

    const clinicsAtRisk = burnRateData.filter(c => c.riskLevel === 'high' || c.riskLevel === 'critical').length;
    const averageBurnRate = burnRateData.reduce((sum, c) => sum + c.dailyBurnRate, 0) / burnRateData.length;
    const projectedBudgetNeeds = burnRateData.reduce((sum, c) => {
      const projectedOverage = Math.max(0, c.currentUsage + (c.dailyBurnRate * 30) - c.monthlyQuota);
      return sum + (projectedOverage * 60); // ฿60 per overage scan
    }, 0);

    return {
      totalClinics: burnRateData.length,
      averageBurnRate: Math.round(averageBurnRate * 10) / 10,
      clinicsAtRisk,
      projectedBudgetNeeds: Math.round(projectedBudgetNeeds),
      clinics: burnRateData.sort((a, b) => b.utilizationRate - a.utilizationRate)
    };
  }

  /**
   * Get critical clinics requiring immediate attention
   */
  static async getCriticalClinics(): Promise<BurnRateData[]> {
    const forecast = await this.generateSystemForecast();
    return forecast.clinics.filter(clinic => 
      clinic.riskLevel === 'critical' || 
      (clinic.daysUntilDepletion !== null && clinic.daysUntilDepletion <= 7)
    );
  }

  /**
   * Export chart data for dashboard
   */
  static async exportChartData() {
    const forecast = await this.generateSystemForecast();
    
    return {
      burnRateChart: forecast.clinics.map(clinic => ({
        name: clinic.clinicName.substring(0, 15),
        burnRate: clinic.dailyBurnRate,
        utilization: clinic.utilizationRate,
        risk: clinic.riskLevel
      })),
      summary: {
        totalClinics: forecast.totalClinics,
        averageBurnRate: forecast.averageBurnRate,
        clinicsAtRisk: forecast.clinicsAtRisk,
        projectedBudget: forecast.projectedBudgetNeeds
      }
    };
  }
}

export { BurnRateAnalytics, type BurnRateData, type BurnRateForecast };
