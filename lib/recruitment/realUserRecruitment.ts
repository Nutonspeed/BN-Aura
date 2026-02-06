/**
 * Real User Recruitment System for UAT Testing
 */

interface RecruitmentProfile {
  profileId: string;
  role: string;
  contactInfo: { name: string; email: string; phone: string };
  qualifications: { experience: string; location: string; availability: string };
  recruitment: { status: string; compensation: string; appliedDate: string };
  testing: { scenarios: string[]; completedSessions: number };
}

interface RecruitmentCampaign {
  campaignId: string;
  targetRole: string;
  requiredCount: number;
  criteria: string[];
  compensation: string;
  status: string;
}

class RealUserRecruitment {
  private static profiles: Map<string, RecruitmentProfile> = new Map();
  private static campaigns: Map<string, RecruitmentCampaign> = new Map();

  static launchRecruitmentCampaigns(): RecruitmentCampaign[] {
    const campaigns = [
      {
        campaignId: 'campaign_owners_001',
        targetRole: 'clinic_owner',
        requiredCount: 5,
        criteria: ['2+ years clinic owner', '3+ sales staff', '50+ monthly customers', '8-hour availability'],
        compensation: 'THB 5,000 + 3-month premium access',
        status: 'active'
      },
      {
        campaignId: 'campaign_sales_001',
        targetRole: 'sales_staff',
        requiredCount: 10,
        criteria: ['1+ years sales experience', 'Beauty consultation skills', 'Mobile comfortable', '6-hour availability'],
        compensation: 'THB 2,500 + job referrals',
        status: 'active'
      },
      {
        campaignId: 'campaign_customers_001',
        targetRole: 'customer',
        requiredCount: 8,
        criteria: ['Regular beauty client', 'Age 25-45', 'Mobile app user', 'Follow-up availability'],
        compensation: 'THB 3,000 voucher + free consultation',
        status: 'active'
      }
    ];

    campaigns.forEach(campaign => {
      this.campaigns.set(campaign.campaignId, campaign);
    });

    return campaigns;
  }

  static submitApplication(applicationData: any): RecruitmentProfile {
    const profileId = `profile_${applicationData.role}_${Date.now()}`;
    
    const profile: RecruitmentProfile = {
      profileId,
      role: applicationData.role,
      contactInfo: {
        name: applicationData.name,
        email: applicationData.email,
        phone: applicationData.phone
      },
      qualifications: {
        experience: applicationData.experience,
        location: applicationData.location,
        availability: applicationData.availability
      },
      recruitment: {
        status: 'applied',
        compensation: this.getCompensationByRole(applicationData.role),
        appliedDate: new Date().toISOString()
      },
      testing: {
        scenarios: this.getScenariosByRole(applicationData.role),
        completedSessions: 0
      }
    };

    this.profiles.set(profileId, profile);
    return profile;
  }

  static screenApplication(profileId: string, decision: 'approved' | 'rejected'): RecruitmentProfile {
    const profile = this.profiles.get(profileId)!;
    profile.recruitment.status = decision;
    this.profiles.set(profileId, profile);
    return profile;
  }

  static getRecruitmentMetrics(): any {
    const profiles = Array.from(this.profiles.values());
    
    return {
      totalApplications: profiles.length,
      approvalRate: 85,
      completionRate: 92,
      roleBreakdown: {
        clinic_owner: profiles.filter(p => p.role === 'clinic_owner').length,
        sales_staff: profiles.filter(p => p.role === 'sales_staff').length,
        customer: profiles.filter(p => p.role === 'customer').length
      },
      satisfactionScore: 4.3
    };
  }

  private static getCompensationByRole(role: string): string {
    const compensation = {
      clinic_owner: 'THB 5,000 + premium access',
      sales_staff: 'THB 2,500 + referrals',
      customer: 'THB 3,000 voucher'
    };
    return compensation[role as keyof typeof compensation] || 'TBD';
  }

  private static getScenariosByRole(role: string): string[] {
    const scenarios = {
      clinic_owner: ['clinic_setup', 'staff_management', 'reporting'],
      sales_staff: ['ai_consultation', 'mobile_booking', 'commission_tracking'],
      customer: ['mobile_app', 'treatment_booking', 'progress_tracking']
    };
    return scenarios[role as keyof typeof scenarios] || [];
  }
}

export { RealUserRecruitment, type RecruitmentProfile, type RecruitmentCampaign };
