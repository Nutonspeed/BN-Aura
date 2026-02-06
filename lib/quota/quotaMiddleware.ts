/**
 * Quota Middleware for AI Analysis APIs
 * Checks and records quota usage before/after analysis
 */

import { QuotaManager } from './quotaManager';
import { NeuralCache } from './neuralCache';

interface QuotaCheckResult {
  allowed: boolean;
  quotaRemaining: number;
  willIncurCharge: boolean;
  estimatedCost: number;
  message: string;
  cached?: boolean;
}

interface AnalysisContext {
  clinicId: string;
  userId: string;
  customerId?: string;
  scanType: 'quick' | 'detailed' | 'premium';
}

/**
 * Check if analysis can proceed based on quota
 */
export async function checkQuotaBeforeAnalysis(
  context: AnalysisContext
): Promise<QuotaCheckResult> {
  const { clinicId, customerId } = context;

  // Check neural cache first (24-hour repeat scan protection)
  if (customerId) {
    const cached = NeuralCache.getCachedAnalysis(clinicId, { name: customerId });
    if (cached) {
      return {
        allowed: true,
        quotaRemaining: -1, // Not applicable for cached
        willIncurCharge: false,
        estimatedCost: 0,
        message: 'ใช้ผลวิเคราะห์ที่ cache ไว้ (ไม่หักโควต้า)',
        cached: true,
      };
    }
  }

  // Check quota availability
  const availability = await QuotaManager.checkQuotaAvailability(clinicId);

  return {
    allowed: availability.canScan,
    quotaRemaining: availability.quotaRemaining,
    willIncurCharge: availability.willIncurCharge,
    estimatedCost: availability.estimatedCost,
    message: availability.message,
    cached: false,
  };
}

/**
 * Record usage after successful analysis
 */
export async function recordQuotaAfterAnalysis(
  context: AnalysisContext,
  result: {
    successful: boolean;
    analysisScore?: number;
    cached?: boolean;
  }
): Promise<void> {
  // Don't record if result was from cache
  if (result.cached) {
    console.log('📦 Analysis from cache - no quota deduction');
    return;
  }

  const { clinicId, userId, customerId, scanType } = context;

  // Record the usage
  await QuotaManager.recordUsage(
    clinicId,
    userId,
    scanType,
    result.successful,
    {
      analysisScore: result.analysisScore,
    }
  );

  // Cache the result for 24-hour protection
  if (result.successful && customerId) {
    NeuralCache.recordCustomerScan(
      clinicId,
      { name: customerId },
      undefined,
      { overallScore: result.analysisScore }
    );
  }

  console.log(`✅ Quota recorded: ${scanType} scan for clinic ${clinicId}`);
}

/**
 * Get quota consumption rate based on scan type
 */
export function getQuotaConsumptionRate(scanType: 'quick' | 'detailed' | 'premium'): number {
  switch (scanType) {
    case 'quick':
      return 0.2; // Quick scan (Gemini Flash)
    case 'detailed':
      return 1.0; // Clinical analysis (Gemini Pro)
    case 'premium':
      return 1.5; // Premium with all features
    default:
      return 1.0;
  }
}

/**
 * Wrap an analysis function with quota checking
 */
export function withQuotaCheck<T>(
  analysisFunction: (context: AnalysisContext) => Promise<T>
) {
  return async (context: AnalysisContext): Promise<T & { quotaInfo: QuotaCheckResult }> => {
    // Check quota before
    const quotaCheck = await checkQuotaBeforeAnalysis(context);

    if (!quotaCheck.allowed) {
      throw new QuotaExceededError(quotaCheck.message, {
        quotaRemaining: quotaCheck.quotaRemaining,
        estimatedCost: quotaCheck.estimatedCost,
      });
    }

    try {
      // Run analysis
      const result = await analysisFunction(context);

      // Record usage after
      await recordQuotaAfterAnalysis(context, {
        successful: true,
        cached: quotaCheck.cached,
      });

      return {
        ...result,
        quotaInfo: quotaCheck,
      };
    } catch (error) {
      // Record failed attempt
      await recordQuotaAfterAnalysis(context, {
        successful: false,
        cached: quotaCheck.cached,
      });
      throw error;
    }
  };
}

/**
 * Custom error for quota exceeded
 */
export class QuotaExceededError extends Error {
  public readonly code = 'QUOTA_EXCEEDED';
  public readonly statusCode = 403;
  public readonly details: {
    quotaRemaining: number;
    estimatedCost: number;
  };

  constructor(message: string, details: { quotaRemaining: number; estimatedCost: number }) {
    super(message);
    this.name = 'QuotaExceededError';
    this.details = details;
  }
}

/**
 * Express/Next.js middleware style quota check
 */
export function createQuotaMiddleware(options?: {
  bypassForCached?: boolean;
  allowOverage?: boolean;
}) {
  return async (
    clinicId: string,
    userId: string,
    customerId?: string
  ): Promise<{ proceed: boolean; quotaInfo: QuotaCheckResult }> => {
    const quotaCheck = await checkQuotaBeforeAnalysis({
      clinicId,
      userId,
      customerId,
      scanType: 'detailed',
    });

    // Allow cached results
    if (options?.bypassForCached && quotaCheck.cached) {
      return { proceed: true, quotaInfo: quotaCheck };
    }

    // Allow overage if configured
    if (options?.allowOverage && quotaCheck.willIncurCharge) {
      return { proceed: true, quotaInfo: quotaCheck };
    }

    return {
      proceed: quotaCheck.allowed,
      quotaInfo: quotaCheck,
    };
  };
}

export default {
  checkQuotaBeforeAnalysis,
  recordQuotaAfterAnalysis,
  getQuotaConsumptionRate,
  withQuotaCheck,
  createQuotaMiddleware,
  QuotaExceededError,
};
