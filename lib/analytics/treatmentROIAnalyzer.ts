/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/**
 * Treatment ROI Analysis Engine
 * Comprehensive analysis of return on investment for aesthetic treatments
 * Including financial, clinical, and customer lifetime value metrics
 */

import { createClient } from '@/lib/supabase/server';

export interface TreatmentCost {
  directCost: number; // Product cost, consumables
  laborCost: number; // Staff time cost
  overheadCost: number; // Equipment, rent, utilities
  marketingCost: number; // Customer acquisition cost
  totalCost: number;
}

export interface TreatmentRevenue {
  basePrice: number;
  upsellRevenue: number; // Additional products/services
  repeatRevenue: number; // Future bookings from this customer
  referralRevenue: number; // Revenue from referred customers
  totalRevenue: number;
}

export interface ClinicalROI {
  patientSatisfaction: number; // 1-5 scale
  treatmentEfficacy: number; // 0-100% improvement
  complicationRate: number; // % of treatments with complications
  repeatBookingRate: number; // % of patients who book again
  referralRate: number; // % of patients who refer others
}

export interface CustomerLifetimeValue {
  acquisitionCost: number;
  averageOrderValue: number;
  purchaseFrequency: number; // per year
  customerLifetime: number; // in years
  retentionRate: number; // % per year
  ltv: number;
}

export interface ROIAnalysis {
  treatmentId: string;
  treatmentName: string;
  timeframe: number; // months to analyze
  
  // Financial Metrics
  costs: TreatmentCost;
  revenues: TreatmentRevenue;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  breakEvenPoint: number; // number of treatments to break even
  
  // ROI Calculations
  roi: number; // Return on Investment percentage
  annualizedROI: number; // Annualized ROI
  paybackPeriod: number; // months to recover investment
  
  // Clinical Metrics
  clinicalROI: ClinicalROI;
  
  // Customer Metrics
  customerLTV: CustomerLifetimeValue;
  
  // Comparative Analysis
  industryBenchmark: {
    averageROI: number;
    averageProfitMargin: number;
    averageSatisfaction: number;
  };
  
  // Risk Assessment
  riskFactors: {
    marketRisk: number; // 0-100
    operationalRisk: number; // 0-100
    financialRisk: number; // 0-100
    competitiveRisk: number; // 0-100
  };
  
  // Recommendations
  recommendations: {
    financial: string[];
    operational: string[];
    marketing: string[];
  };
  
  // Projections
  projections: {
    month1: number;
    month3: number;
    month6: number;
    month12: number;
    month24: number;
  };
  
  processingTime: number;
}

class TreatmentROIAnalyzer {
  private industryBenchmarks: Map<string, any> = new Map();
  
  constructor() {
    this.initializeBenchmarks();
  }

  private initializeBenchmarks() {
    // Industry benchmarks for different treatment categories
    this.industryBenchmarks.set('facial', {
      averageROI: 250,
      averageProfitMargin: 65,
      averageSatisfaction: 4.2,
      averageRepeatRate: 75,
      averageReferralRate: 35
    });

    this.industryBenchmarks.set('laser', {
      averageROI: 320,
      averageProfitMargin: 70,
      averageSatisfaction: 4.5,
      averageRepeatRate: 60,
      averageReferralRate: 40
    });

    this.industryBenchmarks.set('injectable', {
      averageROI: 450,
      averageProfitMargin: 75,
      averageSatisfaction: 4.7,
      averageRepeatRate: 85,
      averageReferralRate: 45
    });

    this.industryBenchmarks.set('body', {
      averageROI: 280,
      averageProfitMargin: 60,
      averageSatisfaction: 4.0,
      averageRepeatRate: 55,
      averageReferralRate: 30
    });

    this.industryBenchmarks.set('wellness', {
      averageROI: 200,
      averageProfitMargin: 55,
      averageSatisfaction: 4.3,
      averageRepeatRate: 80,
      averageReferralRate: 25
    });
  }

  /**
   * Analyze ROI for multiple treatments
   */
  async analyzeTreatmentROI(
    treatmentIds: string[],
    clinicId: string,
    timeframe: number = 12
  ): Promise<ROIAnalysis[]> {
    const startTime = Date.now();
    const supabase = await createClient();

    // Fetch treatment details
    const { data: treatments } = await supabase
      .from('treatments')
      .select('*')
      .in('id', treatmentIds)
      .eq('clinic_id', clinicId);

    if (!treatments) {
      throw new Error('Treatments not found');
    }

    // Fetch historical data
    const historicalData = await this.getHistoricalROIData(clinicId, treatmentIds);

    const analyses: ROIAnalysis[] = [];

    for (const treatment of treatments) {
      const analysis = await this.analyzeSingleTreatment(
        treatment,
        clinicId,
        timeframe,
        historicalData
      );
      analyses.push(analysis);
    }

    // Sort by ROI
    analyses.sort((a, b) => b.roi - a.roi);

    return analyses.map(a => ({
      ...a,
      processingTime: Date.now() - startTime
    }));
  }

  /**
   * Analyze ROI for a single treatment
   */
  private async analyzeSingleTreatment(
    treatment: any,
    clinicId: string,
    timeframe: number,
    historicalData: any[]
  ): Promise<ROIAnalysis> {
    // Calculate costs
    const costs = await this.calculateTreatmentCosts(treatment, clinicId);
    
    // Calculate revenues
    const revenues = await this.calculateTreatmentRevenues(treatment, clinicId, timeframe);
    
    // Calculate profit metrics
    const grossProfit = revenues.totalRevenue - costs.directCost;
    const netProfit = revenues.totalRevenue - costs.totalCost;
    const profitMargin = (netProfit / revenues.totalRevenue) * 100;
    
    // Calculate ROI metrics
    const roi = (netProfit / costs.totalCost) * 100;
    const annualizedROI = this.calculateAnnualizedROI(roi, timeframe);
    const paybackPeriod = this.calculatePaybackPeriod(costs.totalCost, revenues.totalRevenue);
    const breakEvenPoint = Math.ceil(costs.totalCost / (revenues.basePrice * 0.7)); // Assuming 70% margin

    // Get clinical metrics
    const clinicalROI = await this.calculateClinicalROI(treatment, historicalData);
    
    // Calculate customer LTV
    const customerLTV = await this.calculateCustomerLTV(treatment, clinicId, historicalData);
    
    // Get industry benchmarks
    const category = treatment.category || 'facial';
    const industryBenchmark = this.industryBenchmarks.get(category) || this.industryBenchmarks.get('facial')!;

    // Assess risks
    const riskFactors = await this.assessRiskFactors(treatment, clinicId, historicalData);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(
      roi,
      profitMargin,
      clinicalROI,
      riskFactors,
      industryBenchmark
    );
    
    // Calculate projections
    const projections = this.calculateProjections(
      netProfit,
      timeframe,
      clinicalROI.repeatBookingRate,
      clinicalROI.referralRate
    );

    return {
      treatmentId: treatment.id,
      treatmentName: treatment.names?.en || treatment.names?.th || 'Unknown Treatment',
      timeframe,
      costs,
      revenues,
      grossProfit,
      netProfit,
      profitMargin,
      breakEvenPoint,
      roi,
      annualizedROI,
      paybackPeriod,
      clinicalROI,
      customerLTV,
      industryBenchmark,
      riskFactors,
      recommendations,
      projections,
      processingTime: 0
    };
  }

  /**
   * Calculate treatment costs
   */
  private async calculateTreatmentCosts(
    treatment: any,
    clinicId: string
  ): Promise<TreatmentCost> {
    // Base costs (would typically come from database)
    const directCost = (treatment.price_min || 0) * 0.3; // 30% of price for products/consumables
    const laborCost = (treatment.price_min || 0) * 0.25; // 25% for staff time
    const overheadCost = (treatment.price_min || 0) * 0.15; // 15% for overhead
    const marketingCost = (treatment.price_min || 0) * 0.1; // 10% for marketing
    
    const totalCost = directCost + laborCost + overheadCost + marketingCost;

    return {
      directCost,
      laborCost,
      overheadCost,
      marketingCost,
      totalCost
    };
  }

  /**
   * Calculate treatment revenues
   */
  private async calculateTreatmentRevenues(
    treatment: any,
    clinicId: string,
    timeframe: number
  ): Promise<TreatmentRevenue> {
    const basePrice = (treatment.price_min + treatment.price_max) / 2 || 0;
    
    // Upsell revenue (additional products)
    const upsellRevenue = basePrice * 0.3; // 30% of base price
    
    // Repeat revenue (future bookings)
    const repeatRate = this.getRepeatRateForCategory(treatment.category);
    const repeatRevenue = basePrice * repeatRate * (timeframe / 12) * 0.5; // Average 0.5 repeat per year
    
    // Referral revenue
    const referralRate = this.getReferralRateForCategory(treatment.category);
    const referralRevenue = basePrice * referralRate * 0.3; // 30% conversion on referrals

    const totalRevenue = basePrice + upsellRevenue + repeatRevenue + referralRevenue;

    return {
      basePrice,
      upsellRevenue,
      repeatRevenue,
      referralRevenue,
      totalRevenue
    };
  }

  /**
   * Calculate clinical ROI metrics
   */
  private async calculateClinicalROI(
    treatment: any,
    historicalData: any[]
  ): Promise<ClinicalROI> {
    // Default values based on industry standards
    const category = treatment.category || 'facial';
    
    const patientSatisfaction = this.getSatisfactionForCategory(category);
    const treatmentEfficacy = this.getEfficacyForCategory(category);
    const complicationRate = this.getComplicationRateForCategory(category);
    const repeatBookingRate = this.getRepeatRateForCategory(category);
    const referralRate = this.getReferralRateForCategory(category);

    // Adjust based on historical data if available
    const historicalAdjustment = this.getHistoricalClinicalAdjustment(historicalData, treatment.id);

    return {
      patientSatisfaction: Math.min(5, Math.max(1, patientSatisfaction + historicalAdjustment.satisfaction)),
      treatmentEfficacy: Math.min(100, Math.max(0, treatmentEfficacy + historicalAdjustment.efficacy)),
      complicationRate: Math.max(0, complicationRate + historicalAdjustment.complications),
      repeatBookingRate: Math.min(100, Math.max(0, repeatBookingRate + historicalAdjustment.repeat)),
      referralRate: Math.min(100, Math.max(0, referralRate + historicalAdjustment.referral))
    };
  }

  /**
   * Calculate customer lifetime value
   */
  private async calculateCustomerLTV(
    treatment: any,
    clinicId: string,
    historicalData: any[]
  ): Promise<CustomerLifetimeValue> {
    const basePrice = (treatment.price_min + treatment.price_max) / 2 || 0;
    
    // Acquisition cost (marketing cost per customer)
    const acquisitionCost = basePrice * 0.15; // 15% of treatment price
    
    // Average order value
    const averageOrderValue = basePrice * 1.3; // Including upsells
    
    // Purchase frequency (times per year)
    const purchaseFrequency = this.getPurchaseFrequencyForCategory(treatment.category);
    
    // Customer lifetime (years)
    const customerLifetime = this.getCustomerLifetimeForCategory(treatment.category);
    
    // Retention rate (per year)
    const retentionRate = this.getRetentionRateForCategory(treatment.category);
    
    // Calculate LTV
    const ltv = (averageOrderValue * purchaseFrequency * customerLifetime * retentionRate) - acquisitionCost;

    return {
      acquisitionCost,
      averageOrderValue,
      purchaseFrequency,
      customerLifetime,
      retentionRate,
      ltv
    };
  }

  /**
   * Assess risk factors
   */
  private async assessRiskFactors(
    treatment: any,
    clinicId: string,
    historicalData: any[]
  ): Promise<ROIAnalysis['riskFactors']> {
    // Market risk (competition, demand trends)
    const marketRisk = this.calculateMarketRisk(treatment, historicalData);
    
    // Operational risk (staff, equipment, processes)
    const operationalRisk = this.calculateOperationalRisk(treatment, historicalData);
    
    // Financial risk (cash flow, pricing pressure)
    const financialRisk = this.calculateFinancialRisk(treatment, historicalData);
    
    // Competitive risk (market position, differentiation)
    const competitiveRisk = this.calculateCompetitiveRisk(treatment, historicalData);

    return {
      marketRisk,
      operationalRisk,
      financialRisk,
      competitiveRisk
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    roi: number,
    profitMargin: number,
    clinicalROI: ClinicalROI,
    riskFactors: ROIAnalysis['riskFactors'],
    industryBenchmark: any
  ): ROIAnalysis['recommendations'] {
    const recommendations = {
      financial: [] as string[],
      operational: [] as string[],
      marketing: [] as string[]
    };

    // Financial recommendations
    if (roi < industryBenchmark.averageROI) {
      recommendations.financial.push('Consider optimizing cost structure to improve ROI');
      recommendations.financial.push('Review pricing strategy to increase profit margins');
    }

    if (profitMargin < industryBenchmark.averageProfitMargin) {
      recommendations.financial.push('Focus on high-margin add-on services');
      recommendations.financial.push('Negotiate better supplier pricing');
    }

    // Operational recommendations
    if (clinicalROI.complicationRate > 5) {
      recommendations.operational.push('Invest in additional staff training');
      recommendations.operational.push('Review treatment protocols for safety');
    }

    if (clinicalROI.repeatBookingRate < industryBenchmark.averageRepeatRate) {
      recommendations.operational.push('Improve patient experience to increase repeat bookings');
      recommendations.operational.push('Implement follow-up care protocols');
    }

    // Marketing recommendations
    if (clinicalROI.referralRate < industryBenchmark.averageReferralRate) {
      recommendations.marketing.push('Implement referral program incentives');
      recommendations.marketing.push('Encourage patient reviews and testimonials');
    }

    if (riskFactors.marketRisk > 60) {
      recommendations.marketing.push('Differentiate treatment offerings to reduce competition');
      recommendations.marketing.push('Focus on niche marketing segments');
    }

    return recommendations;
  }

  /**
   * Calculate projections
   */
  private calculateProjections(
    baseProfit: number,
    timeframe: number,
    repeatRate: number,
    referralRate: number
  ): ROIAnalysis['projections'] {
    const monthlyGrowth = 0.05; // 5% monthly growth assumption
    const repeatMultiplier = 1 + (repeatRate / 100);
    const referralMultiplier = 1 + (referralRate / 100) * 0.3; // 30% conversion on referrals

    return {
      month1: Math.round(baseProfit),
      month3: Math.round(baseProfit * Math.pow(1 + monthlyGrowth, 2) * repeatMultiplier),
      month6: Math.round(baseProfit * Math.pow(1 + monthlyGrowth, 5) * repeatMultiplier * 1.2),
      month12: Math.round(baseProfit * Math.pow(1 + monthlyGrowth, 11) * repeatMultiplier * referralMultiplier),
      month24: Math.round(baseProfit * Math.pow(1 + monthlyGrowth, 23) * repeatMultiplier * referralMultiplier * 1.5)
    };
  }

  // Helper methods
  private calculateAnnualizedROI(roi: number, timeframe: number): number {
    return Math.pow(1 + (roi / 100), 12 / timeframe) - 1;
  }

  private calculatePaybackPeriod(totalCost: number, monthlyRevenue: number): number {
    return totalCost / monthlyRevenue;
  }

  private getRepeatRateForCategory(category?: string): number {
    const rates: Record<string, number> = {
      'facial': 75,
      'laser': 60,
      'injectable': 85,
      'body': 55,
      'wellness': 80
    };
    return rates[category || 'facial'] || 70;
  }

  private getReferralRateForCategory(category?: string): number {
    const rates: Record<string, number> = {
      'facial': 35,
      'laser': 40,
      'injectable': 45,
      'body': 30,
      'wellness': 25
    };
    return rates[category || 'facial'] || 35;
  }

  private getSatisfactionForCategory(category?: string): number {
    const satisfactions: Record<string, number> = {
      'facial': 4.2,
      'laser': 4.5,
      'injectable': 4.7,
      'body': 4.0,
      'wellness': 4.3
    };
    return satisfactions[category || 'facial'] || 4.2;
  }

  private getEfficacyForCategory(category?: string): number {
    const efficacies: Record<string, number> = {
      'facial': 75,
      'laser': 85,
      'injectable': 90,
      'body': 70,
      'wellness': 65
    };
    return efficacies[category || 'facial'] || 75;
  }

  private getComplicationRateForCategory(category?: string): number {
    const rates: Record<string, number> = {
      'facial': 2,
      'laser': 5,
      'injectable': 3,
      'body': 4,
      'wellness': 1
    };
    return rates[category || 'facial'] || 2;
  }

  private getPurchaseFrequencyForCategory(category?: string): number {
    const frequencies: Record<string, number> = {
      'facial': 6, // Every 2 months
      'laser': 2, // Every 6 months
      'injectable': 4, // Every 3 months
      'body': 3, // Every 4 months
      'wellness': 12 // Monthly
    };
    return frequencies[category || 'facial'] || 6;
  }

  private getCustomerLifetimeForCategory(category?: string): number {
    const lifetimes: Record<string, number> = {
      'facial': 3,
      'laser': 5,
      'injectable': 4,
      'body': 2,
      'wellness': 4
    };
    return lifetimes[category || 'facial'] || 3;
  }

  private getRetentionRateForCategory(category?: string): number {
    const rates: Record<string, number> = {
      'facial': 0.75,
      'laser': 0.80,
      'injectable': 0.85,
      'body': 0.65,
      'wellness': 0.70
    };
    return rates[category || 'facial'] || 0.75;
  }

  private getHistoricalClinicalAdjustment(historicalData: any[], treatmentId: string) {
    // Find historical data for this treatment
    const treatmentData = historicalData.find(d => d.treatmentId === treatmentId);
    
    if (!treatmentData) {
      return { satisfaction: 0, efficacy: 0, complications: 0, repeat: 0, referral: 0 };
    }

    return {
      satisfaction: (treatmentData.avgSatisfaction - 4.2) * 0.1,
      efficacy: (treatmentData.avgEfficacy - 75) * 0.1,
      complications: (treatmentData.complicationRate - 2) * 0.1,
      repeat: (treatmentData.repeatRate - 70) * 0.1,
      referral: (treatmentData.referralRate - 35) * 0.1
    };
  }

  private calculateMarketRisk(treatment: any, historicalData: any[]): number {
    // Simplified market risk calculation
    let risk = 30; // Base risk
    
    // Adjust based on treatment category
    if (treatment.category === 'injectable') risk += 10; // Higher competition
    if (treatment.category === 'laser') risk += 5; // High equipment cost
    
    // Adjust based on historical performance
    const treatmentData = historicalData.find(d => d.treatmentId === treatment.id);
    if (treatmentData && treatmentData.demandTrend === 'declining') risk += 15;
    if (treatmentData && treatmentData.demandTrend === 'growing') risk -= 10;
    
    return Math.min(100, Math.max(0, risk));
  }

  private calculateOperationalRisk(treatment: any, historicalData: any[]): number {
    let risk = 25; // Base risk
    
    // Adjust based on treatment complexity
    if (treatment.category === 'laser') risk += 15; // Complex equipment
    if (treatment.category === 'injectable') risk += 10; // Requires specialized staff
    
    return Math.min(100, Math.max(0, risk));
  }

  private calculateFinancialRisk(treatment: any, historicalData: any[]): number {
    let risk = 20; // Base risk
    
    // Adjust based on price point
    const avgPrice = (treatment.price_min + treatment.price_max) / 2;
    if (avgPrice > 10000) risk += 10; // High price point = higher risk
    
    return Math.min(100, Math.max(0, risk));
  }

  private calculateCompetitiveRisk(treatment: any, historicalData: any[]): number {
    let risk = 35; // Base risk
    
    // Adjust based on market saturation
    if (treatment.category === 'facial') risk += 10; // High competition
    if (treatment.category === 'injectable') risk += 15; // Very high competition
    
    return Math.min(100, Math.max(0, risk));
  }

  private async getHistoricalROIData(clinicId: string, treatmentIds: string[]): Promise<any[]> {
    // In a real implementation, this would query the database
    // For now, return empty array
    return [];
  }
}

export { TreatmentROIAnalyzer };
