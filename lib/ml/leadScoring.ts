export interface LeadData {
  urgency_score: number;
  days_since_contact: number;
  response_rate: number;
  budget_specified: boolean;
  contact_completeness: number;
  skin_age: number;
  concern_count: number;
  previous_treatment_count: number;
}

export interface PredictionResult {
  score: number; // 0-100
  confidence: number; // 0-1
  factors: string[];
}

/**
 * Predicts the lead score based on lead data.
 * Currently uses a heuristic model, but designed to swap with an ML model API.
 */
export async function predictLeadScore(
  leadData: LeadData,
  clinicId: string
): Promise<PredictionResult> {
  // TODO: Replace with actual ML model API call
  // const response = await fetch('/api/ml/predict-lead-score', ...);
  
  // Heuristic Logic (Placeholder for ML Model)
  let score = 0;
  const factors: string[] = [];

  // 1. Urgency (Weight: 30%)
  score += leadData.urgency_score * 0.3;
  if (leadData.urgency_score > 70) factors.push('High urgency detected');

  // 2. Engagement (Weight: 20%)
  const engagementScore = Math.min(leadData.response_rate * 100, 100);
  score += engagementScore * 0.2;
  if (engagementScore > 50) factors.push('Good engagement rate');

  // 3. Completeness (Weight: 10%)
  score += leadData.contact_completeness * 10;
  if (leadData.contact_completeness >= 0.8) factors.push('Complete profile');

  // 4. Budget (Weight: 15%)
  if (leadData.budget_specified) {
    score += 15;
    factors.push('Budget specified');
  }

  // 5. Clinical Factors (Weight: 25%)
  // Complex factors based on skin age vs real age, concern count
  const clinicalScore = Math.min((leadData.concern_count * 5) + (leadData.previous_treatment_count * 5), 100);
  score += clinicalScore * 0.25;
  if (leadData.concern_count > 3) factors.push('Multiple concerns identified');

  // Normalize
  score = Math.min(Math.max(Math.round(score), 0), 100);

  return {
    score,
    confidence: 0.85, // Heuristic confidence
    factors
  };
}
