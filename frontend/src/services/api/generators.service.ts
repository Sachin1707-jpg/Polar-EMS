/**
 * Generators API Service
 */

import { apiClient } from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';
import type { APIResponse, GeneratorStatus } from '@/types/api';

export const generatorsService = {
  /**
   * Get all generators status
   */
  async getStatus(): Promise<GeneratorStatus[]> {
    const response = await apiClient.get<APIResponse<GeneratorStatus[]>>(
      API_ENDPOINTS.generators.status
    );
    return response.data.data;
  },

  /**
   * Get generator history
   */
  async getHistory(generatorId: number, hours: number = 24): Promise<Array<{
    timestamp: string;
    power: number;
    fuel_rate: number;
    temperature: number;
  }>> {
    const response = await apiClient.get<APIResponse<Array<{
      timestamp: string;
      power: number;
      fuel_rate: number;
      temperature: number;
    }>>>(
      API_ENDPOINTS.generators.history,
      { params: { id: generatorId, hours } }
    );
    return response.data.data;
  },

  /**
   * Control generator (start/stop)
   */
  async control(generatorId: number, action: 'start' | 'stop'): Promise<void> {
    await apiClient.post(API_ENDPOINTS.generators.control(generatorId), { action });
  },
};
