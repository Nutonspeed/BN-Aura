/**
 * Executive Financial Dashboard System
 */

interface FinancialKPIs {
  grossProfitMargin: number;
  netProfitMargin: number;
  currentRatio: number;
  burnRate: number;
  revenueGrowth: number;
}

interface CashFlowData {
  month: string;
  cashIn: number;
  cashOut: number;
  netFlow: number;
  balance: number;
}

interface FinancialAlert {
  type: 'warning' | 'critical';
  message: string;
  impact: 'high' | 'medium' | 'low';
}

class ExecutiveFinanceDashboard {
  static getFinancialOverview(clinicId: string) {
    return {
      kpis: this.calculateKPIs(),
      cashFlow: this.getCashFlowData(),
      alerts: this.getFinancialAlerts(),
      forecast: this.getRevenueForecast()
    };
  }

  private static calculateKPIs(): FinancialKPIs {
    return {
      grossProfitMargin: 68.5,
      netProfitMargin: 22.3,
      currentRatio: 2.1,
      burnRate: 35000,
      revenueGrowth: 8.5
    };
  }

  private static getCashFlowData(): CashFlowData[] {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, i) => ({
      month,
      cashIn: 180000 + (i * 5000),
      cashOut: 120000 + (i * 2000),
      netFlow: 60000 + (i * 3000),
      balance: 500000 + ((i + 1) * 60000)
    }));
  }

  private static getFinancialAlerts(): FinancialAlert[] {
    return [
      {
        type: 'warning',
        message: 'Marketing expenses increased 15% this month',
        impact: 'medium'
      },
      {
        type: 'critical', 
        message: 'Cash flow projected to be negative next quarter',
        impact: 'high'
      }
    ];
  }

  private static getRevenueForecast() {
    return [210000, 225000, 240000, 255000, 270000, 285000];
  }
}

export { ExecutiveFinanceDashboard, type FinancialKPIs, type CashFlowData };
