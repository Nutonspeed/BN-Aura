import { createClient } from '@/lib/supabase/client';
import { callGemini } from '@/lib/ai';
import { analyzeConversationSentiment, SentimentAnalysis } from '@/lib/ai/sentimentAnalyzer';

export interface ConversationMessage {
  role: 'sales' | 'customer' | 'ai_coach';
  content: string;
  timestamp: string;
  metadata?: {
    confidence?: number;
    talkingPoints?: string[];
    closingTechnique?: string;
    objectionType?: string;
  };
}

export interface Conversation {
  id: string;
  customer_id: string;
  sales_staff_id: string;
  clinic_id: string;
  conversation_type: string;
  messages: ConversationMessage[];
  summary: string | null;
  deal_probability: number | null;
  objections_handled: string[];
  products_discussed: string[];
  next_action: string | null;
  next_action_date: string | null;
  status: 'active' | 'completed' | 'abandoned';
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export class ConversationManager {
  private supabase = createClient();

  async startConversation(data: {
    customerId: string;
    salesStaffId: string;
    clinicId: string;
    type?: string;
  }): Promise<string> {
    const { data: conversation, error } = await this.supabase
      .from('customer_conversations')
      .insert({
        customer_id: data.customerId,
        sales_staff_id: data.salesStaffId,
        clinic_id: data.clinicId,
        conversation_type: data.type || 'ai_coach',
        status: 'active',
        messages: []
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to start conversation:', error);
      throw error;
    }

    return conversation.id;
  }

  async addMessage(
    conversationId: string, 
    message: Omit<ConversationMessage, 'timestamp'>
  ): Promise<void> {
    // Fetch current conversation
    const { data: conv, error: fetchError } = await this.supabase
      .from('customer_conversations')
      .select('messages, clinic_id')
      .eq('id', conversationId)
      .single();

    if (fetchError) {
      console.error('Failed to fetch conversation:', fetchError);
      throw fetchError;
    }

    const messages = [...(conv?.messages || []), {
      ...message,
      timestamp: new Date().toISOString()
    }];

    // Update conversation with new message
    const { error: updateError } = await this.supabase
      .from('customer_conversations')
      .update({ 
        messages,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    if (updateError) {
      console.error('Failed to add message:', updateError);
      throw updateError;
    }

    // Auto-generate summary and analyze sentiment after 10+ messages (every 5 messages)
    if (messages.length >= 5 && messages.length % 5 === 0) {
      // Trigger summary generation (background)
      if (messages.length >= 10) {
        this.generateSummary(conversationId, conv.clinic_id).catch(err => 
          console.error('Auto-summary failed:', err)
        );
      }

      // Trigger sentiment analysis (background)
      this.analyzeSentiment(conversationId, conv.clinic_id).catch(err =>
        console.error('Auto-sentiment analysis failed:', err)
      );
    }
  }

  async getConversation(conversationId: string): Promise<Conversation | null> {
    const { data, error } = await this.supabase
      .from('customer_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error) {
      console.error('Failed to get conversation:', error);
      return null;
    }

    return data as Conversation;
  }

  async getConversationHistory(
    customerId: string,
    limit = 10
  ): Promise<Conversation[]> {
    const { data, error } = await this.supabase
      .from('customer_conversations')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to get conversation history:', error);
      return [];
    }

    return (data || []) as Conversation[];
  }

  async getActiveConversation(
    customerId: string,
    salesStaffId: string
  ): Promise<Conversation | null> {
    const { data, error } = await this.supabase
      .from('customer_conversations')
      .select('*')
      .eq('customer_id', customerId)
      .eq('sales_staff_id', salesStaffId)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Failed to get active conversation:', error);
    }

    return data as Conversation | null;
  }

  async generateSummary(conversationId: string, clinicId: string): Promise<string> {
    // Get conversation messages
    const { data: conv, error } = await this.supabase
      .from('customer_conversations')
      .select('messages, summary')
      .eq('id', conversationId)
      .single();

    if (error || !conv) {
      throw new Error('Failed to fetch conversation for summary');
    }

    // Skip if already has recent summary
    if (conv.summary && conv.summary.length > 0) {
      return conv.summary;
    }

    const messages = conv.messages as ConversationMessage[];
    if (messages.length === 0) {
      return 'ไม่มีข้อความ';
    }

    // Generate AI summary
    const conversationText = messages
      .map(m => `[${m.role}]: ${m.content}`)
      .join('\n');

    const prompt = `สรุปการสนทนาการขายนี้ในภาษาไทยแบบกระชับ (2-3 ประโยค) เน้นประเด็นสำคัญ, ข้อโต้แย้ง, และโอกาสปิดการขาย:

${conversationText}

สรุป:`;

    try {
      const summary = await callGemini(prompt, 'gemini-2.0-flash', {
        clinicId,
        useCache: false
      });

      // Save summary to database
      await this.supabase
        .from('customer_conversations')
        .update({ summary: summary.trim() })
        .eq('id', conversationId);

      return summary.trim();
    } catch (err) {
      console.error('Failed to generate AI summary:', err);
      return `การสนทนา ${messages.length} ข้อความ`;
    }
  }

  async updateDealProbability(
    conversationId: string,
    probability: number
  ): Promise<void> {
    const { error } = await this.supabase
      .from('customer_conversations')
      .update({ 
        deal_probability: Math.max(0, Math.min(100, probability))
      })
      .eq('id', conversationId);

    if (error) {
      console.error('Failed to update deal probability:', error);
      throw error;
    }
  }

  async setNextAction(
    conversationId: string,
    action: string,
    actionDate: Date
  ): Promise<void> {
    const { error } = await this.supabase
      .from('customer_conversations')
      .update({ 
        next_action: action,
        next_action_date: actionDate.toISOString()
      })
      .eq('id', conversationId);

    if (error) {
      console.error('Failed to set next action:', error);
      throw error;
    }
  }

  async completeConversation(conversationId: string): Promise<void> {
    const { error } = await this.supabase
      .from('customer_conversations')
      .update({ status: 'completed' })
      .eq('id', conversationId);

    if (error) {
      console.error('Failed to complete conversation:', error);
      throw error;
    }
  }

  async abandonConversation(conversationId: string): Promise<void> {
    const { error } = await this.supabase
      .from('customer_conversations')
      .update({ status: 'abandoned' })
      .eq('id', conversationId);

    if (error) {
      console.error('Failed to abandon conversation:', error);
      throw error;
    }
  }

  async trackObjection(
    conversationId: string,
    objection: string
  ): Promise<void> {
    const { data: conv } = await this.supabase
      .from('customer_conversations')
      .select('objections_handled')
      .eq('id', conversationId)
      .single();

    const objections = [...(conv?.objections_handled || []), objection];

    await this.supabase
      .from('customer_conversations')
      .update({ objections_handled: objections })
      .eq('id', conversationId);
  }

  async trackProduct(
    conversationId: string,
    product: string
  ): Promise<void> {
    const { data: conv } = await this.supabase
      .from('customer_conversations')
      .select('products_discussed')
      .eq('id', conversationId)
      .single();

    const products = [...(conv?.products_discussed || []), product];

    await this.supabase
      .from('customer_conversations')
      .update({ products_discussed: products })
      .eq('id', conversationId);
  }

  /**
   * Analyze sentiment of a conversation
   */
  async analyzeSentiment(
    conversationId: string,
    clinicId: string
  ): Promise<SentimentAnalysis | null> {
    const { data: conv, error } = await this.supabase
      .from('customer_conversations')
      .select('messages')
      .eq('id', conversationId)
      .single();

    if (error || !conv) {
      console.error('Failed to fetch conversation for sentiment analysis:', error);
      return null;
    }

    const messages = conv.messages as ConversationMessage[];
    if (messages.length === 0) {
      return null;
    }

    try {
      const sentiment = await analyzeConversationSentiment(messages, clinicId);
      
      // Optionally store sentiment in metadata
      await this.supabase
        .from('customer_conversations')
        .update({ 
          metadata: { 
            sentiment,
            sentiment_analyzed_at: new Date().toISOString()
          } 
        })
        .eq('id', conversationId);

      return sentiment;
    } catch (err) {
      console.error('Sentiment analysis failed:', err);
      return null;
    }
  }
}

export const conversationManager = new ConversationManager();
