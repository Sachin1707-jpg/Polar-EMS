/**
 * Simulation API Service
 * Handles all simulation-related API calls
 */
import axios from '@/lib/axios';

// Types
export interface SimulationEnvironment {
  temperature_c: number;
  wind_speed_ms: number;
  wind_direction: string;
  weather_condition: string;
  polar_season: string;
  solar_availability: number;
}

export interface SimulationLoad {
  base_load_kw: number;
  research_load_kw: number;
  habitation_load_kw: number;
  communication_load_kw: number;
  critical_load_kw: number;
  deferrable_load_kw: number;
}

export interface SimulationRenewable {
  wind_turbine_capacity_kw: number;
  wind_turbine_count: number;
  wind_turbine_efficiency: number;
  solar_capacity_kw: number;
}

export interface SimulationBattery {
  battery_capacity_kwh: number;
  battery_current_soc_percent: number;
  battery_max_charge_kw: number;
  battery_max_discharge_kw: number;
  battery_min_soc_percent: number;
  battery_max_soc_percent: number;
  battery_temperature_c: number;
  battery_efficiency: number;
}

export interface SimulationGenerator {
  generator_count: number;
  generator_capacity_kw: number;
  generator_min_load_kw: number;
  generator_fuel_rate_l_per_kwh: number;
  generator_1_status: string;
  generator_2_status: string;
  generator_3_status: string;
}

export interface SimulationEvents {
  enable_generator_failure: boolean;
  generator_failure_hour: number;
  generator_failure_id: number;
  enable_load_spike: boolean;
  load_spike_hour: number;
  load_spike_multiplier: number;
  enable_wind_drop: boolean;
  wind_drop_hour: number;
  wind_drop_multiplier: number;
}

export interface SimulationParameters {
  duration_hours: number;
  time_step_minutes: number;
  enable_ai_optimization: boolean;
  enable_baseline_comparison: boolean;
  reserve_margin_percent: number;
}

export interface SimulationRequest {
  scenario_name: string;
  scenario_type: string;
  description?: string;
  environment: SimulationEnvironment;
  load: SimulationLoad;
  renewable: SimulationRenewable;
  battery: SimulationBattery;
  generator: SimulationGenerator;
  events: SimulationEvents;
  parameters: SimulationParameters;
}

export interface TimelineStep {
  timestamp: string;
  hour: number;
  load_kw: number;
  wind_generation_kw: number;
  diesel_generation_kw: number;
  battery_charge_kw: number;
  battery_discharge_kw: number;
  fuel_consumption_l: number;
  renewable_share_percent: number;
  critical_load_protected: boolean;
  generators_available: number;
}

export interface SimulationAlert {
  timestamp?: string;
  severity: 'info' | 'warning' | 'critical';
  hour?: number;
  rule_id?: string;
  type?: string;
  title?: string;
  component?: string;
  affected_component?: string;
  message?: string;
  recommendation?: string;
  recommended_action?: string;
}

export interface SimulationRecommendation {
  category?: string;
  type?: string;
  priority?: string;
  title?: string;
  message?: string;
  description?: string;
  reasoning?: string[] | string;
  potential_savings?: string;
  estimated_fuel_savings_l?: number;
}

export interface SimulationSummary {
  total_energy_consumed_kwh?: number;
  total_renewable_generated_kwh?: number;
  total_diesel_generated_kwh?: number;
  total_fuel_consumed_l?: number;
  average_renewable_share_percent?: number;
  critical_loads_protected?: boolean;
  simulation_duration_hours?: number;
  final_battery_soc_percent?: number;
  final_soc?: number;
  max_battery_cycles?: number;
}

export interface SMSNotificationResult {
  required: boolean;
  status: 'sent' | 'failed' | 'not_required';
  message_sid?: string;
  error?: string;
  recipient_masked?: string;
  timestamp?: string;
  alert_level?: 'NORMAL' | 'WARNING' | 'CRITICAL';
  reason?: string;
}

export interface SimulationResponse {
  scenario_id: string;
  scenario_name: string;
  mode: string;
  start_time: string;
  end_time?: string;
  status: string;
  condition?: 'NORMAL' | 'WARNING' | 'CRITICAL';
  sms?: SMSNotificationResult;
  timeline: TimelineStep[];
  alerts: SimulationAlert[];
  recommendations: SimulationRecommendation[];
  summary: SimulationSummary;
  errors: string[];
}


export interface ComparisonResponse {
  ai_result: SimulationResponse;
  baseline_result: SimulationResponse;
  comparison: {
    fuel_savings_l?: number;
    fuel_savings_liters?: number;
    fuel_savings_percent?: number;
    renewable_increase_percent?: number;
    winner?: string;
    ai_advantages?: string[];
    baseline_characteristics?: string[];
  };
}

/**
 * Simulation Service
 */
export const simulationService = {
  /**
   * Get predefined scenario configuration
   */
  async getPredefinedScenario(scenarioType: string): Promise<SimulationRequest> {
    const response = await axios.post('/api/v1/simulation/scenarios/predefined', {
      scenario_type: scenarioType
    });
    return response.data;
  },

  /**
   * Run AI-optimized simulation
   */
  async runSimulation(request: SimulationRequest): Promise<SimulationResponse> {
    const response = await axios.post('/api/v1/simulation/simulate', request);
    return response.data;
  },

  /**
   * Run baseline (rule-based) simulation
   */
  async runBaselineSimulation(request: SimulationRequest): Promise<SimulationResponse> {
    const response = await axios.post('/api/v1/simulation/simulate/baseline', request);
    return response.data;
  },

  /**
   * Run comparison between AI and baseline
   */
  async runComparison(request: SimulationRequest): Promise<ComparisonResponse> {
    const response = await axios.post('/api/v1/simulation/simulate/compare', {
      simulation_request: request
    });
    return response.data;
  },

  /**
   * Validate scenario configuration
   */
  async validateScenario(request: SimulationRequest): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const response = await axios.post('/api/v1/simulation/simulate/validate', request);
    return response.data;
  },

  /**
   * Get simulation by ID
   */
  async getSimulation(simulationId: string): Promise<SimulationResponse> {
    const response = await axios.get(`/api/v1/simulation/simulations/${simulationId}`);
    return response.data;
  },

  /**
   * List all simulations
   */
  async listSimulations(): Promise<Array<{
    scenario_id: string;
    scenario_name: string;
    mode: string;
    status: string;
    start_time: string;
  }>> {
    const response = await axios.get('/api/v1/simulation/simulations');
    return response.data;
  },

  /**
   * Get supported emergency scenarios
   */
  async getEmergencyScenarios(): Promise<Array<any>> {
    const response = await axios.get('/api/v1/simulation/emergency/scenarios');
    return response.data;
  },

  /**
   * Execute emergency scenario with backend physics engine
   */
  async runEmergencyScenario(scenarioType: string): Promise<any> {
    const response = await axios.post('/api/v1/simulation/emergency/run', { scenario_type: scenarioType });
    return response.data;
  },

  /**
   * Reset emergency scenario back to nominal baseline
   */
  async resetEmergencyScenario(): Promise<any> {
    const response = await axios.post('/api/v1/simulation/emergency/reset');
    return response.data;
  },

  /**
   * Get active emergency status
   */
  async getEmergencyStatus(): Promise<any> {
    const response = await axios.get('/api/v1/simulation/emergency/status');
    return response.data;
  },

  /**
   * Delete simulation
   */
  async deleteSimulation(simulationId: string): Promise<void> {
    await axios.delete(`/api/v1/simulation/simulations/${simulationId}`);
  },

  /**
   * Get default simulation request
   */
  getDefaultRequest(): SimulationRequest {
    return {
      scenario_name: 'Custom Scenario',
      scenario_type: 'custom',
      description: '',
      environment: {
        temperature_c: -18.0,
        wind_speed_ms: 12.0,
        wind_direction: 'SW',
        weather_condition: 'Clear',
        polar_season: 'Polar Night',
        solar_availability: 0.0
      },
      load: {
        base_load_kw: 80.0,
        research_load_kw: 35.0,
        habitation_load_kw: 25.0,
        communication_load_kw: 10.0,
        critical_load_kw: 20.0,
        deferrable_load_kw: 15.0
      },
      renewable: {
        wind_turbine_capacity_kw: 100.0,
        wind_turbine_count: 1,
        wind_turbine_efficiency: 0.90,
        solar_capacity_kw: 0.0
      },
      battery: {
        battery_capacity_kwh: 200.0,
        battery_current_soc_percent: 50.0,
        battery_max_charge_kw: 50.0,
        battery_max_discharge_kw: 50.0,
        battery_min_soc_percent: 20.0,
        battery_max_soc_percent: 90.0,
        battery_temperature_c: -5.0,
        battery_efficiency: 0.95
      },
      generator: {
        generator_count: 3,
        generator_capacity_kw: 100.0,
        generator_min_load_kw: 20.0,
        generator_fuel_rate_l_per_kwh: 0.25,
        generator_1_status: 'available',
        generator_2_status: 'available',
        generator_3_status: 'standby'
      },
      events: {
        enable_generator_failure: false,
        generator_failure_hour: 0,
        generator_failure_id: 1,
        enable_load_spike: false,
        load_spike_hour: 0,
        load_spike_multiplier: 1.5,
        enable_wind_drop: false,
        wind_drop_hour: 0,
        wind_drop_multiplier: 0.3
      },
      parameters: {
        duration_hours: 24,
        time_step_minutes: 60,
        enable_ai_optimization: true,
        enable_baseline_comparison: true,
        reserve_margin_percent: 10.0
      }
    };
  }
};
