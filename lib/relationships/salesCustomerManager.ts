/**
 * Sales-Customer Relationship Manager
 */

import { createClient } from '@/lib/supabase/client';

export interface CustomerWithSales {
  id: string;
  name: string;
  email: string;
  assignedSales: {
    id: string;
    name: string;
  } | null;
  totalSpent: number;
}

export class SalesCustomerManager {
  private supabase = createClient();

  async getOrCreateCustomer(data: {
    name: string;
    phone: string;
    clinicId: string;
    email?: string;
    age?: number;
  }): Promise<string> {
    // 1. Check if customer exists by phone in this clinic
    const { data: existing } = await this.supabase
      .from('customers')
      .select('id')
      .eq('phone', data.phone)
      .eq('clinic_id', data.clinicId)
      .single();

    if (existing) return existing.id;

    // 2. Create new customer
    const { data: created, error } = await this.supabase
      .from('customers')
      .insert({
        full_name: data.name,
        phone: data.phone,
        email: data.email,
        clinic_id: data.clinicId,
        metadata: { age: data.age },
        status: 'lead'
      })
      .select('id')
      .single();

    if (error) throw error;
    return created.id;
  }

  async assignCustomerToSales(customerId: string, salesStaffId: string): Promise<void> {
    const { error } = await this.supabase
      .from('customers')
      .update({
        assigned_sales_id: salesStaffId,
        assignment_date: new Date().toISOString()
      })
      .eq('id', customerId);

    if (error) throw error;
  }

  async getCustomersForSales(salesStaffId: string): Promise<CustomerWithSales[]> {
    // Query users table where role='free_user' and metadata.sales_staff_id matches
    const { data, error } = await this.supabase
      .from('users')
      .select(`
        id, full_name, email, metadata, created_at
      `)
      .eq('role', 'free_user')
      .filter('metadata->>sales_staff_id', 'eq', salesStaffId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((user: any) => ({
      id: user.id,
      name: user.full_name || 'Unknown Customer',
      email: user.email || '',
      phone: user.metadata?.phone || '',
      assignedSales: {
        id: salesStaffId,
        name: 'Current Sales Rep',
        email: ''
      },
      totalSpent: 0, // Calculated from transaction history
      lastContactDate: user.created_at
    }));
  }

  async getSalesRepForCustomer(customerId: string): Promise<{ id: string; name: string; email: string; phone: string } | null> {
    const { data, error } = await this.supabase
      .from('customers')
      .select('assigned_sales_id')
      .eq('id', customerId)
      .single();

    if (error || !data?.assigned_sales_id) return null;

    // Get sales rep info from users table
    const { data: userData } = await this.supabase
      .from('users')
      .select('id, full_name, email, phone')
      .eq('id', data.assigned_sales_id)
      .single();

    if (!userData) return null;

    return {
      id: userData.id,
      name: userData.full_name || 'Unknown Sales Rep',
      email: userData.email || '',
      phone: userData.phone || ''
    };
  }

  async autoAssignCustomer(customerId: string, clinicId: string): Promise<string> {
    const { data: salesStaff } = await this.supabase
      .from('clinic_staff')
      .select('user_id')
      .eq('clinic_id', clinicId)
      .eq('role', 'sales_staff')
      .limit(1);

    if (!salesStaff?.[0]) throw new Error('No sales staff available');

    await this.assignCustomerToSales(customerId, salesStaff[0].user_id);
    return salesStaff[0].user_id;
  }
}

export const salesCustomerManager = new SalesCustomerManager();
