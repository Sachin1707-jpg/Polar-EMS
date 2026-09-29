/**
 * Recommendations API Service
 */

import { apiClient } from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';
import type { APIResponse, Recommendation, RecommendationFactors } from '@/types/api';

export const recommendationsService = {
  /**
   * Get all recommendations
   */
  async getAll(): Promise<Recommendation[]> {
    const response = await apiClient.get<APIResponse<Recommendation[]>>(
      API_ENDPOINTS.recommendations.list
    );
    return response.data.data;
  },

  /**
   * Accept a recommendation
   */
  async accept(id: number): Promise<void> {
    await apiClient.post(API_ENDPOINTS.recommendations.accept(id));
  },

  /**
   * Dismiss a recommendation
   */
  async dismiss(id: number): Promise<void> {
    await apiClient.post(API_ENDPOINTS.recommendations.dismiss(id));
  },

  /**
   * Get recommendation decision factors
   */
  async getFactors(id: number): Promise<RecommendationFactors> {
    const response = await apiClient.get<APIResponse<RecommendationFactors>>(
      API_ENDPOINTS.recommendations.factors(id)
    );
    return response.data.data;
  },
};
