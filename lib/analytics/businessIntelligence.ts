/**
 * BN-Aura Business Intelligence Engine
 * Processes data for clinic executive dashboards and predictive analytics
 */

import { createClient } from '@/lib/supabase/client';

export interface RevenueMetric {
  date: string;
  amount: number;
  treatmentType: string;
}

export interface StaffPerformance {
  staffId: string;
  staffName: string;
  totalSales: number;
  conversionRate: number;
  customerSatisfaction: number;
}

export interface CustomerRetention {
  period: string;
  newCustomers: number;
  repeatCustomers: number;
  churnRate: number;
}

interface CommissionRecord {
  base_amount: number;
  commission_amount: number;
}

interface StaffData {
  id: string;
  name: string;
  role: string;
  sales_commissions: CommissionRecord[];
}

interface CustomerCommissionRecord {
  base_amount: number;
}

interface CustomerData {
  id: string;
  created_at: string;
  sales_commissions: CustomerCommissionRecord[];
}

interface RevenueTransaction {
  base_amount: number;
  transaction_date: string;
  transaction_type: string;
}

interface RevenueForecastTransaction {
  base_amount: number;
  transaction_date: string;
}

export class BusinessIntelligence {
  private supabase = createClient();

  /**
   * Get revenue analytics by period
   */
  async getRevenueAnalytics(clinicId: string) {
    try {
      const { data, error } = await this.supabase
        .from('sales_commissions')
        .select('base_amount, transaction_date, transaction_type')
        .eq('clinic_id', clinicId)
        .eq('payment_status', 'paid');

      if (error) throw error;

      // Group and process data for Recharts
      return this.processRevenueData((data as unknown as RevenueTransaction[]) || []);
    } catch (error) {
      console.error('Error fetching revenue analytics:', error);
      return [];
    }
  }

  /**
   * Get staff performance metrics
   */
  async getStaffPerformance(clinicId: string) {
    try {
      const { data, error } = await this.supabase
        .from('clinic_staff')
        .select(`
          id,
          name,
          role,
          sales_commissions (
            base_amount,
            commission_amount
          )
        `)
        .eq('clinic_id', clinicId);

      if (error) throw error;

      const staffMembers = (data as unknown as StaffData[]) || [];

      return staffMembers.map(staff => ({
        id: staff.id,
        name: staff.name,
        role: staff.role,
        totalSales: staff.sales_commissions?.reduce((sum: number, c: CommissionRecord) => sum + (c.base_amount || 0), 0) || 0,
        totalCommission: staff.sales_commissions?.reduce((sum: number, c: CommissionRecord) => sum + (c.commission_amount || 0), 0) || 0,
        dealCount: staff.sales_commissions?.length || 0
      }));
    } catch (error) {
      console.error('Error fetching staff performance:', error);
      return [];
    }
  }

  /**
   * Get customer lifetime value and retention stats
   */
  async getCustomerInsights(clinicId: string) {
    try {
      const { data, error } = await this.supabase
        .from('customers')
        .select(`
          id,
          created_at,
          sales_commissions (
            base_amount
          )
        `)
        .eq('clinic_id', clinicId);

      if (error) throw error;

      const customers = (data as unknown as CustomerData[]) || [];
      const totalRevenue = customers.reduce((sum, c) => 
        sum + (c.sales_commissions?.reduce((s: number, comm: CustomerCommissionRecord) => s + (comm.base_amount || 0), 0) || 0), 0);
      
      const avgLTV = customers.length > 0 ? totalRevenue / customers.length : 0;

      return {
        totalCustomers: customers.length,
        averageLTV: avgLTV,
        retentionRate: 85, // Mock for now
        growthTrend: '+12%' // Mock for now
      };
    } catch (error) {
      console.error('Error fetching customer insights:', error);
      return null;
    }
  }

  /**
   * Get predictive analytics for revenue and inventory
   */
  async getPredictiveAnalytics(clinicId: string) {
    try {
      // 1. Fetch historical revenue for the last 6 months
      const { data: revenueData } = await this.supabase
        .from('sales_commissions')
        .select('base_amount, transaction_date')
        .eq('clinic_id', clinicId)
        .eq('payment_status', 'paid')
        .order('transaction_date', { ascending: true });

      // 2. Fetch inventory levels
      const { data: inventoryData } = await this.supabase
        .from('inventory_products')
        .select('name, stock_quantity, min_stock_level')
        .eq('clinic_id', clinicId);

      // Simple forecasting logic
      const forecastedRevenue = this.calculateRevenueForecast((revenueData as unknown as RevenueForecastTransaction[]) || []);
      const inventoryRisk = this.calculateInventoryRisk((inventoryData as unknown as Array<{ name: string; stock_quantity: number; min_stock_level: number }>) || []);

      return {
        revenueForecast: forecastedRevenue,
        inventoryForecasting: inventoryRisk,
        confidenceScore: 0.85,
        analysisTimestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching predictive analytics:', error);
      return null;
    }
  }

  private calculateRevenueForecast(data: RevenueForecastTransaction[]) {
    if (data.length < 5) return { nextMonth: 'Insufficient Data', trend: 'Stable' };

    // Group by month
    const monthlyData = new Map<number, number>();
    data.forEach(item => {
      const month = new Date(item.transaction_date).getMonth();
      const current = monthlyData.get(month) || 0;
      monthlyData.set(month, current + item.base_amount);
    });

    const values = Array.from(monthlyData.values());
    const lastValue = values[values.length - 1];
    const secondLastValue = values[values.length - 2];
    
    // Simple growth rate
    const growthRate = (lastValue - secondLastValue) / secondLastValue;
    const forecasted = lastValue * (1 + growthRate);

    return {
      nextMonth: Math.round(forecasted),
      projectedGrowth: (growthRate * 100).toFixed(1) + '%',
      trend: growthRate > 0 ? 'Bullish' : 'Consolidating'
    };
  }

  private calculateInventoryRisk(data: Array<{ name: string; stock_quantity: number; min_stock_level: number }>) {
    return (data || []).map(item => {
      const burnRate = Math.floor(Math.random() * 5) + 1; // Mock consumption rate
      const daysRemaining = Math.floor(item.stock_quantity / burnRate);
      
      return {
        name: item.name,
        daysRemaining,
        riskLevel: daysRemaining < 7 ? 'Critical' : daysRemaining < 14 ? 'High' : 'Low'
      };
    }).filter(item => item.riskLevel !== 'Low');
  }

  private processRevenueData(data: RevenueTransaction[]) {
    // Process raw SQL data into Recharts friendly format
    const grouped = new Map<string, number>();
    
    data.forEach(item => {
      const date = new Date(item.transaction_date).toLocaleDateString();
      const current = grouped.get(date) || 0;
      grouped.set(date, current + item.base_amount);
    });

    return Array.from(grouped.entries()).map(([date, amount]) => ({
      name: date,
      revenue: amount
    })).slice(-7); // Return last 7 entries for the chart
  }
}

export const biEngine = new BusinessIntelligence();
