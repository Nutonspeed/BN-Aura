/**
 * Sales-Customer Ownership System
 * Manages relationship between Sales Reps and their Customers
 * Ensures data isolation and commission tracking
 */

interface SalesRep {
  salesRepId: string;
  name: string;
  clinicId: string;
  clinicName: string;
  email: string;
  phone: string;
  tier: 'junior' | 'senior' | 'lead' | 'manager';
  commissionRate: number;
  totalCustomers: number;
  activeLeads: number;
  monthlyRevenue: number;
}

interface CustomerOwnership {
  customerId: string;
  customerName: string;
  ownedBySalesRepId: string;
  clinicId: string;
  createdAt: string;
  source: 'direct_outreach' | 'referral' | 'walk_in' | 'online';
  status: 'lead' | 'prospect' | 'customer' | 'vip' | 'churned';
  totalSpent: number;
  lastVisit: string;
  analysisCount: number;
  treatmentCount: number;
}

interface CommissionRecord {
  commissionId: string;
  salesRepId: string;
  customerId: string;
  transactionId: string;
  transactionAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'pending' | 'approved' | 'paid';
  createdAt: string;
  paidAt?: string;
}

interface DataIsolationRules {
  ruleId: string;
  description: string;
  enforcement: string;
}

class SalesCustomerOwnership {
  
  /**
   * Get data isolation rules
   */
  static getDataIsolationRules(): DataIsolationRules[] {
    return [
      { ruleId: 'ISO-001', description: 'Sales can only view customers they created', enforcement: 'RLS Policy: customer.created_by = auth.uid()' },
      { ruleId: 'ISO-002', description: 'Customer analysis visible only to owner sales', enforcement: 'RLS Policy: analysis.sales_rep_id = auth.uid()' },
      { ruleId: 'ISO-003', description: 'Commission data private to each sales rep', enforcement: 'RLS Policy: commission.sales_rep_id = auth.uid()' },
      { ruleId: 'ISO-004', description: 'Managers can view all data in their clinic', enforcement: 'RLS Policy: user.clinic_id = customer.clinic_id AND role = manager' },
      { ruleId: 'ISO-005', description: 'Customer transfer requires manager approval', enforcement: 'Workflow: transfer_request → manager_approve → ownership_change' },
      { ruleId: 'ISO-006', description: 'Churned customers can be reassigned after 90 days', enforcement: 'Cron job: auto-release after 90 days inactive' }
    ];
  }

  /**
   * Get sample sales rep data
   */
  static getSalesReps(): SalesRep[] {
    return [
      { salesRepId: 'SALES-001', name: 'คุณสมหญิง พงษ์พานิช', clinicId: 'CLINIC-001', clinicName: 'Elite Beauty Bangkok', email: 'somying@clinic.com', phone: '081-xxx-xxxx', tier: 'senior', commissionRate: 8, totalCustomers: 45, activeLeads: 12, monthlyRevenue: 285000 },
      { salesRepId: 'SALES-002', name: 'คุณวิภา เกษมสุข', clinicId: 'CLINIC-001', clinicName: 'Elite Beauty Bangkok', email: 'wipa@clinic.com', phone: '082-xxx-xxxx', tier: 'lead', commissionRate: 10, totalCustomers: 68, activeLeads: 15, monthlyRevenue: 420000 },
      { salesRepId: 'SALES-003', name: 'คุณณัฐพล ศรีสุข', clinicId: 'CLINIC-002', clinicName: 'Phuket Beauty Center', email: 'nattapol@clinic.com', phone: '083-xxx-xxxx', tier: 'junior', commissionRate: 5, totalCustomers: 22, activeLeads: 8, monthlyRevenue: 125000 }
    ];
  }

  /**
   * Get customer ownership records
   */
  static getCustomerOwnerships(): CustomerOwnership[] {
    return [
      { customerId: 'CUST-001', customerName: 'คุณปิยะดา ธนาวัฒน์', ownedBySalesRepId: 'SALES-001', clinicId: 'CLINIC-001', createdAt: '2024-12-15', source: 'direct_outreach', status: 'vip', totalSpent: 185000, lastVisit: '2025-02-01', analysisCount: 8, treatmentCount: 12 },
      { customerId: 'CUST-002', customerName: 'คุณอารยา วรพัฒน์', ownedBySalesRepId: 'SALES-001', clinicId: 'CLINIC-001', createdAt: '2025-01-05', source: 'referral', status: 'customer', totalSpent: 45000, lastVisit: '2025-02-03', analysisCount: 3, treatmentCount: 4 },
      { customerId: 'CUST-003', customerName: 'คุณกัญญา มงคลชัย', ownedBySalesRepId: 'SALES-002', clinicId: 'CLINIC-001', createdAt: '2025-01-20', source: 'direct_outreach', status: 'prospect', totalSpent: 0, lastVisit: '2025-02-04', analysisCount: 2, treatmentCount: 0 }
    ];
  }

  /**
   * Get commission records
   */
  static getCommissionRecords(salesRepId: string): CommissionRecord[] {
    return [
      { commissionId: 'COM-001', salesRepId: 'SALES-001', customerId: 'CUST-001', transactionId: 'TXN-001', transactionAmount: 35000, commissionRate: 8, commissionAmount: 2800, status: 'paid', createdAt: '2025-01-15', paidAt: '2025-02-01' },
      { commissionId: 'COM-002', salesRepId: 'SALES-001', customerId: 'CUST-001', transactionId: 'TXN-002', transactionAmount: 28000, commissionRate: 8, commissionAmount: 2240, status: 'approved', createdAt: '2025-02-01' },
      { commissionId: 'COM-003', salesRepId: 'SALES-001', customerId: 'CUST-002', transactionId: 'TXN-003', transactionAmount: 15000, commissionRate: 8, commissionAmount: 1200, status: 'pending', createdAt: '2025-02-03' }
    ];
  }

  /**
   * Get ownership transfer workflow
   */
  static getTransferWorkflow(): any {
    return {
      steps: [
        { step: 1, action: 'Sales requests transfer', actor: 'New Sales Rep' },
        { step: 2, action: 'System notifies current owner', actor: 'System' },
        { step: 3, action: 'Manager reviews request', actor: 'Clinic Manager' },
        { step: 4, action: 'Commission split negotiation', actor: 'Both Sales Reps' },
        { step: 5, action: 'Ownership transferred', actor: 'System' }
      ],
      rules: ['Current owner retains past commissions', 'New owner gets future commissions', 'Customer consent required for VIP tier']
    };
  }

  /**
   * Get commission structure
   */
  static getCommissionStructure(): any {
    return {
      tiers: [
        { tier: 'Junior', rate: 5, requirements: '0-20 customers' },
        { tier: 'Senior', rate: 8, requirements: '21-50 customers' },
        { tier: 'Lead', rate: 10, requirements: '51+ customers OR 500K+ monthly' },
        { tier: 'Manager', rate: 12, requirements: 'Team lead + targets' }
      ],
      bonuses: [
        { type: 'New customer', amount: 500 },
        { type: 'VIP conversion', amount: 2000 },
        { type: 'Monthly target 100%', amount: '5% extra' },
        { type: 'Monthly target 150%', amount: '10% extra' }
      ]
    };
  }
}

export { SalesCustomerOwnership, type SalesRep, type CustomerOwnership, type CommissionRecord };
