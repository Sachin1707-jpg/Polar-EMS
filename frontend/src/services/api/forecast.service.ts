/**
 * Forecast API Service
 */

import { apiClient } from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';
import type {
  APIResponse,
  LoadForecast,
  WindForecast,
  ForecastMetrics,
  ForecastSummary,
} from '@/types/api';

export const forecastService = {
  /**
   * Get load forecast
   */
  async getLoadForecast(horizon: number = 24): Promise<LoadForecast[]> {
    const response = await apiClient.get<APIResponse<LoadForecast[]>>(
      API_ENDPOINTS.forecast.load,
      { params: { horizon } }
    );
    return response.data.data;
  },

  /**
   * Get wind power forecast
   */
  async getWindForecast(horizon: number = 24): Promise<WindForecast[]> {
    const response = await apiClient.get<APIResponse<WindForecast[]>>(
      API_ENDPOINTS.forecast.wind,
      { params: { horizon } }
    );
    return response.data.data;
  },

  /**
   * Get forecast model metrics
   */
  async getMetrics(): Promise<{
    load: ForecastMetrics;
    wind: ForecastMetrics;
  }> {
    const response = await apiClient.get<
      APIResponse<{ load: ForecastMetrics; wind: ForecastMetrics }>
    >(API_ENDPOINTS.forecast.metrics);
    return response.data.data;
  },

  /**
   * Get forecast summary
   */
  async getSummary(): Promise<ForecastSummary> {
    const response = await apiClient.get<APIResponse<ForecastSummary>>(
      API_ENDPOINTS.forecast.summary
    );
    return response.data.data;
  },
};
