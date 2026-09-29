/**
 * Alerts API Service
 */

import { apiClient } from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';
import type { APIResponse, Alert, DailyReport } from '@/types/api';

export const alertsService = {
  /**
   * Get all alerts
   */
  async getAll(filters?: {
    severity?: 'info' | 'warning' | 'critical';
    status?: 'unread' | 'read' | 'acknowledged' | 'resolved';
  }): Promise<Alert[]> {
    const response = await apiClient.get<APIResponse<Alert[]>>(
      API_ENDPOINTS.alerts.list,
      { params: filters }
    );
    return response.data.data;
  },

  /**
   * Acknowledge an alert
   */
  async acknowledge(id: number): Promise<void> {
    await apiClient.post(API_ENDPOINTS.alerts.acknowledge(id));
  },

  /**
   * Dismiss an alert
   */
  async dismiss(id: number): Promise<void> {
    await apiClient.post(API_ENDPOINTS.alerts.dismiss(id));
  },

  /**
   * Get daily energy report
   */
  async getDailyReport(date?: string): Promise<DailyReport> {
    const response = await apiClient.get<APIResponse<DailyReport>>(
      API_ENDPOINTS.alerts.dailyReport,
      { params: { date } }
    );
    return response.data.data;
  },
};
