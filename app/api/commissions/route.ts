import { NextResponse } from 'next/server';
import { pricingEngine } from '@/lib/pricing/clinicPricingEngine';
import { handleAPIError, successResponse } from '@/lib/utils/errorHandler';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  withErrorHandling,
  APIValidator,
  validateRequest 
} from '@/lib/api/responseHelpers';
import { 
  APIErrorCode, 
  CommissionCreateRequest, 
  CommissionResponse 
} from '@/lib/api/contracts';

/**
 * API for Sales Commissions Tracking
 */

export const GET = withErrorHandling(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const salesId = searchParams.get('salesId');
  const period = (searchParams.get('period') || 'monthly') as 'monthly' | 'weekly' | 'daily';

  // Validation
  if (!salesId) {
    return createErrorResponse(
      APIErrorCode.MISSING_REQUIRED_FIELDS,
      'salesId is required',
      { details: { missingFields: ['salesId'] } }
    );
  }

  const uuidError = APIValidator.validateUUID(salesId, 'salesId');
  if (uuidError) {
    return createErrorResponse(
      APIErrorCode.VALIDATION_ERROR,
      'Invalid salesId format',
      { validationErrors: [uuidError] }
    );
  }

  const periodError = APIValidator.validateEnum(period, 'period', ['daily', 'weekly', 'monthly']);
  if (periodError) {
    return createErrorResponse(
      APIErrorCode.VALIDATION_ERROR,
      'Invalid period value',
      { validationErrors: [periodError] }
    );
  }

  const summary = await pricingEngine.getSalesCommissionSummary(salesId, period);
  
  return createSuccessResponse(summary, {
    meta: { 
      salesId, 
      period,
      generatedAt: new Date().toISOString()
    }
  });
});

export const POST = withErrorHandling(async (request: Request) => {
  // Validate request body structure
  const { data, errors } = await validateRequest<CommissionCreateRequest>(
    request,
    (body: unknown) => {
      const data = body as Record<string, unknown>;
      const validationErrors = APIValidator.validateRequired(data, [
        'salesId', 'customerId', 'treatmentName', 'amount', 'commissionRate', 'clinicId'
      ]);

      // Validate UUID fields
      ['salesId', 'customerId', 'clinicId'].forEach(field => {
        if (data[field] && typeof data[field] === 'string') {
          const uuidError = APIValidator.validateUUID(data[field] as string, field);
          if (uuidError) validationErrors.push(uuidError);
        }
      });

      // Validate numeric fields
      const amountError = APIValidator.validateNumber(data.amount, 'amount', { min: 0.01 });
      if (amountError) validationErrors.push(amountError);

      const rateError = APIValidator.validateNumber(data.commissionRate, 'commissionRate', { 
        min: 0, 
        max: 100 
      });
      if (rateError) validationErrors.push(rateError);

      // Validate treatment name
      if (data.treatmentName && typeof data.treatmentName === 'string') {
        if (data.treatmentName.trim().length < 2) {
          validationErrors.push({
            field: 'treatmentName',
            message: 'Treatment name must be at least 2 characters',
            code: 'MIN_LENGTH',
            value: data.treatmentName
          });
        }
      }

      return validationErrors;
    }
  );

  if (errors.length > 0) {
    return createErrorResponse(
      APIErrorCode.VALIDATION_ERROR,
      'Validation failed',
      { validationErrors: errors }
    );
  }

  const commissionId = await pricingEngine.recordCommission(
    data.salesId,
    data.customerId,
    data.treatmentName,
    data.amount,
    data.commissionRate,
    data.clinicId
  );

  const calculatedCommission = (data.amount * data.commissionRate) / 100;

  const response: CommissionResponse = {
    id: commissionId,
    salesStaffId: data.salesId,
    customerId: data.customerId,
    transactionType: data.treatmentName,
    baseAmount: data.amount,
    commissionRate: data.commissionRate,
    commissionAmount: calculatedCommission,
    paymentStatus: 'pending',
    createdAt: new Date().toISOString()
  };

  return createSuccessResponse(response, {
    meta: {
      action: 'commission_created',
      calculatedCommission,
      clinicId: data.clinicId
    }
  });
});
