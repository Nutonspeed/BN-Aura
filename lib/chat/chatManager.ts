/**
 * BN-Aura Integrated Chat System
 * Real-time messaging between customers and their assigned sales staff
 */

import { createClient } from '@/lib/supabase/client';

export interface ChatMessage {
  id: string;
  customerId: string;
  salesStaffId: string;
  senderType: 'customer' | 'sales';
  messageText: string;
  messageType: 'text' | 'image' | 'treatment_recommendation';
  isRead: boolean;
  createdAt: string;
  attachmentUrl?: string;
  contextData?: unknown;
}

export interface ChatSession {
  customerId: string;
  salesStaffId: string;
  customerName: string;
  salesName: string;
  messages: ChatMessage[];
  unreadCount: number;
  lastActivity: string;
}

export interface ChatContext {
  lastScanResults?: unknown;
  currentTreatments?: unknown[];
  customerProfile?: unknown;
  appointmentHistory?: unknown[];
}

export class ChatManager {
  private supabase = createClient();

  /**
   * Send message in chat
   */
  async sendMessage(
    customerId: string,
    salesStaffId: string,
    senderType: 'customer' | 'sales',
    messageText: string,
    messageType: 'text' | 'image' | 'treatment_recommendation' = 'text',
    contextData?: unknown
  ): Promise<ChatMessage> {
    try {
      const { data, error } = await this.supabase
        .from('customer_sales_messages')
        .insert({
          customer_id: customerId,
          sales_staff_id: salesStaffId,
          sender_type: senderType,
          message_text: messageText,
          message_type: messageType,
          context_data: contextData,
          is_read: false
        })
        .select()
        .single();

      if (error) throw error;

      return this.formatMessage(data);
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }

  /**
   * Get chat history between customer and sales
   */
  async getChatHistory(customerId: string, salesStaffId: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await this.supabase
        .from('customer_sales_messages')
        .select('*')
        .eq('customer_id', customerId)
        .eq('sales_staff_id', salesStaffId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map(this.formatMessage);
    } catch (error) {
      console.error('Error getting chat history:', error);
      return [];
    }
  }

  /**
   * Get all chat sessions for a sales staff
   */
  async getChatSessionsForSales(salesStaffId: string): Promise<ChatSession[]> {
    try {
      const { data, error } = await this.supabase
        .from('customer_sales_messages')
        .select(`
          customer_id,
          customers!customer_sales_messages_customer_id_fkey (name),
          created_at
        `)
        .eq('sales_staff_id', salesStaffId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by customer and get session info
      const customerGroups = this.groupMessagesByCustomer((data as unknown as RawCustomerData[]) || []);
      const sessions: ChatSession[] = [];

      for (const [customerId, messages] of customerGroups.entries()) {
        const customerData = messages[0].customers;
        const customerName = Array.isArray(customerData) 
          ? (customerData[0]?.name || 'Unknown') 
          : (customerData?.name || 'Unknown');
          
        const chatHistory = await this.getChatHistory(customerId, salesStaffId);
        const unreadCount = await this.getUnreadCount(customerId, salesStaffId, 'sales');

        sessions.push({
          customerId,
          salesStaffId,
          customerName,
          salesName: '', // Will be filled by UI
          messages: chatHistory,
          unreadCount,
          lastActivity: messages[0].created_at
        });
      }

      return sessions;
    } catch (error) {
      console.error('Error getting chat sessions:', error);
      return [];
    }
  }

  /**
   * Get unread message count
   */
  async getUnreadCount(customerId: string, salesStaffId: string, forUser: 'customer' | 'sales'): Promise<number> {
    try {
      const senderType = forUser === 'customer' ? 'sales' : 'customer';
      
      const { count, error } = await this.supabase
        .from('customer_sales_messages')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', customerId)
        .eq('sales_staff_id', salesStaffId)
        .eq('sender_type', senderType)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(customerId: string, salesStaffId: string, readerType: 'customer' | 'sales'): Promise<void> {
    try {
      const senderType = readerType === 'customer' ? 'sales' : 'customer';
      
      const { error } = await this.supabase
        .from('customer_sales_messages')
        .update({ is_read: true })
        .eq('customer_id', customerId)
        .eq('sales_staff_id', salesStaffId)
        .eq('sender_type', senderType)
        .eq('is_read', false);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  /**
   * Send treatment recommendation message
   */
  async sendTreatmentRecommendation(
    customerId: string,
    salesStaffId: string,
    treatmentData: {
      treatmentName: string;
      estimatedPrice: number;
      description: string;
      urgencyLevel: 'low' | 'medium' | 'high';
      recommendedDate: string;
    }
  ): Promise<ChatMessage> {
    const message = `🎯 Treatment Recommendation\n\n` +
                   `Treatment: ${treatmentData.treatmentName}\n` +
                   `Estimated Price: ฿${treatmentData.estimatedPrice.toLocaleString()}\n` +
                   `Description: ${treatmentData.description}\n` +
                   `Recommended Date: ${treatmentData.recommendedDate}\n\n` +
                   `Priority: ${treatmentData.urgencyLevel.toUpperCase()}`;

    return await this.sendMessage(
      customerId,
      salesStaffId,
      'sales',
      message,
      'treatment_recommendation',
      treatmentData
    );
  }

  /**
   * Get chat context for better customer service
   */
  async getChatContext(customerId: string): Promise<ChatContext> {
    try {
      // 1. Get customer profile first to get the auth user_id
      const { data: customerData } = await this.supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (!customerData) return {};

      // 2. Get latest skin analysis using auth user_id if linked
      let scanData = null;
      if (customerData.user_id) {
        const { data: analyses } = await this.supabase
          .from('skin_analyses')
          .select('*')
          .eq('user_id', customerData.user_id)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (analyses && analyses.length > 0) {
          scanData = analyses[0];
        }
      }

      // 3. Get active treatments (journeys)
      const { data: journeys } = await this.supabase
        .from('customer_treatment_journeys')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(5);

      // 4. Get appointment history
      const { data: appointments } = await this.supabase
        .from('appointments')
        .select('*')
        .eq('customer_id', customerId)
        .order('appointment_date', { ascending: false })
        .limit(5);

      return {
        lastScanResults: scanData,
        customerProfile: customerData,
        currentTreatments: journeys || [],
        appointmentHistory: appointments || []
      };
    } catch (error) {
      console.error('Error getting chat context:', error);
      return {};
    }
  }

  /**
   * Subscribe to real-time messages
   */
  subscribeToMessages(customerId: string, salesStaffId: string, onMessage: (message: ChatMessage) => void) {
    return this.supabase
      .channel('customer-sales-chat')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'customer_sales_messages',
        filter: `customer_id=eq.${customerId} and sales_staff_id=eq.${salesStaffId}`
      }, (payload) => {
        onMessage(this.formatMessage(payload.new as unknown as RawChatMessage));
      })
      .subscribe();
  }

  /**
   * Format message data
   */
  private formatMessage(data: RawChatMessage): ChatMessage {
    return {
      id: data.id,
      customerId: data.customer_id,
      salesStaffId: data.sales_staff_id,
      senderType: data.sender_type,
      messageText: data.message_text,
      messageType: data.message_type,
      isRead: data.is_read,
      createdAt: data.created_at,
      attachmentUrl: data.attachment_url,
      contextData: data.context_data
    };
  }

  /**
   * Group messages by customer
   */
  private groupMessagesByCustomer(messages: RawCustomerData[]): Map<string, RawCustomerData[]> {
    const groups = new Map<string, RawCustomerData[]>();
    
    messages.forEach(message => {
      const customerId = message.customer_id;
      if (!groups.has(customerId)) {
        groups.set(customerId, []);
      }
      groups.get(customerId)?.push(message);
    });

    return groups;
  }
}

interface RawChatMessage {
  id: string;
  customer_id: string;
  sales_staff_id: string;
  sender_type: 'customer' | 'sales';
  message_text: string;
  message_type: 'text' | 'image' | 'treatment_recommendation';
  is_read: boolean;
  created_at: string;
  attachment_url?: string;
  context_data?: unknown;
}

interface RawCustomerData {
  customer_id: string;
  customers: { name: string } | { name: string }[] | null;
  created_at: string;
}

export const chatManager = new ChatManager();
