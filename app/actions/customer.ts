'use server';

import { CustomerIntelligenceService } from '@/lib/customer/customerIntelligence';

export async function getCustomerIntelligenceAction(customerId: string) {
  try {
    const service = new CustomerIntelligenceService();
    const intelligence = await service.getCustomerIntelligence(customerId);
    return { success: true, data: intelligence };
  } catch (error) {
    console.error('Failed to get customer intelligence:', error);
    return { success: false, error: 'Failed to fetch customer intelligence' };
  }
}
