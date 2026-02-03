'use client';

import { useState, useCallback } from 'react';
import { VoCData } from '@/lib/analytics/vocService';

export const useVoCData = (clinicId?: string) => {
  const [data, setData] = useState<VoCData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVoCData = useCallback(async () => {
    if (!clinicId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/analytics/voc?clinicId=${clinicId}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch VoC data');
      }
    } catch (err) {
      console.error('Error fetching VoC data:', err);
      setError('Failed to load Voice of Customer data');
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  return {
    data,
    loading,
    error,
    fetchVoCData
  };
};
