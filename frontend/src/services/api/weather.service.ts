/**
 * Weather API Service
 */

import { apiClient } from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';
import type {
  APIResponse,
  CurrentWeather,
  WeatherForecast,
  WeatherImpact,
} from '@/types/api';

export const weatherService = {
  /**
   * Get current weather conditions
   */
  async getCurrent(): Promise<CurrentWeather> {
    const response = await apiClient.get<APIResponse<CurrentWeather>>(
      API_ENDPOINTS.weather.current
    );
    return response.data.data;
  },

  /**
   * Get weather forecast
   */
  async getForecast(hours: number = 48): Promise<WeatherForecast[]> {
    const response = await apiClient.get<APIResponse<WeatherForecast[]>>(
      API_ENDPOINTS.weather.forecast,
      { params: { hours } }
    );
    return response.data.data;
  },

  /**
   * Get weather energy impact analysis
   */
  async getImpact(): Promise<WeatherImpact> {
    const response = await apiClient.get<APIResponse<WeatherImpact>>(
      API_ENDPOINTS.weather.impact
    );
    return response.data.data;
  },

  /**
   * Get weather risk assessment
   */
  async getRisk(): Promise<{ risk: string; message: string }> {
    const response = await apiClient.get<APIResponse<{ risk: string; message: string }>>(
      API_ENDPOINTS.weather.risk
    );
    return response.data.data;
  },
};
