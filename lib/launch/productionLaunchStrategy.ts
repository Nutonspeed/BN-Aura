/**
 * Production Launch Strategy System
 */

interface PilotClinic {
  clinicId: string;
  clinicName: string;
  location: string;
  size: string;
  staffCount: number;
  techReadiness: number;
  selectionReason: string[];
}

interface LaunchPhase {
  phaseId: string;
  phaseName: string;
  duration: number;
  targetClinics: number;
  objectives: string[];
  successMetrics: SuccessMetric[];
}

interface SuccessMetric {
  name: string;
  target: number;
  unit: string;
  priority: string;
}

interface GoToMarketStrategy {
  pricingTiers: PricingTier[];
  marketingChannels: string[];
  salesTargets: { monthly: number; quarterly: number };
}

interface PricingTier {
  tierName: string;
  monthlyPrice: number;
  features: string[];
  targetSegment: string;
}

class ProductionLaunchStrategy {
  private static pilotClinics: Map<string, PilotClinic> = new Map();
  private static launchPhases: Map<string, LaunchPhase> = new Map();

  static selectPilotClinics(): PilotClinic[] {
    const pilots = [
      {
        clinicId: 'pilot_bangkok_premium',
        clinicName: 'Elite Beauty Bangkok',
        location: 'Bangkok, Sukhumvit',
        size: 'large',
        staffCount: 12,
        techReadiness: 5,
        selectionReason: ['High tech readiness', 'Large customer base', 'Industry influence']
      },
      {
        clinicId: 'pilot_phuket_mid',
        clinicName: 'Phuket Beauty Center',
        location: 'Phuket, Patong',
        size: 'medium',
        staffCount: 6,
        techReadiness: 4,
        selectionReason: ['Tourism focus', 'International customers', 'Seasonal patterns']
      },
      {
        clinicId: 'pilot_chiangmai_small',
        clinicName: 'Northern Aesthetics',
        location: 'Chiang Mai, Nimman',
        size: 'small',
        staffCount: 4,
        techReadiness: 3,
        selectionReason: ['Typical small clinic', 'Lower tech readiness', 'Budget conscious']
      }
    ];

    pilots.forEach(pilot => {
      this.pilotClinics.set(pilot.clinicId, pilot);
    });

    return pilots;
  }

  static definePhasedRollout(): LaunchPhase[] {
    const phases = [
      {
        phaseId: 'phase_1_pilot',
        phaseName: 'Pilot Launch',
        duration: 30,
        targetClinics: 3,
        objectives: ['Validate functionality', 'Gather feedback', 'Develop testimonials'],
        successMetrics: [
          { name: 'Satisfaction Rating', target: 4.5, unit: '1-5 scale', priority: 'critical' },
          { name: 'System Uptime', target: 99.5, unit: 'percentage', priority: 'critical' }
        ]
      },
      {
        phaseId: 'phase_2_early_adopters',
        phaseName: 'Early Adopter Launch',
        duration: 45,
        targetClinics: 20,
        objectives: ['Scale platform', 'Validate pricing', 'Build momentum'],
        successMetrics: [
          { name: 'Weekly Onboarding', target: 4, unit: 'clinics/week', priority: 'high' }
        ]
      },
      {
        phaseId: 'phase_3_general',
        phaseName: 'General Availability',
        duration: 90,
        targetClinics: 100,
        objectives: ['Market penetration', 'Revenue growth', 'Industry leadership'],
        successMetrics: [
          { name: 'Market Penetration', target: 15, unit: 'percentage', priority: 'critical' }
        ]
      }
    ];

    phases.forEach(phase => {
      this.launchPhases.set(phase.phaseId, phase);
    });

    return phases;
  }

  static createGoToMarketStrategy(): GoToMarketStrategy {
    return {
      pricingTiers: [
        {
          tierName: 'Starter',
          monthlyPrice: 2990,
          features: ['Basic AI consultation', 'Customer management', 'Basic reports'],
          targetSegment: 'Small clinics'
        },
        {
          tierName: 'Professional',
          monthlyPrice: 9990,
          features: ['Advanced AI', 'Mobile app', 'Analytics', 'Multi-staff'],
          targetSegment: 'Medium clinics'
        },
        {
          tierName: 'Enterprise',
          monthlyPrice: 39990,
          features: ['Full suite', 'Multi-location', 'Custom integrations', 'Priority support'],
          targetSegment: 'Large clinics'
        }
      ],
      marketingChannels: ['Digital marketing', 'Industry events', 'Referral program', 'Partnerships'],
      salesTargets: { monthly: 15, quarterly: 45 }
    };
  }

  static getLaunchSummary(): any {
    return {
      totalPhases: this.launchPhases.size,
      pilotClinics: this.pilotClinics.size,
      estimatedDuration: 165, // days
      targetMarket: 500, // clinics in Thailand
      expectedPenetration: 20, // percentage
      projectedRevenue: 50000000 // THB annually
    };
  }
}

export { ProductionLaunchStrategy, type PilotClinic, type LaunchPhase };
