/**
 * Feature Roadmap Management System
 * Strategic feature planning and development tracking
 */

interface RoadmapItem {
  featureId: string;
  title: string;
  description: string;
  category: 'ai' | 'booking' | 'analytics' | 'integration' | 'mobile' | 'admin';
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'planned' | 'in_development' | 'testing' | 'released';
  quarter: string;
  requestedBy: number;
  impactScore: number;
  effortDays: number;
}

interface RoadmapQuarter {
  quarter: string;
  theme: string;
  features: RoadmapItem[];
  capacity: number;
  allocated: number;
}

class FeatureRoadmapSystem {
  /**
   * Get current roadmap
   */
  static getCurrentRoadmap(): RoadmapQuarter[] {
    return [
      {
        quarter: 'Q2 2025',
        theme: 'AI Enhancement & Scale',
        capacity: 100,
        allocated: 85,
        features: [
          { featureId: 'F-2025-001', title: 'AI Skin Analysis v2', description: 'Enhanced skin analysis with 50+ conditions', category: 'ai', priority: 'critical', status: 'in_development', quarter: 'Q2 2025', requestedBy: 45, impactScore: 95, effortDays: 30 },
          { featureId: 'F-2025-002', title: 'Multi-location Dashboard', description: 'Unified view for clinic chains', category: 'admin', priority: 'high', status: 'in_development', quarter: 'Q2 2025', requestedBy: 28, impactScore: 85, effortDays: 25 },
          { featureId: 'F-2025-003', title: 'WhatsApp Integration', description: 'Booking via WhatsApp Business', category: 'integration', priority: 'high', status: 'planned', quarter: 'Q2 2025', requestedBy: 62, impactScore: 88, effortDays: 20 }
        ]
      },
      {
        quarter: 'Q3 2025',
        theme: 'Customer Experience',
        capacity: 100,
        allocated: 70,
        features: [
          { featureId: 'F-2025-004', title: 'Customer Mobile App', description: 'Native iOS/Android app for customers', category: 'mobile', priority: 'critical', status: 'planned', quarter: 'Q3 2025', requestedBy: 85, impactScore: 92, effortDays: 45 },
          { featureId: 'F-2025-005', title: 'Loyalty Program', description: 'Points and rewards system', category: 'booking', priority: 'high', status: 'planned', quarter: 'Q3 2025', requestedBy: 55, impactScore: 78, effortDays: 20 },
          { featureId: 'F-2025-006', title: 'Advanced Reporting', description: 'Custom report builder', category: 'analytics', priority: 'medium', status: 'planned', quarter: 'Q3 2025', requestedBy: 38, impactScore: 72, effortDays: 15 }
        ]
      },
      {
        quarter: 'Q4 2025',
        theme: 'Enterprise & Expansion',
        capacity: 100,
        allocated: 55,
        features: [
          { featureId: 'F-2025-007', title: 'API Marketplace', description: 'Third-party integrations hub', category: 'integration', priority: 'high', status: 'planned', quarter: 'Q4 2025', requestedBy: 32, impactScore: 82, effortDays: 35 },
          { featureId: 'F-2025-008', title: 'AI Treatment Planner', description: 'Long-term treatment recommendations', category: 'ai', priority: 'high', status: 'planned', quarter: 'Q4 2025', requestedBy: 48, impactScore: 88, effortDays: 28 }
        ]
      }
    ];
  }

  /**
   * Get feature requests from customers
   */
  static getFeatureRequests(): any {
    return {
      totalRequests: 156,
      topRequests: [
        { title: 'Customer Mobile App', votes: 85, status: 'Planned Q3' },
        { title: 'WhatsApp Integration', votes: 62, status: 'Planned Q2' },
        { title: 'Loyalty Program', votes: 55, status: 'Planned Q3' },
        { title: 'AI Treatment Planner', votes: 48, status: 'Planned Q4' },
        { title: 'Multi-language Support', votes: 42, status: 'Under Review' }
      ],
      categorySummary: { ai: 35, mobile: 28, integration: 32, analytics: 25, booking: 22, admin: 14 }
    };
  }

  /**
   * Get development velocity
   */
  static getDevelopmentVelocity(): any {
    return {
      avgVelocity: 85,
      lastQuarter: { planned: 12, completed: 11, onTime: 92 },
      currentQuarter: { planned: 8, inProgress: 3, completed: 2 },
      teamCapacity: { developers: 8, designers: 2, qa: 3 }
    };
  }

  /**
   * Get roadmap executive summary
   */
  static getExecutiveSummary(): any {
    return {
      headline: 'Feature Roadmap: On Track',
      currentFocus: 'Q2 2025 - AI Enhancement & Scale',
      keyFeatures: ['AI Skin Analysis v2', 'Multi-location Dashboard', 'WhatsApp Integration'],
      upcomingMilestones: [
        { date: 'Apr 2025', milestone: 'AI Skin Analysis v2 Release' },
        { date: 'May 2025', milestone: 'WhatsApp Integration Beta' },
        { date: 'Jul 2025', milestone: 'Customer Mobile App Launch' }
      ],
      customerImpact: '85+ clinics requesting top features'
    };
  }
}

export { FeatureRoadmapSystem, type RoadmapItem, type RoadmapQuarter };
