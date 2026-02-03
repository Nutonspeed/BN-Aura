import { createClient } from '@/lib/supabase/server';
import { VectorSearchService } from '@/lib/embeddings/vectorSearch';
import { Conversation } from '@/lib/conversations/conversationManager';
import { SupabaseClient } from '@supabase/supabase-js';
import { ChurnPredictor } from '@/lib/ml/churnPrediction';
import { TreatmentRecommender } from '@/lib/ml/treatmentRecommender';

export interface TimelineEvent {
  id: string;
  type: 'conversation' | 'appointment' | 'purchase' | 'status_change';
  title: string;
  description: string;
  date: string;
  metadata?: any;
  icon?: string;
}

export interface CustomerRelationships {
  similarCustomers: {
    id: string;
    name: string;
    similarity: number;
    avatar?: string;
  }[];
  referrals: {
    id: string;
    name: string;
    date: string;
    status: string;
  }[];
  assignedStaff?: {
    id: string;
    name: string;
    role: string;
  };
}

export interface PredictiveAnalytics {
  churnRisk: {
    score: number; // 0-100
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
  ltv: {
    current: number;
    predicted: number;
  };
  nextBestAction: {
    action: string;
    reason: string;
    confidence: number;
  };
  recommendedTreatments?: Array<{
    id: string;
    name: string;
    reason: string;
    price_range: string;
  }>;
}

export interface CustomerIntelligence {
  timeline: TimelineEvent[];
  relationships: CustomerRelationships;
  analytics: PredictiveAnalytics;
}

export class CustomerIntelligenceService {
  private vectorSearch: VectorSearchService;
  private churnPredictor: ChurnPredictor;
  private treatmentRecommender: TreatmentRecommender;

  constructor(options: { clinicId?: string } = {}) {
    this.vectorSearch = new VectorSearchService(options);
    this.churnPredictor = new ChurnPredictor();
    this.treatmentRecommender = new TreatmentRecommender(options);
  }

  private async getClient(): Promise<SupabaseClient> {
    return await createClient();
  }

  async getCustomerIntelligence(customerId: string): Promise<CustomerIntelligence> {
    const supabase = await this.getClient();
    const [timeline, relationships, analytics] = await Promise.all([
      this.getTimeline(customerId, supabase),
      this.getRelationships(customerId, supabase),
      this.getPredictiveAnalytics(customerId, supabase)
    ]);

    return {
      timeline,
      relationships,
      analytics
    };
  }

  private async getTimeline(customerId: string, supabase: SupabaseClient): Promise<TimelineEvent[]> {
    const events: TimelineEvent[] = [];

    // 1. Fetch Conversations
    const { data: conversations } = await supabase
      .from('customer_conversations')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (conversations) {
      conversations.forEach((conv: any) => {
        events.push({
          id: conv.id,
          type: 'conversation',
          title: conv.conversation_type === 'ai_coach' ? 'AI Coach Session' : 'Sales Conversation',
          description: conv.summary || 'No summary available',
          date: conv.created_at,
          metadata: {
            sentiment: conv.metadata?.sentiment,
            dealProbability: conv.deal_probability
          }
        });
      });
    }

    // 2. Fetch Appointments
    const { data: appointments } = await supabase
      .from('appointments')
      .select('*')
      .eq('customer_id', customerId)
      .order('appointment_date', { ascending: false })
      .limit(10);

    if (appointments) {
      appointments.forEach((apt: any) => {
        events.push({
          id: apt.id,
          type: 'appointment',
          title: `Appointment: ${apt.service_name || 'Treatment'}`,
          description: `Status: ${apt.status}`,
          date: apt.appointment_date,
          metadata: {
            price: apt.total_price
          }
        });
      });
    }

    // Sort by date desc
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  private async getRelationships(customerId: string, supabase: SupabaseClient): Promise<CustomerRelationships> {
    // 1. Get Similar Customers via Vector Search
    let similarCustomers: any[] = [];
    try {
      const matches = await this.vectorSearch.findSimilarCustomersById(customerId, { limit: 5 });
      similarCustomers = matches.map(m => ({
        id: m.customer_id,
        name: m.full_name,
        similarity: Math.round(m.similarity * 100)
      }));
    } catch (err) {
      console.error('Failed to get similar customers:', err);
    }

    // 2. Get Referrals (Mock logic or actual if table exists - assuming simple query for now)
    // Note: Assuming 'referred_by' column exists on customers or separate table. 
    // If not, we return empty for now.
    const referrals: any[] = [];
    
    // 3. Get Assigned Staff
    const { data: customer } = await supabase
      .from('customers')
      .select('assigned_sales_id')
      .eq('id', customerId)
      .single();

    let assignedStaff = undefined;
    if (customer?.assigned_sales_id) {
      const { data: staff } = await supabase
        .from('users')
        .select('full_name, role')
        .eq('id', customer.assigned_sales_id)
        .single();
      
      if (staff) {
        assignedStaff = {
          id: customer.assigned_sales_id,
          name: staff.full_name,
          role: staff.role
        };
      }
    }

    return {
      similarCustomers,
      referrals,
      assignedStaff
    };
  }

  private async getPredictiveAnalytics(customerId: string, supabase: SupabaseClient): Promise<PredictiveAnalytics> {
    // 1. Get Churn Risk
    const churnData = await this.churnPredictor.predictChurnRisk(customerId);

    // 2. LTV Calculation
    const { data: payments } = await supabase
      .from('appointments') // Using appointments price as proxy for now
      .select('total_price')
      .eq('customer_id', customerId)
      .eq('status', 'completed');
    
    const currentLTV = payments?.reduce((sum, p) => sum + (Number(p.total_price) || 0), 0) || 0;
    const predictedLTV = currentLTV * 1.5; // Simple projection

    // 3. Get Treatment Recommendations
    const recommendations = await this.treatmentRecommender.recommendTreatments(customerId, 3);

    // 4. Next Best Action
    let nextAction = {
      action: 'Check In',
      reason: 'Routine follow-up',
      confidence: 60
    };

    if (churnData.level === 'high') {
      nextAction = {
        action: 'Re-engagement Offer',
        reason: 'Customer at risk of churning',
        confidence: 85
      };
    } else if (recommendations.length > 0) {
      nextAction = {
        action: `Suggest ${recommendations[0].name}`,
        reason: recommendations[0].reason,
        confidence: 80
      };
    } else if (currentLTV > 50000) {
      nextAction = {
        action: 'VIP Event Invite',
        reason: 'High value customer',
        confidence: 90
      };
    }

    return {
      churnRisk: {
        score: churnData.score,
        level: churnData.level,
        factors: churnData.factors
      },
      ltv: {
        current: currentLTV,
        predicted: predictedLTV
      },
      nextBestAction: nextAction,
      recommendedTreatments: recommendations.map(r => ({
        id: r.id,
        name: r.name,
        reason: r.reason,
        price_range: r.price_range
      }))
    };
  }
}
