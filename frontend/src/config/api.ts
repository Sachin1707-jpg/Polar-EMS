/**
 * API Configuration
 * Central configuration for API endpoints and settings
 */

export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  wsURL: import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  dataMode: (import.meta.env.VITE_DATA_MODE || 'simulation') as 'simulation' | 'live',
  debug: import.meta.env.VITE_API_DEBUG === 'true',
};

export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: '/api/v1/auth/login',
    logout: '/api/v1/auth/logout',
    refresh: '/api/v1/auth/refresh',
    me: '/api/v1/auth/me',
  },
  // Dashboard
  dashboard: {
    kpi: '/api/v1/dashboard/kpi',
    energyFlow: '/api/v1/dashboard/energy-flow',
    charts: '/api/v1/dashboard/charts',
  },
  // Weather
  weather: {
    current: '/api/v1/weather/current',
    forecast: '/api/v1/weather/forecast',
    impact: '/api/v1/weather/energy-impact',
    risk: '/api/v1/weather/risk',
  },
  // Forecasts
  forecast: {
    load: '/api/v1/forecasts/load',
    wind: '/api/v1/forecasts/wind',
    metrics: '/api/v1/forecasts/metrics',
    summary: '/api/v1/forecasts/summary',
  },
  // Recommendations
  recommendations: {
    list: '/api/v1/recommendations',
    accept: (id: number) => `/api/v1/recommendations/${id}/accept`,
    dismiss: (id: number) => `/api/v1/recommendations/${id}/dismiss`,
    factors: (id: number) => `/api/v1/recommendations/${id}/factors`,
  },
  // Optimization
  optimization: {
    run: '/api/v1/optimization/run',
    schedule: '/api/v1/optimization/schedule',
    comparison: '/api/v1/optimization/comparison',
  },
  // Battery
  battery: {
    status: '/api/v1/battery/status',
    history: '/api/v1/battery/history',
    soc: '/api/v1/battery/soc',
  },
  // Generators
  generators: {
    status: '/api/v1/generators/status',
    history: '/api/v1/generators/history',
    control: (id: number) => `/api/v1/generators/${id}/control`,
  },
  // Alerts
  alerts: {
    list: '/api/v1/alerts',
    acknowledge: (id: number) => `/api/v1/alerts/${id}/acknowledge`,
    dismiss: (id: number) => `/api/v1/alerts/${id}/dismiss`,
    dailyReport: '/api/v1/alerts/daily-report',
  },
  // Emergency/Failures
  failures: {
    simulate: '/api/v1/failures/simulate',
    status: '/api/v1/failures/status',
    history: '/api/v1/failures/history',
  },
  // Analytics
  analytics: {
    summary: '/api/v1/analytics/summary',
    performance: '/api/v1/analytics/performance',
    comparison: '/api/v1/analytics/baseline-comparison',
    charts: '/api/v1/analytics/charts',
  },
  // Station
  station: {
    components: '/api/v1/station/components',
    component: (id: string) => `/api/v1/station/components/${id}`,
    flows: '/api/v1/station/energy-flows',
  },
};
