import { createClient } from '@/lib/supabase/server';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  withErrorHandling,
  APIValidator,
  validateRequest 
} from '@/lib/api/responseHelpers';
import { APIErrorCode } from '@/lib/api/contracts';

/**
 * POST /api/analysis/compare
 * Create a before/after comparison between two skin analyses
 */
export const POST = withErrorHandling(async (request: Request) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return createErrorResponse(APIErrorCode.UNAUTHORIZED, 'Authentication required');
  }

  const { data, errors } = await validateRequest<any>(
    request,
    (body: any) => {
      const validationErrors = APIValidator.validateRequired(body, [
        'user_id', 
        'before_analysis_id', 
        'after_analysis_id'
      ]);
      
      ['user_id', 'before_analysis_id', 'after_analysis_id'].forEach(field => {
        if (body[field]) {
          const err = APIValidator.validateUUID(body[field], field);
          if (err) validationErrors.push(err);
        }
      });

      return validationErrors;
    }
  );

  if (errors.length > 0) {
    return createErrorResponse(APIErrorCode.VALIDATION_ERROR, 'Validation failed', { validationErrors: errors });
  }

  // Fetch analysis data to calculate improvement
  const { data: beforeAnalysis } = await supabase
    .from('skin_analyses')
    .select('overall_score')
    .eq('id', data.before_analysis_id)
    .single();

  const { data: afterAnalysis } = await supabase
    .from('skin_analyses')
    .select('overall_score')
    .eq('id', data.after_analysis_id)
    .single();

  const improvement = (afterAnalysis?.overall_score || 0) - (beforeAnalysis?.overall_score || 0);

  const { data: comparison, error: insertError } = await supabase
    .from('analysis_comparisons')
    .insert({
      user_id: data.user_id,
      before_analysis_id: data.before_analysis_id,
      after_analysis_id: data.after_analysis_id,
      overall_improvement: improvement
    })
    .select()
    .single();

  if (insertError) throw insertError;

  return createSuccessResponse(comparison);
});

/**
 * GET /api/analysis/compare
 * List comparisons for a user
 */
export const GET = withErrorHandling(async (request: Request) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return createErrorResponse(APIErrorCode.UNAUTHORIZED, 'Authentication required');
  }

  const { searchParams } = new URL(request.url);
  const targetUserId = searchParams.get('userId');

  if (!targetUserId) {
    return createErrorResponse(APIErrorCode.MISSING_REQUIRED_FIELDS, 'userId is required');
  }

  const { data: comparisons, error } = await supabase
    .from('analysis_comparisons')
    .select(`
      *,
      before:skin_analyses!analysis_comparisons_before_analysis_id_fkey(id, image_url, overall_score, analyzed_at),
      after:skin_analyses!analysis_comparisons_after_analysis_id_fkey(id, image_url, overall_score, analyzed_at)
    `)
    .eq('user_id', targetUserId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return createSuccessResponse(comparisons);
});
