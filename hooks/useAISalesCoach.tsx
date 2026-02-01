'use client';

import { useState, useCallback } from 'react';
import { CustomerContext, SalesCoachResponse } from '@/lib/ai/salesCoach';

interface UseAISalesCoachReturn {
  advice: SalesCoachResponse | null;
  loading: boolean;
  error: string | null;
  getAdvice: (context: CustomerContext, conversation: string) => Promise<void>;
  handleObjection: (objection: string, context: CustomerContext) => Promise<any>;
  getUpsellRecommendations: (context: CustomerContext, treatments: string[]) => Promise<any>;
  calculateDealProbability: (context: CustomerContext, metrics: any) => Promise<any>;
}

export function useAISalesCoach(): UseAISalesCoachReturn {
  const [advice, setAdvice] = useState<SalesCoachResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAdvice = useCallback(async (context: CustomerContext, conversation: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/sales-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_advice',
          context,
          data: { conversation }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI advice');
      }

      const result = await response.json();
      if (result.success) {
        setAdvice(result.advice);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('AI Sales Coach Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleObjection = useCallback(async (objection: string, context: CustomerContext) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/sales-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'handle_objection',
          context,
          data: { objection }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to handle objection');
      }

      const result = await response.json();
      return result.success ? result.response : null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Objection Handler Error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getUpsellRecommendations = useCallback(async (
    context: CustomerContext,
    treatments: string[]
  ) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/sales-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_upsell',
          context,
          data: { currentTreatments: treatments }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get upsell recommendations');
      }

      const result = await response.json();
      return result.success ? result.recommendations : null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Upsell Recommender Error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateDealProbability = useCallback(async (
    context: CustomerContext,
    metrics: any
  ) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/sales-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'calculate_probability',
          context,
          data: { conversationMetrics: metrics }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to calculate deal probability');
      }

      const result = await response.json();
      return result.success ? result.probability : null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Deal Probability Error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    advice,
    loading,
    error,
    getAdvice,
    handleObjection,
    getUpsellRecommendations,
    calculateDealProbability
  };
}
