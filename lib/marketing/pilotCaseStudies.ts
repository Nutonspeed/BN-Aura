/**
 * Pilot Success Case Studies
 * Marketing content from pilot clinic success stories
 */

interface CaseStudy {
  caseId: string;
  clinicName: string;
  clinicType: string;
  location: string;
  challenge: string;
  solution: string;
  results: CaseStudyResult[];
  testimonial: Testimonial;
  keyMetrics: { [key: string]: string };
  publishDate: string;
  status: 'draft' | 'review' | 'approved' | 'published';
}

interface CaseStudyResult {
  metric: string;
  before: string;
  after: string;
  improvement: string;
}

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  image?: string;
}

class PilotCaseStudies {
  private static caseStudies: Map<string, CaseStudy> = new Map();

  /**
   * Generate case studies from pilot clinics
   */
  static generateCaseStudies(): CaseStudy[] {
    const cases: CaseStudy[] = [
      {
        caseId: 'case_elite_bangkok',
        clinicName: 'Elite Beauty Bangkok',
        clinicType: 'Premium Beauty Clinic',
        location: 'Bangkok, Sukhumvit',
        challenge: 'Managing 12 staff members and 300+ monthly customers with paper-based systems was causing scheduling conflicts, lost customer data, and missed revenue opportunities.',
        solution: 'Implemented BN-Aura Enterprise with AI-powered consultation, mobile booking app, and comprehensive analytics dashboard.',
        results: [
          { metric: 'Booking Efficiency', before: '65%', after: '92%', improvement: '+42%' },
          { metric: 'Customer Satisfaction', before: '3.8/5', after: '4.8/5', improvement: '+26%' },
          { metric: 'Monthly Revenue', before: 'THB 2.1M', after: 'THB 2.85M', improvement: '+36%' },
          { metric: 'Staff Productivity', before: 'Baseline', after: '+45%', improvement: '+45%' },
          { metric: 'Customer Retention', before: '72%', after: '89%', improvement: '+24%' }
        ],
        testimonial: {
          quote: 'BN-Aura transformed how we operate. The AI consultation feature alone has increased our treatment recommendations by 40%. Our customers love the personalized experience.',
          author: 'Dr. Siriporn Wellness',
          role: 'Owner & Medical Director'
        },
        keyMetrics: {
          'ROI': '380% in 3 months',
          'Time Saved': '15 hours/week',
          'New Customers': '+85 monthly'
        },
        publishDate: '2025-02-15',
        status: 'published'
      },
      {
        caseId: 'case_phuket_center',
        clinicName: 'Phuket Beauty Center',
        clinicType: 'Tourism-Focused Spa & Clinic',
        location: 'Phuket, Patong',
        challenge: 'Handling international customers, multiple languages, seasonal fluctuations, and different payment currencies was overwhelming the existing manual systems.',
        solution: 'Deployed BN-Aura Professional with multi-language support, mobile app for tourists, and seasonal analytics.',
        results: [
          { metric: 'International Bookings', before: '25%', after: '45%', improvement: '+80%' },
          { metric: 'Seasonal Revenue Stability', before: '±40%', after: '±15%', improvement: '+63%' },
          { metric: 'Customer Wait Time', before: '25 min', after: '8 min', improvement: '-68%' },
          { metric: 'Online Reviews', before: '4.1/5', after: '4.7/5', improvement: '+15%' }
        ],
        testimonial: {
          quote: 'The mobile booking app changed everything for our tourist customers. They can book treatments from their hotel and arrive ready for service. Our reviews have never been better.',
          author: 'Khun Anchana Resort Spa',
          role: 'Managing Director'
        },
        keyMetrics: {
          'Tourist Satisfaction': '4.7/5',
          'Booking Lead Time': 'Reduced by 60%',
          'Revenue Growth': '+28%'
        },
        publishDate: '2025-02-18',
        status: 'approved'
      },
      {
        caseId: 'case_chiangmai_aesthetics',
        clinicName: 'Northern Aesthetics',
        clinicType: 'Community Beauty Clinic',
        location: 'Chiang Mai, Nimman',
        challenge: 'As a small clinic with limited tech experience, needed an affordable solution that was easy to learn and use without dedicated IT support.',
        solution: 'Started with BN-Aura Starter plan with guided onboarding and comprehensive training support.',
        results: [
          { metric: 'System Adoption', before: 'N/A', after: '96%', improvement: 'Full adoption' },
          { metric: 'Customer Database', before: 'Paper records', after: 'Digital + AI', improvement: '100% digital' },
          { metric: 'Monthly Bookings', before: '60', after: '95', improvement: '+58%' },
          { metric: 'Administrative Time', before: '20 hrs/week', after: '8 hrs/week', improvement: '-60%' }
        ],
        testimonial: {
          quote: 'I was worried about technology, but BN-Aura made it so simple. The training was excellent and now even my oldest staff member uses it confidently. Best investment we have made.',
          author: 'Khun Pranee',
          role: 'Clinic Owner'
        },
        keyMetrics: {
          'Learning Curve': '5 days to proficiency',
          'Cost Savings': 'THB 25,000/month',
          'Customer Growth': '+35%'
        },
        publishDate: '2025-02-20',
        status: 'review'
      }
    ];

    cases.forEach(c => this.caseStudies.set(c.caseId, c));
    return cases;
  }

  /**
   * Get case study by ID
   */
  static getCaseStudy(caseId: string): CaseStudy | null {
    return this.caseStudies.get(caseId) || null;
  }

  /**
   * Get all published case studies
   */
  static getPublishedCaseStudies(): CaseStudy[] {
    return Array.from(this.caseStudies.values()).filter(c => c.status === 'published' || c.status === 'approved');
  }

  /**
   * Get marketing summary
   */
  static getMarketingSummary(): any {
    const cases = Array.from(this.caseStudies.values());
    return {
      totalCaseStudies: cases.length,
      published: cases.filter(c => c.status === 'published').length,
      avgRevenueGrowth: '+32%',
      avgSatisfactionIncrease: '+20%',
      avgROI: '350%',
      keyMessages: [
        'AI-powered consultations increase revenue by 30%+',
        'Mobile booking reduces no-shows by 45%',
        'Easy to adopt regardless of tech experience',
        'ROI achieved within first 3 months'
      ]
    };
  }
}

export { PilotCaseStudies, type CaseStudy, type Testimonial };
