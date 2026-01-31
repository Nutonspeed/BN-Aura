import { NextResponse } from 'next/server';
import { workflowManager } from '@/lib/workflow/workflowManager';
import { handleAPIError, successResponse } from '@/lib/utils/errorHandler';

/**
 * API for Unified Workflow Orchestration
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, customerId, salesId, clinicId, journeyId, beauticianId, treatmentName, scheduledTime, priority, notes, customerData } = body;

    switch (action) {
      case 'initialize':
        if (!salesId || !clinicId || !customerData?.name || !customerData?.phone) {
          return NextResponse.json({ error: 'Missing fields for initialization (salesId, clinicId, and customerData are required)' }, { status: 400 });
        }
        const newJourneyId = await workflowManager.initializeJourney(
          customerData,
          salesId, 
          clinicId, 
          body.scanId || ''
        );
        return successResponse({ journeyId: newJourneyId, message: 'Journey initialized' });

      case 'createTask':
        if (!journeyId || !customerId || !beauticianId || !treatmentName || !scheduledTime) {
          return NextResponse.json({ error: 'Missing fields for task creation' }, { status: 400 });
        }
        await workflowManager.createBeauticianTask(journeyId, customerId, beauticianId, treatmentName, scheduledTime, priority);
        return successResponse({ message: 'Beautician task created' });

      case 'startTreatment':
        if (!journeyId || !beauticianId) {
          return NextResponse.json({ error: 'Missing fields to start treatment' }, { status: 400 });
        }
        await workflowManager.startTreatment(journeyId, beauticianId);
        return successResponse({ message: 'Treatment started' });

      case 'completeTreatment':
        if (!journeyId) {
          return NextResponse.json({ error: 'Missing journeyId' }, { status: 400 });
        }
        await workflowManager.completeTreatment(journeyId, notes || '');
        return successResponse({ message: 'Treatment completed and follow-up triggered' });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return handleAPIError(error);
  }
}
