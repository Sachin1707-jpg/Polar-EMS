/**
 * Optimization API Service
 */

import { apiClient } from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';
import type {
  APIResponse,
  OptimizationInput,
  OptimizationResult,
} from '@/types/api';

export const optimizationService = {
  /**
   * Run optimization
   */
  async run(input: OptimizationInput): Promise<OptimizationResult> {
    const response = await apiClient.post<APIResponse<OptimizationResult>>(
      API_ENDPOINTS.optimization.run,
      input
    );
    return response.data.data;
  },

  /**
   * Get latest optimization schedule
   */
  async getSchedule(): Promise<OptimizationResult> {
    const response = await apiClient.get<APIResponse<OptimizationResult>>(
      API_ENDPOINTS.optimization.schedule
    );
    return response.data.data;
  },

  /**
   * Get baseline comparison
   */
  async getComparison(): Promise<OptimizationResult['comparison']> {
    const response = await apiClient.get<APIResponse<OptimizationResult['comparison']>>(
      API_ENDPOINTS.optimization.comparison
    );
    return response.data.data;
  },
};
