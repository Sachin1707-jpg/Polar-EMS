/**
 * useAPI Hook
 * Custom hook for API calls with loading, error, and retry logic
 */

import { useState, useEffect, useCallback } from 'react';
import { AxiosError } from 'axios';
import { useDataMode } from '@/contexts/DataModeContext';

interface UseAPIOptions<T> {
  /**
   * Function to fetch data from API
   */
  apiFn: () => Promise<T>;
  
  /**
   * Mock data to use in simulation mode
   */
  mockData?: T;
  
  /**
   * Whether to fetch data immediately on mount
   */
  immediate?: boolean;
  
  /**
   * Dependencies array for refetching
   */
  deps?: any[];
  
  /**
   * Polling interval in milliseconds (0 = no polling)
   */
  pollInterval?: number;
}

interface UseAPIReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  reset: () => void;
}

export function useAPI<T>(options: UseAPIOptions<T>): UseAPIReturn<T> {
  const { apiFn, mockData, immediate = true, deps = [], pollInterval = 0 } = options;
  const { isSimulation } = useDataMode();

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(immediate);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    // In simulation mode, use mock data if available
    if (isSimulation && mockData !== undefined) {
      setData(mockData);
      setLoading(false);
      setError(null);
      return;
    }

    // Otherwise, fetch from API
    setLoading(true);
    setError(null);

    try {
      const result = await apiFn();
      setData(result);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const errorMessage =
        axiosError.response?.data?.message ||
        axiosError.message ||
        'An error occurred while fetching data';
      setError(errorMessage);
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  }, [apiFn, mockData, isSimulation]);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  // Initial fetch
  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [immediate, ...deps]);

  // Polling
  useEffect(() => {
    if (pollInterval > 0) {
      const interval = setInterval(fetchData, pollInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, pollInterval]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    reset,
  };
}
