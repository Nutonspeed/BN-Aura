/**
 * Advanced Analytics & Insights Dashboard
 * Business intelligence and predictive analytics for clinic operations
 */

interface AnalyticsOverview {
  totalBookings: number;
  totalRevenue: number;
  activeCustomers: number;
  avgBookingValue: number;
  topTreatments: TreatmentAnalytics[];
  peakHours: PeakHourData[];
}

interface TreatmentAnalytics {
  treatmentName: string;
  bookings: number;
  revenue: number;
  growthRate: number;
  avgRating: number;
}

interface PeakHourData {
  hour: string;
  bookings: number;
  utilization: number;
}

interface PredictiveInsights {
  nextMonthRevenue: number;
  confidence: number;
  demandTrends: DemandTrend[];
  recommendations: string[];
}

interface DemandTrend {
  treatment: string;
  trend: 'increasing' | 'stable' | 'decreasing';
  prediction: string;
}

class AdvancedAnalyticsDashboard {
  /**
   * Get analytics overview
   */
  static getAnalyticsOverview(): AnalyticsOverview {
    return {
      totalBookings: 52500,
      totalRevenue: 131250000,
      activeCustomers: 28500,
      avgBookingValue: 2500,
      topTreatments: [
        { treatmentName: 'Facial Treatment', bookings: 15750, revenue: 39375000, growthRate: 12, avgRating: 4.7 },
        { treatmentName: 'Skin Rejuvenation', bookings: 10500, revenue: 31500000, growthRate: 18, avgRating: 4.8 },
        { treatmentName: 'Laser Treatment', bookings: 8400, revenue: 25200000, growthRate: 22, avgRating: 4.6 },
        { treatmentName: 'Body Contouring', bookings: 6300, revenue: 18900000, growthRate: 15, avgRating: 4.5 },
        { treatmentName: 'Anti-Aging Therapy', bookings: 5250, revenue: 15750000, growthRate: 25, avgRating: 4.9 }
      ],
      peakHours: [
        { hour: '10:00-12:00', bookings: 8400, utilization: 92 },
        { hour: '14:00-16:00', bookings: 7875, utilization: 88 },
        { hour: '16:00-18:00', bookings: 7350, utilization: 85 },
        { hour: '12:00-14:00', bookings: 6825, utilization: 78 }
      ]
    };
  }

  /**
   * Get predictive insights
   */
  static getPredictiveInsights(): PredictiveInsights {
    return {
      nextMonthRevenue: 14500000,
      confidence: 85,
      demandTrends: [
        { treatment: 'Anti-Aging Therapy', trend: 'increasing', prediction: '+25% next quarter' },
        { treatment: 'Laser Treatment', trend: 'increasing', prediction: '+18% next quarter' },
        { treatment: 'Skin Rejuvenation', trend: 'stable', prediction: 'Steady growth expected' },
        { treatment: 'Facial Treatment', trend: 'stable', prediction: 'Maintain market leader position' }
      ],
      recommendations: [
        'Increase capacity for Anti-Aging treatments (highest growth)',
        'Promote Laser packages during off-peak hours',
        'Launch loyalty program for repeat customers',
        'Consider premium pricing for peak hour slots'
      ]
    };
  }

  /**
   * Get customer insights
   */
  static getCustomerInsights(): any {
    return {
      segments: [
        { segment: 'Premium', count: 5700, percentage: 20, avgSpend: 8500, ltv: 102000 },
        { segment: 'Regular', count: 14250, percentage: 50, avgSpend: 3500, ltv: 42000 },
        { segment: 'Occasional', count: 8550, percentage: 30, avgSpend: 1500, ltv: 9000 }
      ],
      retention: { monthly: 78, quarterly: 65, annual: 45 },
      acquisition: { thisMonth: 1250, cost: 450, channel: 'Social Media 45%, Referral 35%, Direct 20%' }
    };
  }

  /**
   * Get AI consultation analytics
   */
  static getAIAnalytics(): any {
    return {
      totalConsultations: 18500,
      accuracy: 94.2,
      satisfaction: 4.6,
      topRecommendations: [
        { treatment: 'Personalized Skincare', count: 5550, conversionRate: 68 },
        { treatment: 'Preventive Anti-Aging', count: 4625, conversionRate: 72 },
        { treatment: 'Acne Treatment', count: 3700, conversionRate: 75 }
      ],
      impactMetrics: {
        bookingIncrease: '+35%',
        customerSatisfaction: '+22%',
        revenueContribution: 'THB 25.5M (19%)'
      }
    };
  }
}

export { AdvancedAnalyticsDashboard, type AnalyticsOverview, type PredictiveInsights };
