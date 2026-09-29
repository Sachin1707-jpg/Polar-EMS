/**
 * API Response Types
 * TypeScript interfaces for all API responses
 */

// Generic API response wrapper
export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface APIError {
  error: string;
  message: string;
  detail?: string;
  status_code: number;
}

// ========== Dashboard API Types ==========
export interface DashboardKPI {
  current_load: number;
  renewable_power: number;
  battery_soc: number;
  diesel_output: number;
  renewable_share: number;
  fuel_consumption: number;
  critical_load_status: 'protected' | 'at_risk' | 'compromised';
  system_status: 'normal' | 'warning' | 'critical';
}

export interface EnergyFlowData {
  wind_to_load: number;
  wind_to_battery: number;
  diesel_to_load: number;
  battery_to_load: number;
  battery_from_wind: number;
  total_generation: number;
  total_load: number;
}

export interface DashboardChartData {
  timestamp: string;
  load: number;
  wind: number;
  diesel: number;
  battery: number;
}

// ========== Weather API Types ==========
export interface CurrentWeather {
  temperature: number;
  wind_speed: number;
  wind_direction: number;
  pressure: number;
  humidity: number;
  condition: string;
  timestamp: string;
}

export interface WeatherForecast {
  timestamp: string;
  temperature: number;
  wind_speed: number;
  wind_direction: number;
  condition: string;
}

export interface WeatherImpact {
  wind_to_energy: {
    current_wind: number;
    predicted_generation: number;
    capacity_factor: number;
  };
  temperature_impact: {
    battery_constraints: string;
    heating_demand: number;
  };
  risk_assessment: 'normal' | 'high_wind' | 'low_wind' | 'extreme_cold';
}

// ========== Forecast API Types ==========
export interface LoadForecast {
  timestamp: string;
  actual: number | null;
  predicted: number;
  confidence_lower: number;
  confidence_upper: number;
}

export interface WindForecast {
  timestamp: string;
  actual: number | null;
  predicted: number;
  confidence_lower: number;
  confidence_upper: number;
}

export interface ForecastMetrics {
  mae: number;
  rmse: number;
  mape: number;
  r2: number;
  model: string;
  last_updated: string;
}

export interface ForecastSummary {
  expected_load: number;
  expected_renewable: number;
  expected_deficit: number;
  expected_surplus: number;
  insights: string[];
}

// ========== Recommendations API Types ==========
export interface Recommendation {
  id: number;
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  recommendation: string;
  reason: string;
  expected_impact: string;
  related_data: Array<{
    label: string;
    value: string;
    status: 'good' | 'warning' | 'critical';
  }>;
  timestamp: string;
  status: 'new' | 'accepted' | 'dismissed' | 'applied';
}

export interface RecommendationFactors {
  factors: Array<{
    name: string;
    value: string;
    weight: 'high' | 'medium' | 'low';
  }>;
}

// ========== Optimization API Types ==========
export interface OptimizationInput {
  forecasted_load: number[];
  forecasted_wind: number[];
  battery_soc: number;
  generator_availability: {
    gen1: boolean;
    gen2: boolean;
    gen3: boolean;
  };
  critical_load_req: number;
  reserve_req: number;
}

export interface DispatchSchedule {
  hour: number;
  time: string;
  load: number;
  wind: number;
  battery_charge: number;
  battery_discharge: number;
  gen1: number;
  gen2: number;
  reserve: number;
  action: string;
}

export interface OptimizationResult {
  schedule: DispatchSchedule[];
  decisions: {
    generator: string[];
    battery: string[];
    load_shifting: string[];
    renewable_utilization: string;
  };
  why_schedule: string[];
  comparison: {
    rule_based: {
      fuel_consumed: number;
      renewable_share: number;
      unmet_load: number;
    };
    ai_optimized: {
      fuel_consumed: number;
      renewable_share: number;
      unmet_load: number;
    };
    savings: {
      fuel_saved: number;
      renewable_increase: number;
      reliability: number;
    };
  };
}

// ========== Battery API Types ==========
export interface BatteryStatus {
  soc: number;
  power: number; // negative = charging
  voltage: number;
  current: number;
  temperature: number;
  health: number;
  status: 'charging' | 'discharging' | 'idle';
  cycles: number;
}

// ========== Generators API Types ==========
export interface GeneratorStatus {
  id: number;
  name: string;
  status: 'online' | 'offline' | 'standby';
  power: number;
  runtime: number;
  fuel_rate: number;
  temperature: number;
  health: number;
}

// ========== Alerts API Types ==========
export interface Alert {
  id: number;
  severity: 'info' | 'warning' | 'critical';
  type: string;
  title: string;
  description: string;
  timestamp: string;
  affected_component: string;
  recommended_action: string;
  status: 'unread' | 'read' | 'acknowledged' | 'resolved';
}

export interface DailyReport {
  date: string;
  energy_consumed: number;
  renewable_contribution: number;
  diesel_consumption: number;
  fuel_saving: number;
  battery_activity: {
    charged: number;
    discharged: number;
    cycles: number;
  };
  critical_load_events: number;
  major_alerts: {
    critical: number;
    warning: number;
  };
  ai_recommendations: number;
  system_health: 'excellent' | 'good' | 'fair' | 'poor';
  summary: string;
}

// ========== Analytics API Types ==========
export interface AnalyticsSummary {
  total_energy: number;
  renewable_energy: number;
  diesel_energy: number;
  fuel_consumption: number;
  fuel_saved_percent: number;
  renewable_share: number;
  unmet_load: number;
  generator_runtime: number;
}

export interface BaselineComparison {
  metric: string;
  baseline: number;
  ai: number;
  improvement: number;
  unit: string;
}

export interface ChartDataPoint {
  date: string;
  [key: string]: string | number;
}

// ========== Station API Types ==========
export interface StationComponent {
  id: string;
  type: string;
  name: string;
  icon: string;
  power: number;
  status: 'online' | 'offline' | 'warning';
  health: number;
  description: string;
  recent_events: string[];
  ai_recommendation: string | null;
  alerts: number;
}

export interface EnergyFlow {
  from: string;
  to: string;
  power: number;
  active: boolean;
}

// ========== WebSocket Types ==========
export interface WSMessage<T = any> {
  type: string;
  data: T;
  timestamp: string;
}

export interface WSUpdateMessage {
  component: string;
  field: string;
  value: any;
}
