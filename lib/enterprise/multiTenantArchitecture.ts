/**
 * Enterprise Multi-Tenant Architecture
 * Support for large clinic chains with multiple locations
 */

interface Organization {
  orgId: string;
  name: string;
  tier: 'enterprise' | 'enterprise_plus' | 'strategic';
  locations: number;
  totalStaff: number;
  mrr: number;
  contractValue: number;
  accountManager: string;
  features: string[];
}

interface LocationHierarchy {
  orgId: string;
  headquarters: Location;
  regions: Region[];
  totalLocations: number;
}

interface Location {
  locationId: string;
  name: string;
  address: string;
  staff: number;
  monthlyBookings: number;
  revenue: number;
}

interface Region {
  regionId: string;
  name: string;
  locations: Location[];
  manager: string;
}

interface EnterpriseMetrics {
  totalOrganizations: number;
  totalLocations: number;
  enterpriseMRR: number;
  avgLocationsPerOrg: number;
  avgContractValue: number;
  renewalRate: number;
}

class MultiTenantArchitecture {
  /**
   * Get enterprise organizations
   */
  static getOrganizations(): Organization[] {
    return [
      { orgId: 'ORG-001', name: 'Bangkok Beauty Group', tier: 'enterprise_plus', locations: 12, totalStaff: 85, mrr: 359880, contractValue: 4318560, accountManager: 'Somchai P.', features: ['Multi-location', 'Custom branding', 'API access', 'Dedicated support', 'SLA 99.9%'] },
      { orgId: 'ORG-002', name: 'Siam Aesthetic Chain', tier: 'enterprise', locations: 8, totalStaff: 52, mrr: 239920, contractValue: 2879040, accountManager: 'Nattaya K.', features: ['Multi-location', 'Custom branding', 'API access', 'Priority support'] },
      { orgId: 'ORG-003', name: 'Royal Skin Clinics', tier: 'enterprise', locations: 6, totalStaff: 38, mrr: 179940, contractValue: 2159280, accountManager: 'Prasert W.', features: ['Multi-location', 'Custom branding', 'API access'] },
      { orgId: 'ORG-004', name: 'Premium Care Network', tier: 'strategic', locations: 15, totalStaff: 120, mrr: 599700, contractValue: 7196400, accountManager: 'Waraporn S.', features: ['Multi-location', 'White-label', 'Full API', 'Dedicated team', 'Custom development', 'SLA 99.99%'] }
    ];
  }

  /**
   * Get location hierarchy for an organization
   */
  static getLocationHierarchy(orgId: string): LocationHierarchy {
    return {
      orgId: 'ORG-001',
      headquarters: { locationId: 'LOC-001', name: 'Bangkok Beauty HQ - Siam', address: 'Siam Paragon, Bangkok', staff: 15, monthlyBookings: 850, revenue: 2125000 },
      regions: [
        { regionId: 'REG-BKK', name: 'Bangkok Region', manager: 'Apinya T.', locations: [
          { locationId: 'LOC-002', name: 'Bangkok Beauty - Thonglor', address: 'Thonglor, Bangkok', staff: 8, monthlyBookings: 520, revenue: 1300000 },
          { locationId: 'LOC-003', name: 'Bangkok Beauty - Silom', address: 'Silom, Bangkok', staff: 7, monthlyBookings: 480, revenue: 1200000 },
          { locationId: 'LOC-004', name: 'Bangkok Beauty - Ari', address: 'Ari, Bangkok', staff: 6, monthlyBookings: 420, revenue: 1050000 }
        ]},
        { regionId: 'REG-CENTRAL', name: 'Central Region', manager: 'Boonsri K.', locations: [
          { locationId: 'LOC-005', name: 'Bangkok Beauty - Pattaya', address: 'Pattaya, Chonburi', staff: 5, monthlyBookings: 380, revenue: 950000 },
          { locationId: 'LOC-006', name: 'Bangkok Beauty - Hua Hin', address: 'Hua Hin, Prachuap', staff: 4, monthlyBookings: 320, revenue: 800000 }
        ]}
      ],
      totalLocations: 12
    };
  }

  /**
   * Get enterprise metrics
   */
  static getEnterpriseMetrics(): EnterpriseMetrics {
    return {
      totalOrganizations: 4,
      totalLocations: 41,
      enterpriseMRR: 1379440,
      avgLocationsPerOrg: 10.25,
      avgContractValue: 4138320,
      renewalRate: 98.5
    };
  }

  /**
   * Get enterprise features matrix
   */
  static getFeaturesMatrix(): any {
    return {
      tiers: [
        { tier: 'Enterprise', price: 29990, features: ['Up to 10 locations', 'Custom branding', 'API access (5K/day)', 'Priority support', 'Monthly reviews'] },
        { tier: 'Enterprise Plus', price: 29990, features: ['Up to 25 locations', 'Custom branding', 'API access (20K/day)', 'Dedicated support', '99.9% SLA', 'Weekly reviews'] },
        { tier: 'Strategic', price: 'Custom', features: ['Unlimited locations', 'White-label option', 'Full API access', 'Dedicated team', 'Custom development', '99.99% SLA', 'Daily reviews'] }
      ],
      addOns: [
        { name: 'Additional Location', price: 4990 },
        { name: 'Custom Integration', price: 'Quote' },
        { name: 'On-site Training', price: 25000 },
        { name: 'Dedicated Support Agent', price: 45000 }
      ]
    };
  }

  /**
   * Get executive summary
   */
  static getExecutiveSummary(): any {
    return {
      headline: 'Enterprise Segment: High-Value Growth',
      organizations: 4,
      locations: 41,
      enterpriseMRR: 'THB 1,379,440',
      percentageOfRevenue: '62%',
      avgContractValue: 'THB 4.1M',
      renewalRate: '98.5%',
      pipeline: '3 prospects (18 locations)',
      keyAccounts: ['Bangkok Beauty Group (12 loc)', 'Premium Care Network (15 loc)']
    };
  }
}

export { MultiTenantArchitecture, type Organization, type EnterpriseMetrics };
