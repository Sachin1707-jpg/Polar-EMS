/**
 * Failures/Emergency API Service
 */

import { apiClient } from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';
import type { APIResponse } from '@/types/api';

export interface FailureScenario {
  type: 'generator' | 'battery' | 'wind_drop' | 'load_spike' | 'renewable_failure' | 'communication';
  component?: string;
  severity: 'minor' | 'major' | 'critical';
}

export interface FailureSimulationResult {
  scenario: FailureScenario;
  timeline: Array<{
    timestamp: string;
    event: string;
    phase: 'failure' | 'detection' | 'impact' | 'decision' | 'action' | 'recovery';
    details: string;
  }>;
  impact: {
    affected_components: string[];
    energy_impact: number;
    critical_load_risk: 'none' | 'low' | 'medium' | 'high';
  };
  response: {
    ai_decision: string[];
    battery_action: string;
    generator_action: string;
    load_action: string;
    recovery_time: number;
  };
  critical_loads: Array<{
    name: string;
    status: 'protected' | 'at_risk' | 'compromised';
    power: number;
  }>;
}

export const failuresService = {
  /**
   * Simulate a failure scenario
   */
  async simulate(scenario: FailureScenario): Promise<FailureSimulationResult> {
    const response = await apiClient.post<APIResponse<FailureSimulationResult>>(
      API_ENDPOINTS.failures.simulate,
      scenario
    );
    return response.data.data;
  },

  /**
   * Get current failure/emergency status
   */
  async getStatus(): Promise<{
    active_failures: number;
    critical_load_status: 'protected' | 'at_risk' | 'compromised';
    backup_systems: Array<{ name: string; status: string }>;
  }> {
    const response = await apiClient.get<APIResponse<{
      active_failures: number;
      critical_load_status: 'protected' | 'at_risk' | 'compromised';
      backup_systems: Array<{ name: string; status: string }>;
    }>>(API_ENDPOINTS.failures.status);
    return response.data.data;
  },

  /**
   * Get failure history
   */
  async getHistory(days: number = 30): Promise<Array<{
    timestamp: string;
    type: string;
    severity: string;
    duration: number;
    resolved: boolean;
  }>> {
    const response = await apiClient.get<APIResponse<Array<{
      timestamp: string;
      type: string;
      severity: string;
      duration: number;
      resolved: boolean;
    }>>>(
      API_ENDPOINTS.failures.history,
      { params: { days } }
    );
    return response.data.data;
  },
};
