/**
 * Regional Expansion System
 * ASEAN market expansion planning and execution
 */

interface RegionalMarket {
  countryCode: string;
  countryName: string;
  marketSize: number;
  beautyClinicCount: number;
  targetClinics: number;
  launchDate: string;
  status: 'research' | 'planning' | 'pilot' | 'active' | 'scaling';
  localPartner?: string;
  regulatoryStatus: 'pending' | 'approved' | 'in_progress';
}

interface ExpansionMetrics {
  totalMarkets: number;
  activeMarkets: number;
  totalClinics: number;
  internationalMRR: number;
  marketPenetration: number;
}

interface LocalizationRequirements {
  country: string;
  language: string;
  currency: string;
  paymentGateways: string[];
  regulations: string[];
  culturalConsiderations: string[];
}

class RegionalExpansionSystem {
  /**
   * Get ASEAN market overview
   */
  static getMarketOverview(): RegionalMarket[] {
    return [
      { countryCode: 'TH', countryName: 'Thailand', marketSize: 500, beautyClinicCount: 2500, targetClinics: 200, launchDate: '2025-02-01', status: 'scaling', regulatoryStatus: 'approved' },
      { countryCode: 'VN', countryName: 'Vietnam', marketSize: 350, beautyClinicCount: 1800, targetClinics: 100, launchDate: '2025-07-01', status: 'planning', localPartner: 'VietBeauty Corp', regulatoryStatus: 'in_progress' },
      { countryCode: 'MY', countryName: 'Malaysia', marketSize: 280, beautyClinicCount: 1200, targetClinics: 80, launchDate: '2025-09-01', status: 'research', regulatoryStatus: 'pending' },
      { countryCode: 'SG', countryName: 'Singapore', marketSize: 200, beautyClinicCount: 600, targetClinics: 50, launchDate: '2025-10-01', status: 'research', regulatoryStatus: 'pending' },
      { countryCode: 'ID', countryName: 'Indonesia', marketSize: 600, beautyClinicCount: 3500, targetClinics: 150, launchDate: '2026-01-01', status: 'research', localPartner: 'Indo Beauty Network', regulatoryStatus: 'pending' },
      { countryCode: 'PH', countryName: 'Philippines', marketSize: 250, beautyClinicCount: 1400, targetClinics: 70, launchDate: '2026-03-01', status: 'research', regulatoryStatus: 'pending' }
    ];
  }

  /**
   * Get expansion metrics
   */
  static getExpansionMetrics(): ExpansionMetrics {
    return {
      totalMarkets: 6,
      activeMarkets: 1,
      totalClinics: 100,
      internationalMRR: 0,
      marketPenetration: 4
    };
  }

  /**
   * Get localization requirements by country
   */
  static getLocalizationRequirements(countryCode: string): LocalizationRequirements {
    const requirements: Record<string, LocalizationRequirements> = {
      VN: { country: 'Vietnam', language: 'Vietnamese', currency: 'VND', paymentGateways: ['MoMo', 'VNPay', 'ZaloPay'], regulations: ['Data localization required', 'Local entity needed'], culturalConsiderations: ['Lunar New Year promotions', 'Family-oriented messaging'] },
      MY: { country: 'Malaysia', language: 'Malay/English', currency: 'MYR', paymentGateways: ['FPX', 'GrabPay', 'Touch n Go'], regulations: ['PDPA compliance', 'Halal certification for products'], culturalConsiderations: ['Multi-cultural approach', 'Halal considerations'] },
      SG: { country: 'Singapore', language: 'English', currency: 'SGD', paymentGateways: ['PayNow', 'GrabPay', 'Credit Cards'], regulations: ['PDPA compliance', 'Medical device registration'], culturalConsiderations: ['Premium positioning', 'Efficiency focus'] },
      ID: { country: 'Indonesia', language: 'Bahasa Indonesia', currency: 'IDR', paymentGateways: ['GoPay', 'OVO', 'DANA'], regulations: ['Local data storage', 'BPOM registration'], culturalConsiderations: ['Island diversity', 'Halal importance'] },
      PH: { country: 'Philippines', language: 'Filipino/English', currency: 'PHP', paymentGateways: ['GCash', 'Maya', 'Credit Cards'], regulations: ['NPC compliance', 'FDA registration'], culturalConsiderations: ['Social media driven', 'Celebrity endorsements'] }
    };
    return requirements[countryCode] || requirements['VN'];
  }

  /**
   * Get expansion timeline
   */
  static getExpansionTimeline(): any {
    return {
      phases: [
        { phase: 'Phase 1: Thailand Dominance', period: 'Q1-Q4 2025', target: '200 clinics, THB 1.8M MRR', status: 'active' },
        { phase: 'Phase 2: Vietnam Entry', period: 'Q3-Q4 2025', target: '50 clinics, $50K MRR', status: 'planning' },
        { phase: 'Phase 3: Malaysia & Singapore', period: 'Q4 2025 - Q1 2026', target: '80 clinics combined', status: 'research' },
        { phase: 'Phase 4: Indonesia & Philippines', period: 'Q1-Q3 2026', target: '150 clinics combined', status: 'research' }
      ],
      yearEndGoal: { markets: 3, clinics: 280, mrr: '$150K equivalent' }
    };
  }

  /**
   * Get expansion executive summary
   */
  static getExecutiveSummary(): any {
    return {
      headline: 'ASEAN Expansion: Strategic Roadmap',
      currentPosition: 'Thailand market leader with 100 clinics',
      nextMarket: 'Vietnam (Q3 2025)',
      totalAddressableMarket: '$2.2B across ASEAN',
      threeYearGoal: '500 clinics across 6 countries',
      keySuccessFactors: ['Local partnerships', 'Localized AI models', 'Regional payment integration', 'Regulatory compliance']
    };
  }
}

export { RegionalExpansionSystem, type RegionalMarket, type ExpansionMetrics };
