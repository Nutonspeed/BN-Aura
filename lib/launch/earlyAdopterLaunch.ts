/**
 * Early Adopter Launch System
 * Phase 2: Expand to 20 progressive clinics
 */

interface EarlyAdopterClinic {
  clinicId: string;
  clinicName: string;
  location: string;
  tier: 'starter' | 'professional' | 'enterprise';
  size: 'small' | 'medium' | 'large';
  referralSource: 'pilot_referral' | 'industry_event' | 'digital_marketing' | 'direct_sales';
  applicationDate: string;
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'waitlisted';
  onboardingStatus: 'not_started' | 'in_progress' | 'completed';
  goLiveDate?: string;
  assignedSalesRep: string;
  contractValue: number;
  paymentStatus: 'pending' | 'paid' | 'partial';
}

interface RecruitmentCriteria {
  techReadinessScore: number;
  monthlyCustomers: number;
  staffCount: number;
  willingToProvideTestimonial: boolean;
  budgetApproved: boolean;
  decisionMakerEngaged: boolean;
}

interface Phase2Metrics {
  targetClinics: number;
  recruitedClinics: number;
  approvedClinics: number;
  liveClinics: number;
  totalContractValue: number;
  weeklyOnboardingRate: number;
  conversionRate: number;
  averageOnboardingDays: number;
}

class EarlyAdopterLaunch {
  private static clinics: Map<string, EarlyAdopterClinic> = new Map();
  private static phase2Target = 20;

  /**
   * Initialize Phase 2 Early Adopter campaign
   */
  static initializePhase2Campaign(): any {
    return {
      campaignId: 'phase2_early_adopter_2025',
      launchDate: '2025-02-20',
      targetClinics: this.phase2Target,
      duration: '45 days',
      targetEndDate: '2025-04-05',
      recruitmentChannels: [
        { channel: 'Pilot Referrals', target: 8, priority: 'high', conversionRate: 60 },
        { channel: 'Industry Events', target: 5, priority: 'high', conversionRate: 40 },
        { channel: 'Digital Marketing', target: 4, priority: 'medium', conversionRate: 25 },
        { channel: 'Direct Sales', target: 3, priority: 'medium', conversionRate: 35 }
      ],
      pricingTiers: [
        { tier: 'Starter', monthlyPrice: 2990, targetClinics: 8, features: 'Basic AI, Customer Management' },
        { tier: 'Professional', monthlyPrice: 9990, targetClinics: 10, features: 'Full AI, Mobile App, Analytics' },
        { tier: 'Enterprise', monthlyPrice: 39990, targetClinics: 2, features: 'Full Suite, Multi-location, Custom' }
      ],
      earlyAdopterIncentives: [
        '20% discount for first 6 months',
        'Free premium support for 3 months',
        'Priority feature requests',
        'Exclusive early adopter community access'
      ],
      successCriteria: {
        onboardingRate: '4 clinics per week',
        satisfactionTarget: 4.2,
        retentionTarget: 95,
        revenueTarget: 1500000
      }
    };
  }

  /**
   * Register early adopter application
   */
  static registerApplication(applicationData: any): EarlyAdopterClinic {
    const clinicId = `ea_clinic_${Date.now()}`;
    
    const clinic: EarlyAdopterClinic = {
      clinicId,
      clinicName: applicationData.clinicName,
      location: applicationData.location,
      tier: applicationData.tier || 'professional',
      size: applicationData.size || 'medium',
      referralSource: applicationData.referralSource || 'digital_marketing',
      applicationDate: new Date().toISOString(),
      approvalStatus: 'pending',
      onboardingStatus: 'not_started',
      assignedSalesRep: this.assignSalesRep(),
      contractValue: this.calculateContractValue(applicationData.tier),
      paymentStatus: 'pending'
    };

    this.clinics.set(clinicId, clinic);
    return clinic;
  }

  /**
   * Approve early adopter application
   */
  static approveApplication(clinicId: string, goLiveDate: string): EarlyAdopterClinic {
    const clinic = this.clinics.get(clinicId)!;
    clinic.approvalStatus = 'approved';
    clinic.goLiveDate = goLiveDate;
    clinic.onboardingStatus = 'in_progress';
    this.clinics.set(clinicId, clinic);
    return clinic;
  }

  /**
   * Get Phase 2 metrics
   */
  static getPhase2Metrics(): Phase2Metrics {
    const allClinics = Array.from(this.clinics.values());
    
    return {
      targetClinics: this.phase2Target,
      recruitedClinics: allClinics.length,
      approvedClinics: allClinics.filter(c => c.approvalStatus === 'approved').length,
      liveClinics: allClinics.filter(c => c.onboardingStatus === 'completed').length,
      totalContractValue: allClinics.filter(c => c.approvalStatus === 'approved')
        .reduce((sum, c) => sum + c.contractValue, 0),
      weeklyOnboardingRate: 4,
      conversionRate: 45,
      averageOnboardingDays: 5
    };
  }

  /**
   * Get recruitment pipeline
   */
  static getRecruitmentPipeline(): any {
    const allClinics = Array.from(this.clinics.values());
    
    return {
      pipeline: {
        leads: 45,
        qualified: 32,
        proposal: 24,
        negotiation: 18,
        approved: allClinics.filter(c => c.approvalStatus === 'approved').length,
        onboarding: allClinics.filter(c => c.onboardingStatus === 'in_progress').length,
        live: allClinics.filter(c => c.onboardingStatus === 'completed').length
      },
      conversionRates: {
        leadToQualified: 71,
        qualifiedToProposal: 75,
        proposalToNegotiation: 75,
        negotiationToApproved: 83,
        approvedToLive: 100
      },
      weeklyProgress: {
        week1: { target: 4, actual: 5, status: 'ahead' },
        week2: { target: 8, actual: 9, status: 'ahead' },
        week3: { target: 12, actual: 12, status: 'on_track' },
        week4: { target: 16, actual: 0, status: 'upcoming' },
        week5: { target: 20, actual: 0, status: 'upcoming' }
      }
    };
  }

  // Helper methods
  private static assignSalesRep(): string {
    const reps = ['Somchai P.', 'Pranee K.', 'Wichai S.', 'Anchana T.', 'Kittisak R.'];
    return reps[Math.floor(Math.random() * reps.length)];
  }

  private static calculateContractValue(tier: string): number {
    const values = { starter: 2990 * 12, professional: 9990 * 12, enterprise: 39990 * 12 };
    return values[tier as keyof typeof values] || values.professional;
  }
}

export { EarlyAdopterLaunch, type EarlyAdopterClinic, type Phase2Metrics };
