// ============================================
// POLAR-EMS TypeScript Type Definitions
// ============================================

// ==================== User & Auth ====================
export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'operator' | 'viewer';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// ==================== Station & Equipment ====================
export interface Station {
  id: number;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Equipment {
  id: number;
  station_id: number;
  name: string;
  type: 'diesel_generator' | 'wind_turbine' | 'battery' | 'load';
  capacity_kw: number;
  efficiency: number;
  status: 'online' | 'offline' | 'maintenance' | 'fault';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== Energy Data ====================
export interface EnergyData {
  id: number;
  station_id: number;
  timestamp: string;
  load_kw: number;
  wind_generation_kw: number;
  diesel_generation_kw: number;
  battery_charge_kw: number;
  battery_discharge_kw: number;
  battery_soc_percent: number;
  fuel_consumption_lph: number;
  renewable_percentage: number;
  is_simulated: boolean;
  created_at: string;
}

// ==================== Weather ====================
export interface WeatherData {
  id: number;
  station_id: number;
  timestamp: string;
  temperature_c: number;
  wind_speed_ms: number;
  wind_direction_deg: number;
  pressure_hpa: number;
  humidity_percent: number;
  cloud_cover_percent: number;
  visibility_km: number;
  is_simulated: boolean;
  created_at: string;
}

export interface WeatherForecast {
  timestamp: string;
  temperature_c: number;
  wind_speed_ms: number;
  wind_direction_deg: number;
  pressure_hpa: number;
  humidity_percent: number;
  cloud_cover_percent: number;
  precipitation_probability: number;
}

// ==================== Forecasts ====================
export interface LoadForecast {
  id: number;
  station_id: number;
  forecast_timestamp: string;
  predicted_load_kw: number;
  confidence_lower: number;
  confidence_upper: number;
  model_version: string;
  features_used: Record<string, number>;
  created_at: string;
}

export interface WindForecast {
  id: number;
  station_id: number;
  forecast_timestamp: string;
  predicted_power_kw: number;
  wind_speed_ms: number;
  confidence_lower: number;
  confidence_upper: number;
  created_at: string;
}

export interface ForecastAccuracy {
  mae: number;
  rmse: number;
  mape: number;
  r2_score: number;
}

// ==================== Recommendations ====================
export interface Recommendation {
  id: number;
  station_id: number;
  timestamp: string;
  category: 'energy_optimization' | 'maintenance' | 'efficiency' | 'safety' | 'cost_reduction';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  reasoning: string;
  expected_impact: string;
  estimated_savings_kwh?: number;
  estimated_savings_cost?: number;
  status: 'pending' | 'accepted' | 'rejected' | 'implemented';
  created_by: 'ai' | 'operator';
  is_simulated: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== Optimization ====================
export interface OptimizationSchedule {
  id: number;
  station_id: number;
  schedule_start: string;
  schedule_end: string;
  diesel_schedule: number[];
  battery_schedule: number[];
  total_fuel_consumption: number;
  total_cost: number;
  renewable_percentage: number;
  optimization_status: 'optimal' | 'suboptimal' | 'infeasible';
  solver_time_seconds: number;
  created_at: string;
}

// ==================== Alerts ====================
export interface Alert {
  id: number;
  station_id: number;
  timestamp: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'equipment' | 'power' | 'weather' | 'fuel' | 'battery' | 'system';
  title: string;
  message: string;
  source: string;
  is_acknowledged: boolean;
  acknowledged_by?: number;
  acknowledged_at?: string;
  is_resolved: boolean;
  resolved_by?: number;
  resolved_at?: string;
  resolution_notes?: string;
  is_simulated: boolean;
  created_at: string;
}

export interface AlertSummary {
  critical_count: number;
  warning_count: number;
  info_count: number;
  unacknowledged_count: number;
}

// ==================== Dashboard ====================
export interface SystemStatus {
  station_id: number;
  timestamp: string;
  system_status: 'normal' | 'warning' | 'critical';
  current_load_kw: number;
  wind_generation_kw: number;
  diesel_generation_kw: number;
  battery_soc_percent: number;
  battery_status: 'charging' | 'discharging' | 'idle' | 'fault';
  fuel_level_liters: number;
  fuel_level_percent: number;
  daily_fuel_consumed_liters: number;
  renewable_percentage: number;
  active_alerts_count: number;
  equipment_online_count: number;
  equipment_total_count: number;
  weather: {
    temperature_c: number;
    wind_speed_ms: number;
    conditions: string;
  };
  is_simulated: boolean;
}

export interface EnergyHistory {
  timestamp: string;
  load_kw: number;
  wind_generation_kw: number;
  diesel_generation_kw: number;
  battery_soc_percent: number;
  renewable_percentage: number;
}

// ==================== Analytics ====================
export interface EnergyMetrics {
  total_consumption_kwh: number;
  renewable_generation_kwh: number;
  diesel_generation_kwh: number;
  renewable_percentage: number;
  total_fuel_consumed_liters: number;
  fuel_cost: number;
  co2_emissions_kg: number;
  battery_cycles: number;
  system_efficiency: number;
}

export interface PerformanceMetrics {
  uptime_percentage: number;
  average_load_kw: number;
  peak_load_kw: number;
  load_factor: number;
  capacity_factor: number;
}

// ==================== UI State Types ====================
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface ChartDataPoint {
  timestamp: string;
  [key: string]: number | string;
}

// ==================== Component Props Types ====================
export interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'bordered' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'critical' | 'warning' | 'info' | 'success' | 'default';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface KPICardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  status?: 'critical' | 'warning' | 'normal' | 'good';
  icon?: React.ReactNode;
  loading?: boolean;
  className?: string;
}

export interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'warning' | 'critical' | 'normal';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animate?: boolean;
}

// ==================== Store Types ====================
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: ApiError | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: ApiError | null) => void;
}

export interface DashboardState {
  systemStatus: SystemStatus | null;
  energyHistory: EnergyHistory[];
  loading: boolean;
  error: ApiError | null;
  setSystemStatus: (status: SystemStatus) => void;
  setEnergyHistory: (history: EnergyHistory[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: ApiError | null) => void;
}

export interface AlertState {
  alerts: Alert[];
  summary: AlertSummary | null;
  unreadCount: number;
  loading: boolean;
  error: ApiError | null;
  setAlerts: (alerts: Alert[]) => void;
  setSummary: (summary: AlertSummary) => void;
  setUnreadCount: (count: number) => void;
  acknowledgeAlert: (alertId: number) => void;
  resolveAlert: (alertId: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: ApiError | null) => void;
}

// ==================== WebSocket Types ====================
export interface WebSocketMessage {
  type: 'system_update' | 'alert' | 'recommendation' | 'connection' | 'error';
  data: unknown;
  timestamp: string;
}

export interface SystemUpdateMessage {
  type: 'system_update';
  data: SystemStatus;
  timestamp: string;
}

export interface AlertMessage {
  type: 'alert';
  data: Alert;
  timestamp: string;
}

export interface RecommendationMessage {
  type: 'recommendation';
  data: Recommendation;
  timestamp: string;
}
