import { NextResponse } from 'next/server';
import { chatManager } from '@/lib/chat/chatManager';
import { handleAPIError, successResponse } from '@/lib/utils/errorHandler';

/**
 * API for Integrated Chat System
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const salesId = searchParams.get('salesId');
    const action = searchParams.get('action'); // 'history', 'sessions', 'unread'

    if (action === 'history' && customerId && salesId) {
      const messages = await chatManager.getChatHistory(customerId, salesId);
      return successResponse({ messages });
    }

    if (action === 'sessions' && salesId) {
      const sessions = await chatManager.getChatSessionsForSales(salesId);
      return successResponse({ sessions });
    }

    if (action === 'unread' && customerId && salesId) {
      const forUser = searchParams.get('for') as 'customer' | 'sales';
      const count = await chatManager.getUnreadCount(customerId, salesId, forUser);
      return successResponse({ unreadCount: count });
    }

    return NextResponse.json({ error: 'Missing parameters or invalid action' }, { status: 400 });
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerId, salesId, senderType, messageText, messageType, contextData, action } = body;

    if (action === 'markRead') {
      const readerType = body.readerType as 'customer' | 'sales';
      await chatManager.markMessagesAsRead(customerId, salesId, readerType);
      return successResponse({ message: 'Messages marked as read' });
    }

    if (action === 'recommendation') {
      const message = await chatManager.sendTreatmentRecommendation(customerId, salesId, body.treatmentData);
      return successResponse({ message });
    }

    if (customerId && salesId && senderType && messageText) {
      const message = await chatManager.sendMessage(
        customerId,
        salesId,
        senderType,
        messageText,
        messageType || 'text',
        contextData
      );
      return successResponse({ message });
    }

    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  } catch (error) {
    return handleAPIError(error);
  }
}
