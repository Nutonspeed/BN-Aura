/**
 * BN-Aura Multi-Clinic Pricing Engine
 */

import { createClient } from '@/lib/supabase/client';

export interface TreatmentPricing {
  id: string;
  clinicId: string;
  treatmentName: string;
  basePrice: number;
  salesCommissionRate: number;
  isActive: boolean;
}

export interface PriceCalculation {
  basePrice: number;
  finalPrice: number;
  salesCommission: number;
  discountAmount: number;
}

export class ClinicPricingEngine {
  private _supabase: ReturnType<typeof createClient> | null = null;

  private get supabase() {
    if (!this._supabase) {
      this._supabase = createClient();
    }
    return this._supabase;
  }

  async getClinicTreatmentPricing(clinicId: string): Promise<TreatmentPricing[]> {
    const { data, error } = await this.supabase
      .from('clinic_treatment_pricing')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  }

  async calculateTreatmentPrice(
    treatmentName: string,
    clinicId: string,
    discountPercentage: number = 0
  ): Promise<PriceCalculation> {
    const { data, error } = await this.supabase
      .from('clinic_treatment_pricing')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('treatment_name', treatmentName)
      .single();

    if (error || !data) throw new Error('Treatment not found');

    const basePrice = data.base_price;
    const discountAmount = (basePrice * discountPercentage) / 100;
    const finalPrice = basePrice - discountAmount;
    const salesCommission = (finalPrice * data.sales_commission_rate) / 100;

    return { basePrice, finalPrice, salesCommission, discountAmount };
  }

  async setTreatmentPricing(
    clinicId: string,
    treatmentName: string,
    basePrice: number,
    salesCommissionRate: number = 10
  ): Promise<void> {
    const { error } = await this.supabase
      .from('clinic_treatment_pricing')
      .upsert({
        clinic_id: clinicId,
        treatment_name: treatmentName,
        base_price: basePrice,
        sales_commission_rate: salesCommissionRate,
        is_active: true
      });

    if (error) throw error;
  }

  async recordCommission(
    salesStaffId: string,
    customerId: string,
    treatmentName: string,
    amount: number,
    commissionRate: number,
    clinicId: string
  ): Promise<string> {
    const commissionAmount = (amount * commissionRate) / 100;

    const { data, error } = await this.supabase
      .from('sales_commissions')
      .insert({
        clinic_id: clinicId,
        sales_staff_id: salesStaffId,
        customer_id: customerId,
        transaction_type: treatmentName,
        base_amount: amount,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        payment_status: 'pending'
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error recording commission:', error);
      throw new Error(`Failed to record commission: ${error.message}`);
    }

    return data.id;
  }

  /**
   * Get sales commission summary for a staff member
   */
  async getSalesCommissionSummary(salesStaffId: string, period: 'monthly' | 'weekly' | 'daily' = 'monthly'): Promise<{
    totalCommission: number;
    pendingCommission: number;
    paidCommission: number;
    transactionCount: number;
    averageCommission: number;
  }> {
    try {
      let dateFilter = '';
      const now = new Date();
      
      switch (period) {
        case 'daily':
          dateFilter = now.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateFilter = weekAgo.toISOString().split('T')[0];
          break;
        case 'monthly':
          const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
          dateFilter = monthAgo.toISOString().split('T')[0];
          break;
      }

      const { data, error } = await this.supabase
        .from('sales_commissions')
        .select('commission_amount, payment_status')
        .eq('sales_staff_id', salesStaffId)
        .gte('created_at', dateFilter);

      if (error) throw error;

      const commissions = data || [];
      const totalCommission = commissions.reduce((sum, c) => sum + c.commission_amount, 0);
      const pendingCommission = commissions
        .filter(c => c.payment_status === 'pending')
        .reduce((sum, c) => sum + c.commission_amount, 0);
      const paidCommission = commissions
        .filter(c => c.payment_status === 'paid')
        .reduce((sum, c) => sum + c.commission_amount, 0);

      return {
        totalCommission,
        pendingCommission,
        paidCommission,
        transactionCount: commissions.length,
        averageCommission: commissions.length > 0 ? totalCommission / commissions.length : 0
      };
    } catch (error) {
      console.error('Error getting commission summary:', error);
      throw error;
    }
  }
}

export const pricingEngine = new ClinicPricingEngine();
