/**
 * Advanced Sales Analytics System
 */

interface SalesMetrics {
  salesPersonId: string;
  consultations: number;
  bookings: number;
  revenue: number;
  conversionRate: number;
  averageOrderValue: number;
}

interface ConversionFunnel {
  stage: string;
  count: number;
  conversionRate: number;
}

interface CustomerJourney {
  customerId: string;
  touchpoints: { stage: string; channel: string; timestamp: string }[];
}

interface SalesReport {
  totalRevenue: number;
  totalBookings: number;
  topTreatments: { name: string; revenue: number }[];
  topSalesStaff: { name: string; revenue: number }[];
}

class AdvancedSalesAnalytics {
  static trackPerformance(salesPersonId: string, data: any): SalesMetrics {
    const conversionRate = data.bookings > 0 ? (data.bookings / data.consultations) * 100 : 0;
    const averageOrderValue = data.bookings > 0 ? data.revenue / data.bookings : 0;
    
    return {
      salesPersonId,
      consultations: data.consultations || 0,
      bookings: data.bookings || 0,
      revenue: data.revenue || 0,
      conversionRate,
      averageOrderValue
    };
  }

  static analyzeConversionFunnel(): ConversionFunnel[] {
    return [
      { stage: 'Awareness', count: 1000, conversionRate: 100 },
      { stage: 'Interest', count: 650, conversionRate: 65 },
      { stage: 'Consultation', count: 280, conversionRate: 28 },
      { stage: 'Booking', count: 190, conversionRate: 19 },
      { stage: 'Treatment', count: 175, conversionRate: 17.5 }
    ];
  }

  static mapCustomerJourney(customerId: string, touchpoints: any[]): CustomerJourney {
    return {
      customerId,
      touchpoints: touchpoints.map(tp => ({
        stage: tp.stage,
        channel: tp.channel,
        timestamp: tp.timestamp
      }))
    };
  }

  static generateSalesReport(): SalesReport {
    return {
      totalRevenue: 2850000,
      totalBookings: 185,
      topTreatments: [
        { name: 'Laser Hair Removal', revenue: 890000 },
        { name: 'Botox Injections', revenue: 675000 }
      ],
      topSalesStaff: [
        { name: 'คุณสมชาย', revenue: 580000 },
        { name: 'คุณสมหญิง', revenue: 520000 }
      ]
    };
  }
}

export { AdvancedSalesAnalytics, type SalesMetrics, type ConversionFunnel };
