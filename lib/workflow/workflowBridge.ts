/**
 * Workflow Bridge - Unify workflow_states and customer_treatment_journeys
 * Provides a single interface for workflow operations
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/client';
import { WorkflowStage } from './workflowEngine';

export interface WorkflowData {
  clinic_id: string;
  customer_id: string;
  stage?: WorkflowStage;
  assigned_sales_id?: string;
  assigned_beautician_id?: string;
  treatment_plan?: any;
  metadata?: any;
}

export interface WorkflowTransition {
  new_stage: WorkflowStage;
  treatment_plan?: any;
  notes?: string;
}

export class WorkflowBridge {
  private getClient() {
    return createClient();
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(data: WorkflowData) {
    const client = this.getClient();
    const { data: result, error } = await client.rpc('api_create_workflow', {
      p_data: {
        clinic_id: data.clinic_id,
        customer_id: data.customer_id,
        stage: data.stage || 'lead_created',
        assigned_sales_id: data.assigned_sales_id,
        treatment_plan: data.treatment_plan,
        metadata: data.metadata
      }
    });

    if (error) throw error;
    return result;
  }

  /**
   * Transition workflow to next stage
   */
  async transitionWorkflow(workflowId: string, transition: WorkflowTransition) {
    const client = this.getClient();
    const { data: result, error } = await client.rpc('api_transition_workflow', {
      p_workflow_id: workflowId,
      p_data: {
        new_stage: transition.new_stage,
        treatment_plan: transition.treatment_plan,
        notes: transition.notes
      }
    });

    if (error) throw error;
    
    // Trigger commission calculation if payment confirmed
    if (transition.new_stage === 'payment_confirmed') {
      await this.calculateCommission(workflowId);
    }

    return result;
  }

  /**
   * Get workflow details
   */
  async getWorkflow(workflowId: string) {
    const client = this.getClient();
    const { data: result, error } = await client.rpc('api_get_workflow', {
      p_workflow_id: workflowId
    });

    if (error) throw error;
    return result;
  }

  /**
   * List workflows for sales staff
   */
  async listSalesWorkflows(salesId: string, limit: number = 50) {
    const client = this.getClient();
    const { data: result, error } = await client.rpc('api_list_sales_workflows', {
      p_sales_id: salesId,
      p_limit: limit
    });

    if (error) throw error;
    return result;
  }

  /**
   * List workflows for clinic (owner/admin)
   */
  async listClinicWorkflows(clinicId: string, limit: number = 100) {
    const client = this.getClient();
    const { data: result, error } = await client.rpc('api_list_clinic_workflows', {
      p_clinic_id: clinicId,
      p_limit: limit
    });

    if (error) throw error;
    return result;
  }

  /**
   * Assign sales staff to workflow
   */
  async assignSales(workflowId: string, salesId: string) {
    const client = this.getClient();
    const { data: result, error } = await client.rpc('unified_workflow_operation', {
      p_operation: 'assign_sales',
      p_workflow_id: workflowId,
      p_data: { sales_id: salesId }
    });

    if (error) throw error;
    return result;
  }

  /**
   * Assign beautician to workflow
   */
  async assignBeautician(workflowId: string, beauticianId: string) {
    const client = this.getClient();
    const { data: result, error } = await client.rpc('unified_workflow_operation', {
      p_operation: 'assign_beautician',
      p_workflow_id: workflowId,
      p_data: { beautician_id: beauticianId }
    });

    if (error) throw error;
    return result;
  }

  /**
   * Calculate commission for workflow
   */
  private async calculateCommission(workflowId: string) {
    const client = this.getClient();
    const { data, error } = await client.rpc('calculate_workflow_commission', {
      p_workflow_id: workflowId
    });

    if (error) throw error;
    return data;
  }

  /**
   * Get commission summary for sales staff
   */
  async getCommissionSummary(salesId: string, period: 'daily' | 'weekly' | 'monthly' = 'monthly') {
    const client = this.getClient();
    const { data, error } = await client
      .from('sales_commissions')
      .select('*')
      .eq('sales_staff_id', salesId)
      .gte('transaction_date', this.getStartDate(period))
      .order('transaction_date', { ascending: false });

    if (error) throw error;

    const summary = {
      totalCommission: data.reduce((sum: number, c: any) => sum + Number(c.commission_amount), 0),
      pendingCommission: data.filter((c: any) => c.payment_status === 'pending')
        .reduce((sum: number, c: any) => sum + Number(c.commission_amount), 0),
      paidCommission: data.filter((c: any) => c.payment_status === 'paid')
        .reduce((sum: number, c: any) => sum + Number(c.commission_amount), 0),
      transactionCount: data.length,
      averageCommission: data.length > 0 
        ? data.reduce((sum: number, c: any) => sum + Number(c.commission_amount), 0) / data.length 
        : 0
    };

    return summary;
  }

  private getStartDate(period: 'daily' | 'weekly' | 'monthly'): string {
    const now = new Date();
    const start = new Date();

    switch (period) {
      case 'daily':
        start.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        start.setDate(now.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        // First day of current month at 00:00:00
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
    }

    return start.toISOString();
  }
}

export const workflowBridge = new WorkflowBridge();
