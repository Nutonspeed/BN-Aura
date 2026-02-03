import { createClient } from '@/lib/supabase/server';
import { EmbeddingService } from './embeddingService';
import { SupabaseClient } from '@supabase/supabase-js';

export interface SimilarConversation {
  conversation_id: string;
  similarity: number;
  summary: string;
  deal_probability: number;
}

export interface SimilarCustomer {
  customer_id: string;
  similarity: number;
  full_name: string;
  assigned_sales_id: string;
}

export class VectorSearchService {
  private embeddingService: EmbeddingService;

  constructor(options: { clinicId?: string; userId?: string } = {}) {
    this.embeddingService = new EmbeddingService(options);
  }

  private async getClient(): Promise<SupabaseClient> {
    return await createClient();
  }

  /**
   * Search for conversations similar to a given text query or conversation content
   */
  async findSimilarConversations(
    text: string,
    options: {
      limit?: number;
      threshold?: number;
      clinicId?: string;
    } = {}
  ): Promise<SimilarConversation[]> {
    const { limit = 5, threshold = 0.7, clinicId } = options;
    const supabase = await this.getClient();

    // Generate embedding for the query text
    // We reuse generateConversationEmbedding logic but treat the query as a single user message
    const embedding = await this.embeddingService.generateConversationEmbedding([
      { role: 'customer', content: text, timestamp: new Date().toISOString() }
    ]);

    const { data, error } = await supabase.rpc('match_conversations', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: limit,
      clinic_filter: clinicId
    });

    if (error) {
      console.error('Error finding similar conversations:', error);
      throw error;
    }

    return data as SimilarConversation[];
  }

  /**
   * Find customers with similar profiles
   */
  async findSimilarCustomers(
    customerProfileText: string,
    options: {
      limit?: number;
      excludeCustomerId?: string;
    } = {}
  ): Promise<SimilarCustomer[]> {
    const { limit = 10, excludeCustomerId } = options;
    const supabase = await this.getClient();

    // Use the raw text to generate embedding directly using the model 
    // (accessing private model via public method wrapper if we had one, but here we can just use the embed tool logic re-implemented or exposed)
    // Actually, let's reuse generateConversationEmbedding for generic text or add a generic method to EmbeddingService.
    // Ideally EmbeddingService should have a generic `embedText` method.
    // For now, I'll assume I can construct a dummy customer object or update EmbeddingService.
    
    // Let's update EmbeddingService to have a generic embedText method in a separate edit if needed.
    // But for now, I'll pass it as a message content since the underlying model is text-embedding-004 which handles text.
    const embedding = await this.embeddingService.generateConversationEmbedding([
      { role: 'customer', content: customerProfileText, timestamp: new Date().toISOString() }
    ]);

    const { data, error } = await supabase.rpc('match_customers', {
      query_embedding: embedding,
      match_count: limit,
      exclude_customer: excludeCustomerId
    });

    if (error) {
      console.error('Error finding similar customers:', error);
      throw error;
    }

    return data as SimilarCustomer[];
  }

  /**
   * Find similar customers based on an existing customer's ID
   */
  async findSimilarCustomersById(
    customerId: string,
    options: {
      limit?: number;
    } = {}
  ): Promise<SimilarCustomer[]> {
    const { limit = 10 } = options;
    const supabase = await this.getClient();

    // 1. Get the source customer's embedding
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('preference_embedding')
      .eq('id', customerId)
      .single();

    if (fetchError || !customer?.preference_embedding) {
      // If no embedding exists, we might want to generate it on the fly?
      // For now, return empty or throw
      console.warn(`No embedding found for customer ${customerId}`);
      return [];
    }

    // 2. Search using that embedding
    // Casting string/array to vector format is handled by supabase-js typically if passed correctly,
    // but here we are passing the embedding retrieved from DB back to RPC.
    // The DB returns it as a string usually "[0.1, 0.2, ...]" which might need parsing if we were manipulating it,
    // but RPC expects vector type. Supabase client handles JSON -> Postgres types often.
    // However, if it comes back as a string, we might need to parse it.
    
    let embedding = customer.preference_embedding;
    if (typeof embedding === 'string') {
        embedding = JSON.parse(embedding);
    }

    const { data, error } = await supabase.rpc('match_customers', {
      query_embedding: embedding,
      match_count: limit,
      exclude_customer: customerId
    });

    if (error) {
      console.error('Error finding similar customers by ID:', error);
      throw error;
    }

    return data as SimilarCustomer[];
  }
}
