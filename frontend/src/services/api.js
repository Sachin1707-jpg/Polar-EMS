/**
 * API Service for POLAR-EMS
 * Handles all HTTP requests to the backend
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication
export const authAPI = {
  login: (username, password) =>
    api.post('/api/v1/auth/login', { username, password }),
  
  register: (userData) =>
    api.post('/api/v1/auth/register', userData),
  
  getCurrentUser: () =>
    api.get('/api/v1/auth/me'),
  
  logout: () =>
    api.post('/api/v1/auth/logout'),
};

// Dashboard
export const dashboardAPI = {
  getSystemStatus: () =>
    api.get('/api/v1/dashboard/status'),
  
  getEnergyHistory: (hours = 24) =>
    api.get(`/api/v1/dashboard/energy-history?hours=${hours}`),
  
  getEquipmentStatus: () =>
    api.get('/api/v1/dashboard/equipment-status'),
};

// Weather
export const weatherAPI = {
  getCurrentWeather: () =>
    api.get('/api/v1/weather/current'),
  
  getWeatherForecast: (hours = 48) =>
    api.get(`/api/v1/weather/forecast?hours=${hours}`),
};

// Forecasting
export const forecastAPI = {
  getLoadForecast: (hours = 48) =>
    api.get(`/api/v1/forecasts/load?hours=${hours}`),
  
  getWindForecast: (hours = 48) =>
    api.get(`/api/v1/forecasts/wind?hours=${hours}`),
  
  getForecastAccuracy: () =>
    api.get('/api/v1/forecasts/accuracy'),
};

// AI Recommendations
export const recommendationAPI = {
  getRecommendations: (limit = 10) =>
    api.get(`/api/v1/recommendations?limit=${limit}`),
  
  acceptRecommendation: (id) =>
    api.post(`/api/v1/recommendations/${id}/accept`),
  
  rejectRecommendation: (id) =>
    api.post(`/api/v1/recommendations/${id}/reject`),
  
  getAIExplanation: (decisionType, context) =>
    api.post('/api/v1/recommendations/explain', { decisionType, context }),
};

// Optimization
export const optimizationAPI = {
  getCurrentSchedule: () =>
    api.get('/api/v1/optimization/schedule'),
  
  getScheduleHistory: () =>
    api.get('/api/v1/optimization/history'),
  
  runOptimization: (parameters) =>
    api.post('/api/v1/optimization/run', parameters),
};

// Alerts
export const alertAPI = {
  getActiveAlerts: () =>
    api.get('/api/v1/alerts/active'),
  
  getAlertHistory: (days = 7) =>
    api.get(`/api/v1/alerts/history?days=${days}`),
  
  acknowledgeAlert: (id) =>
    api.post(`/api/v1/alerts/${id}/acknowledge`),
  
  resolveAlert: (id, notes) =>
    api.post(`/api/v1/alerts/${id}/resolve`, { notes }),
  
  getAlertSummary: () =>
    api.get('/api/v1/alerts/summary'),
};

// Analytics
export const analyticsAPI = {
  getPerformanceMetrics: (days = 30) =>
    api.get(`/api/v1/analytics/performance?days=${days}`),
  
  getFuelAnalysis: (days = 30) =>
    api.get(`/api/v1/analytics/fuel?days=${days}`),
  
  getRenewableAnalysis: (days = 30) =>
    api.get(`/api/v1/analytics/renewable?days=${days}`),
  
  exportData: (startDate, endDate) =>
    api.get(`/api/v1/analytics/export?start=${startDate}&end=${endDate}`),
};

export default api;
