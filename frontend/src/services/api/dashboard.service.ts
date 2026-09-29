/**
 * Dashboard API Service
 */

import { apiClient, retryRequest } from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';
import type {
  APIResponse,
  DashboardKPI,
  EnergyFlowData,
  DashboardChartData,
} from '@/types/api';

export const dashboardService = {
  /**
   * Get current KPI metrics
   */
  async getKPI(): Promise<DashboardKPI> {
    const response = await retryRequest(() =>
      apiClient.get<APIResponse<DashboardKPI>>(API_ENDPOINTS.dashboard.kpi)
    );
    return response.data.data;
  },

  /**
   * Get energy flow data
   */
  async getEnergyFlow(): Promise<EnergyFlowData> {
    const response = await apiClient.get<APIResponse<EnergyFlowData>>(
      API_ENDPOINTS.dashboard.energyFlow
    );
    return response.data.data;
  },

  /**
   * Get chart data for specified time range
   */
  async getChartData(hours: number = 24): Promise<DashboardChartData[]> {
    const response = await apiClient.get<APIResponse<DashboardChartData[]>>(
      API_ENDPOINTS.dashboard.charts,
      { params: { hours } }
    );
    return response.data.data;
  },
};
