/**
 * BN-Aura Unified Workflow Engine
 * Orchestrates the relationship between Sales, Beauticians, and Customers
 */

import { createClient } from '@/lib/supabase/client';
import { salesCustomerManager } from '@/lib/relationships/salesCustomerManager';

export type WorkflowStage = 'scanned' | 'treatment_planned' | 'in_treatment' | 'completed' | 'follow_up' | 'closed';

export interface WorkflowTransition {
  customerId: string;
  previousStage: WorkflowStage;
  newStage: WorkflowStage;
  actionTaken: string;
  performedBy: string;
  notes?: string;
}

export class WorkflowManager {
  private supabase = createClient();

  /**
   * Initialize a new treatment journey after a scan
   */
  async initializeJourney(
    customerData: { name: string; phone: string; email?: string; age?: number },
    salesId: string, 
    clinicId: string,
    initialScanId: string
  ): Promise<string> {
    try {
      // 1. Get or create real customer record
      const customerId = await salesCustomerManager.getOrCreateCustomer({
        name: customerData.name,
        phone: customerData.phone,
        email: customerData.email,
        age: customerData.age,
        clinicId
      });

      // 2. Ensure customer is assigned to this sales rep if not already
      await salesCustomerManager.assignCustomerToSales(customerId, salesId);

      // 3. Create the journey
      const { data, error } = await this.supabase
        .from('customer_treatment_journeys')
        .insert({
          customer_id: customerId,
          sales_staff_id: salesId,
          clinic_id: clinicId,
          journey_status: 'consultation',
          initial_scan_results: { scan_id: initialScanId },
          consultation_date: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // 4. Notify Sales
      await this.createNotification(salesId, 'new_journey', `New journey initialized for ${customerData.name}.`);

      return data.id;
    } catch (error) {
      console.error('Error initializing journey:', error);
      throw error;
    }
  }

  /**
   * Create a task for a beautician from a treatment plan
   */
  async createBeauticianTask(
    journeyId: string,
    customerId: string,
    beauticianId: string,
    treatmentName: string,
    scheduledTime: string,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<void> {
    try {
      // 1. Update Journey Status
      await this.supabase
        .from('customer_treatment_journeys')
        .update({ 
          journey_status: 'treatment_planned',
          metadata: { priority, scheduledTime }
        })
        .eq('id', journeyId);

      // 2. Create Task (In a real system, this would be a tasks table)
      
      // 3. Notify Beautician
      await this.createNotification(beauticianId, 'new_task', `New ${treatmentName} case assigned. Priority: ${priority}`);

    } catch (error) {
      console.error('Error creating beautician task:', error);
      throw error;
    }
  }

  /**
   * Mark treatment as in-progress (Beautician starts)
   */
  async startTreatment(journeyId: string, beauticianId: string): Promise<void> {
    try {
      await this.supabase
        .from('customer_treatment_journeys')
        .update({ 
          journey_status: 'in_progress',
          treatment_start_date: new Date().toISOString(),
          assigned_beautician_id: beauticianId
        })
        .eq('id', journeyId);

      // Notify Sales that their customer is in treatment
      const { data: journey } = await this.supabase
        .from('customer_treatment_journeys')
        .select('sales_staff_id, customer_id')
        .eq('id', journeyId)
        .single();

      if (journey) {
        await this.createNotification(journey.sales_staff_id, 'treatment_started', `Customer treatment has begun.`);
      }
    } catch (error) {
      console.error('Error starting treatment:', error);
      throw error;
    }
  }

  /**
   * Complete treatment and trigger follow-up
   */
  async completeTreatment(journeyId: string, notes: string): Promise<void> {
    try {
      const completionDate = new Date().toISOString();
      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + 7); // Default 7 days follow-up

      await this.supabase
        .from('customer_treatment_journeys')
        .update({ 
          journey_status: 'completed',
          actual_completion_date: completionDate,
          next_follow_up_date: followUpDate.toISOString(),
          progress_notes: notes
        })
        .eq('id', journeyId);

      const { data: journey } = await this.supabase
        .from('customer_treatment_journeys')
        .select('sales_staff_id, customer_id')
        .eq('id', journeyId)
        .single();

      if (journey) {
        // Notify Sales to sell products
        await this.createNotification(journey.sales_staff_id, 'treatment_completed', `Treatment complete. Time for post-care sales.`);
        
        // Notify Customer with care instructions
        await this.createNotification(journey.customer_id, 'care_instructions', `Treatment complete! Here's your post-care guide.`);
      }
    } catch (error) {
      console.error('Error completing treatment:', error);
      throw error;
    }
  }

  /**
   * Utility to create system notifications
   */
  private async createNotification(userId: string, type: string, message: string): Promise<void> {
    try {
      // 1. Insert into 'notifications' table for persistence
      const { error } = await this.supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: type,
          title: this.getNotificationTitle(type),
          message: message,
          is_read: false
        });

      if (error) console.error('Error persisting notification:', error);

      // 2. Real-time broadcast via Supabase for immediate UI update
      await this.supabase
        .channel(`user-notifications-${userId}`)
        .send({
          type: 'broadcast',
          event: 'notification',
          payload: { 
            type, 
            title: this.getNotificationTitle(type),
            message, 
            timestamp: new Date().toISOString() 
          }
        });
    } catch (err) {
      console.error('Failed to create notification:', err);
    }
  }

  private getNotificationTitle(type: string): string {
    switch (type) {
      case 'new_journey': return 'New Patient Journey';
      case 'new_task': return 'Clinical Task Assigned';
      case 'treatment_started': return 'Treatment In Progress';
      case 'treatment_completed': return 'Treatment Cycle Complete';
      case 'care_instructions': return 'Post-Treatment Care';
      case 'quota_alert': return 'System Quota Warning';
      default: return 'System Intelligence Update';
    }
  }
}

export const workflowManager = new WorkflowManager();
