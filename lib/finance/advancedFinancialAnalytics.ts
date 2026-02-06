/**
 * Advanced Financial Reporting System
 */

interface FinancialTransaction {
  id: string;
  customerId: string;
  clinicId: string;
  serviceId: string;
  serviceName: string;
  date: string;
  revenue: number;
  directCosts: number;
  laborCosts: number;
  overheadCosts: number;
  netProfit: number;
  profitMargin: number;
}

interface ProfitLossReport {
  reportId: string;
  clinicId: string;
  period: { start: string; end: string; type: string };
  summary: {
    totalRevenue: number;
    totalCosts: number;
    netProfit: number;
    overallMargin: number;
    transactionCount: number;
  };
  breakdown: {
    byCustomer: CustomerProfitAnalysis[];
    byService: ServiceProfitAnalysis[];
  };
}

interface CustomerProfitAnalysis {
  customerId: string;
  customerName: string;
  totalRevenue: number;
  netProfit: number;
  profitMargin: number;
  serviceCount: number;
  lifetimeValue: number;
  profitability: 'high' | 'medium' | 'low' | 'negative';
}

interface ServiceProfitAnalysis {
  serviceId: string;
  serviceName: string;
  totalRevenue: number;
  netProfit: number;
  profitMargin: number;
  volumeSold: number;
  profitPerUnit: number;
}

class AdvancedFinancialAnalytics {
  private static transactions: Map<string, FinancialTransaction> = new Map();
  private static reports: Map<string, ProfitLossReport> = new Map();

  static recordTransaction(
    customerId: string,
    clinicId: string, 
    serviceId: string,
    serviceName: string,
    revenue: number
  ): string {
    const transactionId = `fin_${Date.now()}`;
    
    // Calculate costs (mock percentages)
    const directCosts = revenue * 0.35;   // 35% materials
    const laborCosts = revenue * 0.25;    // 25% labor
    const overheadCosts = revenue * 0.15; // 15% overhead
    const totalCosts = directCosts + laborCosts + overheadCosts;
    const netProfit = revenue - totalCosts;
    const profitMargin = (netProfit / revenue) * 100;

    const transaction: FinancialTransaction = {
      id: transactionId,
      customerId,
      clinicId,
      serviceId,
      serviceName,
      date: new Date().toISOString(),
      revenue,
      directCosts,
      laborCosts,
      overheadCosts,
      netProfit,
      profitMargin
    };

    this.transactions.set(transactionId, transaction);
    return transactionId;
  }

  static generateProfitLossReport(
    clinicId: string,
    startDate: string,
    endDate: string
  ): ProfitLossReport {
    const reportId = `report_${Date.now()}`;
    
    const clinicTransactions = Array.from(this.transactions.values())
      .filter(t => 
        t.clinicId === clinicId &&
        new Date(t.date) >= new Date(startDate) &&
        new Date(t.date) <= new Date(endDate)
      );

    const totalRevenue = clinicTransactions.reduce((sum, t) => sum + t.revenue, 0);
    const totalCosts = clinicTransactions.reduce((sum, t) => 
      sum + t.directCosts + t.laborCosts + t.overheadCosts, 0);
    const netProfit = totalRevenue - totalCosts;
    const overallMargin = (netProfit / totalRevenue) * 100;

    const report: ProfitLossReport = {
      reportId,
      clinicId,
      period: { start: startDate, end: endDate, type: 'custom' },
      summary: {
        totalRevenue,
        totalCosts,
        netProfit,
        overallMargin,
        transactionCount: clinicTransactions.length
      },
      breakdown: {
        byCustomer: this.analyzeByCustomer(clinicTransactions),
        byService: this.analyzeByService(clinicTransactions)
      }
    };

    this.reports.set(reportId, report);
    return report;
  }

  static getReport(reportId: string): ProfitLossReport | null {
    return this.reports.get(reportId) || null;
  }

  static getTransactions(): FinancialTransaction[] {
    return Array.from(this.transactions.values());
  }

  private static analyzeByCustomer(transactions: FinancialTransaction[]): CustomerProfitAnalysis[] {
    const customerMap = new Map<string, FinancialTransaction[]>();
    
    transactions.forEach(t => {
      const customerTxns = customerMap.get(t.customerId) || [];
      customerTxns.push(t);
      customerMap.set(t.customerId, customerTxns);
    });

    return Array.from(customerMap.entries()).map(([customerId, txns]) => {
      const totalRevenue = txns.reduce((sum, t) => sum + t.revenue, 0);
      const netProfit = txns.reduce((sum, t) => sum + t.netProfit, 0);
      const profitMargin = (netProfit / totalRevenue) * 100;
      
      let profitability: 'high' | 'medium' | 'low' | 'negative';
      if (profitMargin < 0) profitability = 'negative';
      else if (profitMargin >= 30) profitability = 'high';
      else if (profitMargin >= 15) profitability = 'medium';
      else profitability = 'low';

      return {
        customerId,
        customerName: `Customer ${customerId.slice(-6)}`,
        totalRevenue,
        netProfit,
        profitMargin,
        serviceCount: txns.length,
        lifetimeValue: totalRevenue * 2.5, // Mock CLV calculation
        profitability
      };
    });
  }

  private static analyzeByService(transactions: FinancialTransaction[]): ServiceProfitAnalysis[] {
    const serviceMap = new Map<string, FinancialTransaction[]>();
    
    transactions.forEach(t => {
      const serviceTxns = serviceMap.get(t.serviceId) || [];
      serviceTxns.push(t);
      serviceMap.set(t.serviceId, serviceTxns);
    });

    return Array.from(serviceMap.entries()).map(([serviceId, txns]) => {
      const totalRevenue = txns.reduce((sum, t) => sum + t.revenue, 0);
      const netProfit = txns.reduce((sum, t) => sum + t.netProfit, 0);
      const profitMargin = (netProfit / totalRevenue) * 100;
      const volumeSold = txns.length;
      const profitPerUnit = netProfit / volumeSold;

      return {
        serviceId,
        serviceName: txns[0].serviceName,
        totalRevenue,
        netProfit,
        profitMargin,
        volumeSold,
        profitPerUnit
      };
    });
  }
}

export { AdvancedFinancialAnalytics, type ProfitLossReport, type CustomerProfitAnalysis };
