/**
 * CRM Plus Integration System
 */

interface CustomerLifetimeValue {
  customerId: string;
  totalRevenue: number;
  predictedCLV: number;
  clvCategory: 'high' | 'medium' | 'low';
  loyaltyScore: number;
}

interface LoyaltyProgram {
  customerId: string;
  membershipLevel: 'bronze' | 'silver' | 'gold' | 'platinum';
  pointsBalance: number;
  benefits: string[];
}

interface CustomerInsight {
  customerId: string;
  churnRisk: 'high' | 'medium' | 'low';
  recommendedAction: string;
  expectedROI: number;
}

class CRMPlusIntegration {
  private static customerCLV: Map<string, CustomerLifetimeValue> = new Map();
  private static loyaltyPrograms: Map<string, LoyaltyProgram> = new Map();
  private static insights: Map<string, CustomerInsight> = new Map();

  static calculateCLV(customerId: string, transactionHistory: any[]): CustomerLifetimeValue {
    const totalRevenue = transactionHistory.reduce((sum, t) => sum + t.amount, 0);
    const avgOrderValue = totalRevenue / transactionHistory.length;
    const predictedCLV = avgOrderValue * 24; // 2 years projection
    
    let clvCategory: 'high' | 'medium' | 'low';
    if (predictedCLV > 100000) clvCategory = 'high';
    else if (predictedCLV > 50000) clvCategory = 'medium';
    else clvCategory = 'low';
    
    const loyaltyScore = Math.min(100, Math.round(
      (transactionHistory.length * 5) + (avgOrderValue / 500)
    ));

    const clv: CustomerLifetimeValue = {
      customerId,
      totalRevenue,
      predictedCLV,
      clvCategory,
      loyaltyScore
    };

    this.customerCLV.set(customerId, clv);
    return clv;
  }

  static updateLoyalty(customerId: string, transactionAmount: number): LoyaltyProgram {
    let loyalty = this.loyaltyPrograms.get(customerId);
    
    if (!loyalty) {
      loyalty = {
        customerId,
        membershipLevel: 'bronze',
        pointsBalance: 0,
        benefits: ['5% discount']
      };
    }

    const newPoints = Math.floor(transactionAmount / 100);
    loyalty.pointsBalance += newPoints;

    // Upgrade tiers based on points
    if (loyalty.pointsBalance >= 10000) {
      loyalty.membershipLevel = 'platinum';
      loyalty.benefits = ['20% discount', 'VIP treatment', 'Free consultation'];
    } else if (loyalty.pointsBalance >= 5000) {
      loyalty.membershipLevel = 'gold';
      loyalty.benefits = ['15% discount', 'Priority booking'];
    } else if (loyalty.pointsBalance >= 2000) {
      loyalty.membershipLevel = 'silver';
      loyalty.benefits = ['10% discount'];
    }

    this.loyaltyPrograms.set(customerId, loyalty);
    return loyalty;
  }

  static generateInsights(customerId: string): CustomerInsight {
    const clv = this.customerCLV.get(customerId);
    if (!clv) throw new Error('CLV data required');

    let churnRisk: 'high' | 'medium' | 'low';
    let recommendedAction: string;
    let expectedROI: number;

    if (clv.loyaltyScore < 30) {
      churnRisk = 'high';
      recommendedAction = 'Retention campaign with special offer';
      expectedROI = 300;
    } else if (clv.clvCategory === 'high') {
      churnRisk = 'low';
      recommendedAction = 'Upsell premium services';
      expectedROI = 250;
    } else {
      churnRisk = 'medium';
      recommendedAction = 'Cross-sell complementary services';
      expectedROI = 180;
    }

    const insight: CustomerInsight = {
      customerId,
      churnRisk,
      recommendedAction,
      expectedROI
    };

    this.insights.set(customerId, insight);
    return insight;
  }

  static getCRMAnalytics(): any {
    const allCLV = Array.from(this.customerCLV.values());
    const allLoyalty = Array.from(this.loyaltyPrograms.values());
    const allInsights = Array.from(this.insights.values());

    return {
      totalCustomers: allCLV.length,
      averageCLV: allCLV.reduce((sum, clv) => sum + clv.predictedCLV, 0) / allCLV.length,
      highValueCustomers: allCLV.filter(clv => clv.clvCategory === 'high').length,
      loyaltyDistribution: {
        bronze: allLoyalty.filter(l => l.membershipLevel === 'bronze').length,
        silver: allLoyalty.filter(l => l.membershipLevel === 'silver').length,
        gold: allLoyalty.filter(l => l.membershipLevel === 'gold').length,
        platinum: allLoyalty.filter(l => l.membershipLevel === 'platinum').length
      },
      churnRisk: {
        high: allInsights.filter(i => i.churnRisk === 'high').length,
        medium: allInsights.filter(i => i.churnRisk === 'medium').length,
        low: allInsights.filter(i => i.churnRisk === 'low').length
      }
    };
  }
}

export { CRMPlusIntegration, type CustomerLifetimeValue, type LoyaltyProgram };
