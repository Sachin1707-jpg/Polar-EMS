/**
 * Analytics API Service
 */

import { apiClient } from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';
import type {
  APIResponse,
  AnalyticsSummary,
  BaselineComparison,
  ChartDataPoint,
} from '@/types/api';

export const analyticsService = {
  /**
   * Get analytics summary
   */
  async getSummary(dateRange?: { start: string; end: string }): Promise<AnalyticsSummary> {
    const response = await apiClient.get<APIResponse<AnalyticsSummary>>(
      API_ENDPOINTS.analytics.summary,
      { params: dateRange }
    );
    return response.data.data;
  },

  /**
   * Get performance metrics
   */
  async getPerformance(dateRange?: { start: string; end: string }): Promise<any> {
    const response = await apiClient.get<APIResponse<any>>(
      API_ENDPOINTS.analytics.performance,
      { params: dateRange }
    );
    return response.data.data;
  },

  /**
   * Get baseline comparison
   */
  async getBaselineComparison(
    dateRange?: { start: string; end: string }
  ): Promise<BaselineComparison[]> {
    const response = await apiClient.get<APIResponse<BaselineComparison[]>>(
      API_ENDPOINTS.analytics.comparison,
      { params: dateRange }
    );
    return response.data.data;
  },

  /**
   * Get chart data
   */
  async getChartData(
    chartType: string,
    dateRange?: { start: string; end: string }
  ): Promise<ChartDataPoint[]> {
    const response = await apiClient.get<APIResponse<ChartDataPoint[]>>(
      API_ENDPOINTS.analytics.charts,
      { params: { type: chartType, ...dateRange } }
    );
    return response.data.data;
  },
};
