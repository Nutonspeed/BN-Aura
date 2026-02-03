import { createClient } from '@/lib/supabase/server';
import { VectorSearchService } from '@/lib/embeddings/vectorSearch';
import { SupabaseClient } from '@supabase/supabase-js';

export interface RecommendedTreatment {
  id: string;
  name: string;
  score: number; // Relevance score
  reason: string;
  price_range: string;
}

export class TreatmentRecommender {
  private vectorSearch: VectorSearchService;

  constructor(options: { clinicId?: string } = {}) {
    this.vectorSearch = new VectorSearchService(options);
  }

  private async getClient(): Promise<SupabaseClient> {
    return await createClient();
  }

  async recommendTreatments(
    customerId: string,
    limit: number = 5
  ): Promise<RecommendedTreatment[]> {
    const supabase = await this.getClient();

    // 1. Find Similar Customers
    const similarCustomers = await this.vectorSearch.findSimilarCustomersById(customerId, { limit: 10 });
    
    if (similarCustomers.length === 0) {
      return this.getPopularTreatments(limit);
    }

    const similarCustomerIds = similarCustomers.map(c => c.customer_id);

    // 2. Fetch Treatments purchased by similar customers
    // We look at appointments where status is 'completed'
    const { data: appointments } = await supabase
      .from('appointments')
      .select('treatment_ids')
      .in('customer_id', similarCustomerIds)
      .eq('status', 'completed');

    if (!appointments || appointments.length === 0) {
      return this.getPopularTreatments(limit);
    }

    // 3. Aggregate Treatment Counts
    const treatmentCounts: Record<string, number> = {};
    appointments.forEach(apt => {
      if (apt.treatment_ids && Array.isArray(apt.treatment_ids)) {
        apt.treatment_ids.forEach((tid: string) => {
          treatmentCounts[tid] = (treatmentCounts[tid] || 0) + 1;
        });
      }
    });

    // 4. Fetch Treatment Details
    const treatmentIds = Object.keys(treatmentCounts);
    const { data: treatments } = await supabase
      .from('treatments')
      .select('id, names, price_min, price_max')
      .in('id', treatmentIds);

    if (!treatments) return [];

    // 5. Score and Sort
    const recommendations: RecommendedTreatment[] = treatments.map(t => {
        const count = treatmentCounts[t.id];
        // Simple score based on frequency among similar users
        // Could be enhanced by weighting based on similarity score of the user who bought it
        return {
            id: t.id,
            name: t.names?.en || t.names?.th || 'Unknown Treatment',
            score: count,
            reason: `Popular among customers with similar skin profile`,
            price_range: `฿${t.price_min?.toLocaleString() || '0'} - ฿${t.price_max?.toLocaleString() || '0'}`
        };
    });

    // Sort by score descending
    recommendations.sort((a, b) => b.score - a.score);

    return recommendations.slice(0, limit);
  }

  private async getPopularTreatments(limit: number): Promise<RecommendedTreatment[]> {
    // Fallback: Get most popular treatments overall
    // For now, returning empty or placeholder. In real app, query aggregate stats.
    return []; 
  }
}
