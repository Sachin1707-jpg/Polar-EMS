/**
 * Station API Service
 */

import { apiClient } from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';
import type { APIResponse, StationComponent, EnergyFlow } from '@/types/api';

export const stationService = {
  /**
   * Get all station components
   */
  async getComponents(): Promise<StationComponent[]> {
    const response = await apiClient.get<APIResponse<StationComponent[]>>(
      API_ENDPOINTS.station.components
    );
    return response.data.data;
  },

  /**
   * Get specific component details
   */
  async getComponent(id: string): Promise<StationComponent> {
    const response = await apiClient.get<APIResponse<StationComponent>>(
      API_ENDPOINTS.station.component(id)
    );
    return response.data.data;
  },

  /**
   * Get energy flows
   */
  async getEnergyFlows(): Promise<EnergyFlow[]> {
    const response = await apiClient.get<APIResponse<EnergyFlow[]>>(
      API_ENDPOINTS.station.flows
    );
    return response.data.data;
  },
};
