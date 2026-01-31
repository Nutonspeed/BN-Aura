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
    const { data, error } = await this.supabase
      .from('customers')
      .select(`
        id, full_name, email,
        clinic_staff!customers_assigned_sales_id_fkey (id, name)
      `)
      .eq('assigned_sales_id', salesStaffId);

    if (error) throw error;

    return (data || []).map((customer: { id: string; full_name: string; email: string; clinic_staff: { id: string; name: string }[] | null }) => {
      const staff = customer.clinic_staff?.[0] || null;
      return {
        id: customer.id,
        name: customer.full_name,
        email: customer.email,
        assignedSales: staff ? {
          id: staff.id,
          name: staff.name
        } : null,
        totalSpent: 0 // TODO: Calculate from commissions if needed
      };
    });
  }

  async getSalesRepForCustomer(customerId: string): Promise<{ id: string; name: string; email: string; phone: string } | null> {
    const { data, error } = await this.supabase
      .from('customers')
      .select(`
        clinic_staff!customers_assigned_sales_id_fkey (
          id,
          name,
          email,
          phone
        )
      `)
      .eq('id', customerId)
      .single();

    if (error || !data?.clinic_staff) return null;

    const staffArray = data.clinic_staff as { id: string; name: string; email: string; phone: string }[];
    const staff = staffArray[0];
    return {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      phone: staff.phone
    };
  }

  async autoAssignCustomer(customerId: string, clinicId: string): Promise<string> {
    const { data: salesStaff } = await this.supabase
      .from('clinic_staff')
      .select('id')
      .eq('clinic_id', clinicId)
      .eq('role', 'sales')
      .limit(1);

    if (!salesStaff?.[0]) throw new Error('No sales staff available');

    await this.assignCustomerToSales(customerId, salesStaff[0].id);
    return salesStaff[0].id;
  }
}

export const salesCustomerManager = new SalesCustomerManager();
