/**
 * Automated Marketing Hub System
 */

interface CustomerProfile {
  customerId: string;
  clinicId: string;
  name: string;
  email: string;
  skinType: 'oily' | 'dry' | 'combination' | 'sensitive';
  concerns: string[];
  lastVisit: string;
  totalSpent: number;
  engagementScore: number;
}

interface MarketingCampaign {
  campaignId: string;
  clinicId: string;
  name: string;
  type: 'promotion' | 'education' | 'retention';
  targetSegment: string;
  subject: string;
  content: string;
  performance: {
    sent: number;
    opened: number;
    clicked: number;
    converted: number;
    revenue: number;
  };
}

class AutomatedMarketingHub {
  private static customers: Map<string, CustomerProfile> = new Map();
  private static campaigns: Map<string, MarketingCampaign> = new Map();

  static addCustomer(profile: CustomerProfile): void {
    this.customers.set(profile.customerId, profile);
  }

  static createCampaign(
    clinicId: string,
    name: string,
    type: MarketingCampaign['type'],
    targetSegment: string,
    subject: string,
    content: string
  ): string {
    const campaignId = `campaign_${Date.now()}`;
    
    const campaign: MarketingCampaign = {
      campaignId,
      clinicId,
      name,
      type,
      targetSegment,
      subject,
      content,
      performance: { sent: 0, opened: 0, clicked: 0, converted: 0, revenue: 0 }
    };

    this.campaigns.set(campaignId, campaign);
    return campaignId;
  }

  static generatePersonalizedContent(customerId: string): string {
    const customer = this.customers.get(customerId);
    if (!customer) return 'Generic content';

    const recommendations = this.getServiceRecommendations(customer.skinType, customer.concerns);
    return `Hi ${customer.name}! Based on your ${customer.skinType} skin, we recommend: ${recommendations.join(', ')}`;
  }

  static segmentCustomers(clinicId: string): { [segment: string]: CustomerProfile[] } {
    const clinicCustomers = Array.from(this.customers.values())
      .filter(c => c.clinicId === clinicId);

    return {
      'high_value': clinicCustomers.filter(c => c.totalSpent > 10000),
      'acne_prone': clinicCustomers.filter(c => c.concerns.includes('acne')),
      'anti_aging': clinicCustomers.filter(c => c.concerns.includes('wrinkles')),
      'dormant': clinicCustomers.filter(c => 
        new Date().getTime() - new Date(c.lastVisit).getTime() > 90 * 24 * 60 * 60 * 1000)
    };
  }

  static executeCampaign(campaignId: string): MarketingCampaign['performance'] {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) throw new Error('Campaign not found');

    // Mock campaign execution
    const segments = this.segmentCustomers(campaign.clinicId);
    const targetCustomers = segments[campaign.targetSegment] || [];
    
    campaign.performance = {
      sent: targetCustomers.length,
      opened: Math.floor(targetCustomers.length * 0.3),
      clicked: Math.floor(targetCustomers.length * 0.1),
      converted: Math.floor(targetCustomers.length * 0.05),
      revenue: Math.floor(targetCustomers.length * 0.05 * 5000)
    };

    this.campaigns.set(campaignId, campaign);
    return campaign.performance;
  }

  static getCampaignAnalytics(clinicId: string): any {
    const campaigns = Array.from(this.campaigns.values()).filter(c => c.clinicId === clinicId);
    const totalRevenue = campaigns.reduce((sum, c) => sum + c.performance.revenue, 0);
    const totalSent = campaigns.reduce((sum, c) => sum + c.performance.sent, 0);

    return {
      totalCampaigns: campaigns.length,
      totalRevenue,
      totalSent,
      averageROI: totalSent > 0 ? (totalRevenue / (totalSent * 2)) * 100 : 0,
      campaigns: campaigns.map(c => ({
        name: c.name,
        type: c.type,
        performance: c.performance
      }))
    };
  }

  private static getServiceRecommendations(skinType: string, concerns: string[]): string[] {
    const recommendations = [];
    
    if (skinType === 'oily' && concerns.includes('acne')) {
      recommendations.push('Acne Treatment', 'Oil Control Facial');
    }
    if (concerns.includes('wrinkles')) {
      recommendations.push('Botox Treatment', 'Anti-aging Facial');
    }
    if (skinType === 'sensitive') {
      recommendations.push('Gentle Hydration Facial', 'Sensitive Skin Care');
    }

    return recommendations.length > 0 ? recommendations : ['Consultation', 'Basic Facial'];
  }
}

export { AutomatedMarketingHub, type CustomerProfile, type MarketingCampaign };
