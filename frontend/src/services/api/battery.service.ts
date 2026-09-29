/**
 * Battery API Service
 */

import { apiClient } from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';
import type { APIResponse, BatteryStatus } from '@/types/api';

export const batteryService = {
  /**
   * Get current battery status
   */
  async getStatus(): Promise<BatteryStatus> {
    const response = await apiClient.get<APIResponse<BatteryStatus>>(
      API_ENDPOINTS.battery.status
    );
    return response.data.data;
  },

  /**
   * Get battery history
   */
  async getHistory(hours: number = 24): Promise<Array<{
    timestamp: string;
    soc: number;
    power: number;
    temperature: number;
  }>> {
    const response = await apiClient.get<APIResponse<Array<{
      timestamp: string;
      soc: number;
      power: number;
      temperature: number;
    }>>>(
      API_ENDPOINTS.battery.history,
      { params: { hours } }
    );
    return response.data.data;
  },

  /**
   * Get SOC forecast
   */
  async getSOCForecast(hours: number = 24): Promise<Array<{
    timestamp: string;
    soc: number;
  }>> {
    const response = await apiClient.get<APIResponse<Array<{
      timestamp: string;
      soc: number;
    }>>>(
      API_ENDPOINTS.battery.soc,
      { params: { hours } }
    );
    return response.data.data;
  },
};
