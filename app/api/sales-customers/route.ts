import { NextResponse } from 'next/server';
import { salesCustomerManager } from '@/lib/relationships/salesCustomerManager';
import { handleAPIError, successResponse } from '@/lib/utils/errorHandler';

/**
 * API for Sales-Customer Relationships
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const salesId = searchParams.get('salesId');
    const customerId = searchParams.get('customerId');

    if (salesId) {
      const customers = await salesCustomerManager.getCustomersForSales(salesId);
      return successResponse({ customers });
    }

    if (customerId) {
      const salesRep = await salesCustomerManager.getSalesRepForCustomer(customerId);
      return successResponse({ salesRep });
    }

    return NextResponse.json({ error: 'salesId or customerId required' }, { status: 400 });
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerId, salesId, clinicId, autoAssign } = body;

    if (autoAssign && customerId && clinicId) {
      const assignedId = await salesCustomerManager.autoAssignCustomer(customerId, clinicId);
      return successResponse({ assignedSalesId: assignedId, message: 'Auto-assigned successfully' });
    }

    if (customerId && salesId) {
      await salesCustomerManager.assignCustomerToSales(customerId, salesId);
      return successResponse({ message: 'Customer assigned successfully' });
    }

    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  } catch (error) {
    return handleAPIError(error);
  }
}
