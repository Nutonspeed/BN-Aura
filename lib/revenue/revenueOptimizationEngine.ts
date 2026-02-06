/**
 * Revenue Optimization & Upselling Engine
 * Maximize revenue through intelligent upselling and expansion
 */

interface RevenueMetrics {
  mrr: number;
  arr: number;
  arpu: number;
  expansionMRR: number;
  churnMRR: number;
  netMRR: number;
  growthRate: number;
}

interface UpsellOpportunity {
  clinicId: string;
  clinicName: string;
  currentTier: string;
  recommendedTier: string;
  potentialMRR: number;
  likelihood: number;
  triggers: string[];
  nextAction: string;
}

interface ExpansionMetrics {
  totalOpportunities: number;
  qualifiedLeads: number;
  pipelineValue: number;
  conversionRate: number;
  avgDealSize: number;
}

class RevenueOptimizationEngine {
  /**
   * Get revenue metrics
   */
  static getRevenueMetrics(): RevenueMetrics {
    return {
      mrr: 850000,
      arr: 10200000,
      arpu: 8500,
      expansionMRR: 45000,
      churnMRR: 18000,
      netMRR: 27000,
      growthRate: 3.2
    };
  }

  /**
   * Get upsell opportunities
   */
  static getUpsellOpportunities(): UpsellOpportunity[] {
    return [
      { clinicId: 'clinic_015', clinicName: 'Premium Beauty Center', currentTier: 'Professional', recommendedTier: 'Enterprise', potentialMRR: 30000, likelihood: 85, triggers: ['High usage', 'Multi-location interest', 'API requests'], nextAction: 'Schedule enterprise demo' },
      { clinicId: 'clinic_023', clinicName: 'Skin Care Plus', currentTier: 'Starter', recommendedTier: 'Professional', potentialMRR: 7000, likelihood: 72, triggers: ['Feature limit reached', 'Growing bookings'], nextAction: 'Feature comparison call' },
      { clinicId: 'clinic_045', clinicName: 'Beauty Hub Bangkok', currentTier: 'Professional', recommendedTier: 'Enterprise', potentialMRR: 30000, likelihood: 68, triggers: ['New branch opening', 'API integration requests'], nextAction: 'Multi-location proposal' },
      { clinicId: 'clinic_067', clinicName: 'Wellness Center Chiang Mai', currentTier: 'Starter', recommendedTier: 'Professional', potentialMRR: 7000, likelihood: 65, triggers: ['Staff growth', 'Analytics requests'], nextAction: 'ROI presentation' },
      { clinicId: 'clinic_089', clinicName: 'Aesthetic Clinic Pattaya', currentTier: 'Starter', recommendedTier: 'Professional', potentialMRR: 7000, likelihood: 60, triggers: ['Mobile app requests', 'Multi-staff need'], nextAction: 'Trial upgrade offer' }
    ];
  }

  /**
   * Get expansion metrics
   */
  static getExpansionMetrics(): ExpansionMetrics {
    return {
      totalOpportunities: 35,
      qualifiedLeads: 18,
      pipelineValue: 425000,
      conversionRate: 35,
      avgDealSize: 12500
    };
  }

  /**
   * Get tier distribution analysis
   */
  static getTierAnalysis(): any {
    return {
      distribution: [
        { tier: 'Starter', count: 35, percentage: 35, avgMRR: 2990, totalMRR: 104650 },
        { tier: 'Professional', count: 50, percentage: 50, avgMRR: 9990, totalMRR: 499500 },
        { tier: 'Enterprise', count: 15, percentage: 15, avgMRR: 39990, totalMRR: 599850 }
      ],
      upgradePotential: {
        starterToPro: { count: 12, potentialMRR: 84000 },
        proToEnterprise: { count: 8, potentialMRR: 240000 }
      },
      targetMix: { starter: 25, professional: 55, enterprise: 20 }
    };
  }

  /**
   * Get revenue forecast
   */
  static getRevenueForecast(): any {
    return {
      current: { mrr: 850000, arr: 10200000 },
      forecast: [
        { month: 'Mar 2025', mrr: 900000, growth: '+5.9%' },
        { month: 'Apr 2025', mrr: 980000, growth: '+8.9%' },
        { month: 'May 2025', mrr: 1100000, growth: '+12.2%' },
        { month: 'Jun 2025', mrr: 1250000, growth: '+13.6%' },
        { month: 'Dec 2025', mrr: 1800000, growth: '+44%' }
      ],
      yearEndTarget: { mrr: 1800000, arr: 21600000, confidence: 82 }
    };
  }
}

export { RevenueOptimizationEngine, type RevenueMetrics, type UpsellOpportunity };
