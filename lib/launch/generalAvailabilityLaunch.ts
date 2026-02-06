/**
 * General Availability Launch System
 * Phase 3: Full nationwide launch targeting 100+ clinics
 */

interface GALaunchConfig {
  launchId: string;
  launchDate: string;
  targetClinics: number;
  duration: number;
  regions: RegionTarget[];
  pricingTiers: TierConfig[];
  marketingBudget: number;
  salesTeamSize: number;
  supportCapacity: number;
}

interface RegionTarget {
  regionId: string;
  regionName: string;
  targetClinics: number;
  currentClinics: number;
  marketSize: number;
  priority: 'high' | 'medium' | 'low';
  salesRep: string;
}

interface TierConfig {
  tierId: string;
  tierName: string;
  monthlyPrice: number;
  targetPercentage: number;
  features: string[];
}

interface GAMetrics {
  totalTarget: number;
  totalAcquired: number;
  conversionRate: number;
  mrr: number;
  arr: number;
  marketPenetration: number;
  customerSatisfaction: number;
  churnRate: number;
}

class GeneralAvailabilityLaunch {
  /**
   * Initialize GA launch configuration
   */
  static initializeGALaunch(): GALaunchConfig {
    return {
      launchId: 'ga_launch_2025',
      launchDate: '2025-04-15',
      targetClinics: 100,
      duration: 90,
      regions: [
        { regionId: 'bkk', regionName: 'Bangkok Metropolitan', targetClinics: 40, currentClinics: 15, marketSize: 200, priority: 'high', salesRep: 'Team Bangkok' },
        { regionId: 'central', regionName: 'Central Thailand', targetClinics: 20, currentClinics: 3, marketSize: 80, priority: 'high', salesRep: 'Team Central' },
        { regionId: 'south', regionName: 'Southern Thailand', targetClinics: 15, currentClinics: 3, marketSize: 60, priority: 'medium', salesRep: 'Team South' },
        { regionId: 'north', regionName: 'Northern Thailand', targetClinics: 15, currentClinics: 2, marketSize: 50, priority: 'medium', salesRep: 'Team North' },
        { regionId: 'east', regionName: 'Eastern Thailand', targetClinics: 10, currentClinics: 0, marketSize: 40, priority: 'low', salesRep: 'Team East' }
      ],
      pricingTiers: [
        { tierId: 'starter', tierName: 'Starter', monthlyPrice: 2990, targetPercentage: 35, features: ['Basic AI', 'Customer Management', 'Reports'] },
        { tierId: 'professional', tierName: 'Professional', monthlyPrice: 9990, targetPercentage: 50, features: ['Full AI', 'Mobile App', 'Analytics', 'Multi-staff'] },
        { tierId: 'enterprise', tierName: 'Enterprise', monthlyPrice: 39990, targetPercentage: 15, features: ['Full Suite', 'Multi-location', 'Custom Integration', 'Dedicated Support'] }
      ],
      marketingBudget: 5000000,
      salesTeamSize: 15,
      supportCapacity: 20
    };
  }

  /**
   * Get GA launch metrics
   */
  static getGAMetrics(): GAMetrics {
    return {
      totalTarget: 100,
      totalAcquired: 23,
      conversionRate: 42,
      mrr: 189900,
      arr: 2278800,
      marketPenetration: 4.6,
      customerSatisfaction: 4.5,
      churnRate: 2.1
    };
  }

  /**
   * Get regional performance
   */
  static getRegionalPerformance(): any {
    return {
      regions: [
        { region: 'Bangkok', target: 40, current: 15, pipeline: 28, conversion: 53, revenue: 125000 },
        { region: 'Central', target: 20, current: 3, pipeline: 12, conversion: 25, revenue: 25000 },
        { region: 'South', target: 15, current: 3, pipeline: 8, conversion: 38, revenue: 22000 },
        { region: 'North', target: 15, current: 2, pipeline: 6, conversion: 33, revenue: 15000 },
        { region: 'East', target: 10, current: 0, pipeline: 4, conversion: 0, revenue: 0 }
      ],
      topPerforming: 'Bangkok Metropolitan',
      needsAttention: 'Eastern Thailand',
      nationalCoverage: '23%'
    };
  }

  /**
   * Get growth projections
   */
  static getGrowthProjections(): any {
    return {
      monthly: [
        { month: 'Apr 2025', clinics: 35, mrr: 280000, milestone: 'GA Launch' },
        { month: 'May 2025', clinics: 55, mrr: 450000, milestone: '50 Clinics' },
        { month: 'Jun 2025', clinics: 80, mrr: 680000, milestone: 'Scale Phase' },
        { month: 'Jul 2025', clinics: 100, mrr: 850000, milestone: '100 Clinics Target' },
        { month: 'Aug 2025', clinics: 125, mrr: 1100000, milestone: 'Expansion Phase' },
        { month: 'Dec 2025', clinics: 200, mrr: 1800000, milestone: 'Year-End Target' }
      ],
      yearEndTargets: {
        clinics: 200,
        mrr: 1800000,
        arr: 21600000,
        marketPenetration: 40,
        employees: 50
      }
    };
  }
}

export { GeneralAvailabilityLaunch, type GALaunchConfig, type GAMetrics };
