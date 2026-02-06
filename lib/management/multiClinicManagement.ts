/**
 * Multi-Clinic Management System
 */

interface ClinicLocation {
  clinicId: string;
  clinicName: string;
  franchiseType: 'owned' | 'franchised';
  location: { city: string; province: string };
  status: 'active' | 'inactive';
  manager: { name: string; email: string };
}

interface FranchiseAgreement {
  agreementId: string;
  clinicId: string;
  royaltyRate: number;
  monthlyFee: number;
  status: 'active' | 'expired';
}

interface CrossClinicReport {
  reportId: string;
  clinics: string[];
  totalRevenue: number;
  totalBookings: number;
  topPerformer: string;
}

interface CentralizedCustomer {
  customerId: string;
  profile: { name: string; email: string; phone: string };
  totalSpent: number;
  totalVisits: number;
  membershipLevel: 'bronze' | 'silver' | 'gold' | 'platinum';
  lastClinicVisit: string;
}

class MultiClinicManagement {
  private static clinics: Map<string, ClinicLocation> = new Map();
  private static customers: Map<string, CentralizedCustomer> = new Map();

  static registerClinic(clinicData: any): ClinicLocation {
    const clinicId = `clinic_${Date.now()}`;
    const clinic: ClinicLocation = { ...clinicData, clinicId };
    this.clinics.set(clinicId, clinic);
    return clinic;
  }

  static createFranchise(clinicId: string, royaltyRate: number): FranchiseAgreement {
    return {
      agreementId: `franchise_${Date.now()}`,
      clinicId,
      royaltyRate,
      monthlyFee: 50000,
      status: 'active'
    };
  }

  static generateCrossClinicReport(clinicIds: string[]): CrossClinicReport {
    return {
      reportId: `report_${Date.now()}`,
      clinics: clinicIds,
      totalRevenue: 2850000,
      totalBookings: 185,
      topPerformer: clinicIds[0] || 'clinic_001'
    };
  }

  static centralizeCustomer(customerData: any): CentralizedCustomer {
    const customer: CentralizedCustomer = {
      customerId: `central_${Date.now()}`,
      profile: customerData.profile,
      totalSpent: customerData.totalSpent || 0,
      totalVisits: customerData.totalVisits || 0,
      membershipLevel: 'bronze',
      lastClinicVisit: customerData.lastClinic || ''
    };
    
    this.customers.set(customer.customerId, customer);
    return customer;
  }

  static getNetworkOverview(): any {
    return {
      totalClinics: this.clinics.size,
      totalCustomers: this.customers.size,
      networkRevenue: 5700000,
      averagePerformance: 85
    };
  }
}

export { MultiClinicManagement, type ClinicLocation, type CentralizedCustomer };
