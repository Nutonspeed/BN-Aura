import { createClient } from '@/lib/supabase/client';

export interface ChurnPredictionInput {
  lastVisitDate: string;
  totalVisits: number;
  avgSpend: number;
  daysSinceLastInteraction: number;
  cancellationCount: number;
  complaintCount: number;
  sentimentScore?: number; // -1 to 1
}

export interface ChurnRiskResult {
  score: number; // 0-100
  level: 'low' | 'medium' | 'high';
  factors: string[];
  recommendedActions: string[];
}

export class ChurnPredictor {
  private supabase = createClient();

  /**
   * Predict churn risk for a customer
   * Currently uses heuristic logic, ready for ML model swap
   */
  async predictChurnRisk(customerId: string): Promise<ChurnRiskResult> {
    // 1. Gather Data
    const { data: customer } = await this.supabase
      .from('customers')
      .select('created_at, metadata')
      .eq('id', customerId)
      .single();

    const { data: appointments } = await this.supabase
      .from('appointments')
      .select('appointment_date, status, total_price')
      .eq('customer_id', customerId)
      .order('appointment_date', { ascending: false });

    // Mock data gathering for other signals if tables don't exist yet
    // In a real scenario, we would query 'interactions', 'complaints', etc.
    
    // Process Data
    const totalVisits = appointments?.filter(a => a.status === 'completed').length || 0;
    const cancelledVisits = appointments?.filter(a => a.status === 'cancelled').length || 0;
    
    const lastCompleted = appointments?.find(a => a.status === 'completed');
    const lastVisitDate = lastCompleted?.appointment_date || customer?.created_at;
    
    const daysSinceLastVisit = Math.floor((Date.now() - new Date(lastVisitDate).getTime()) / (1000 * 60 * 60 * 24));
    
    const totalSpent = appointments?.reduce((sum, a) => sum + (Number(a.total_price) || 0), 0) || 0;
    const avgSpend = totalVisits > 0 ? totalSpent / totalVisits : 0;

    // Heuristic Model
    let score = 0;
    const factors: string[] = [];
    const actions: string[] = [];

    // Factor 1: Recency (Weight 40%)
    if (daysSinceLastVisit > 120) {
      score += 40;
      factors.push('Absent for > 4 months');
    } else if (daysSinceLastVisit > 90) {
      score += 30;
      factors.push('Absent for > 3 months');
    } else if (daysSinceLastVisit > 60) {
      score += 15;
      factors.push('Absent for > 2 months');
    }

    // Factor 2: Frequency Drop (Weight 20%)
    // Simple check: if they used to come monthly but stopped
    // Requires more historical analysis in real ML model
    if (totalVisits > 5 && daysSinceLastVisit > 60) {
      score += 20;
      factors.push('Broken routine visit pattern');
    }

    // Factor 3: Cancellations (Weight 20%)
    if (cancelledVisits > 2) {
      score += 20;
      factors.push('Multiple recent cancellations');
    }

    // Factor 4: Spending Drop (Weight 10%)
    // Placeholder logic
    
    // Factor 5: Low Engagement (Weight 10%)
    // Placeholder logic

    // Determine Level
    let level: 'low' | 'medium' | 'high' = 'low';
    if (score >= 70) level = 'high';
    else if (score >= 40) level = 'medium';

    // Recommendations
    if (level === 'high') {
      actions.push('Send "We Miss You" exclusive offer');
      actions.push('Personal check-in call from manager');
    } else if (level === 'medium') {
      actions.push('Send targeted promotion for favorite treatment');
    } else {
      actions.push('Maintain regular nurture sequence');
    }

    return {
      score,
      level,
      factors,
      recommendedActions: actions
    };
  }
}
