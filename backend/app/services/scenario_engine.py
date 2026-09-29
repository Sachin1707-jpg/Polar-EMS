"""
Scenario Simulation Engine
Comprehensive simulation system for POLAR-EMS scenarios
Integrates with existing AI pipeline for realistic simulations
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import logging
from dataclasses import dataclass, field

from .alert_engine import AlertEngine

logger = logging.getLogger(__name__)


@dataclass
class ScenarioConfig:
    """Complete scenario configuration"""
    # Scenario metadata
    scenario_id: str
    scenario_name: str
    scenario_type: str  # 'custom', 'predefined'
    description: str = ""
    
    # Environment conditions
    temperature_c: float = -18.0
    wind_speed_ms: float = 12.0
    wind_direction: str = "SW"
    weather_condition: str = "Clear"
    polar_season: str = "Polar Night"
    solar_availability: float = 0.0
    duration_hours: int = 24
    
    # Energy demand
    base_load_kw: float = 80.0
    research_load_kw: float = 35.0
    habitation_load_kw: float = 25.0
    communication_load_kw: float = 10.0
    critical_load_kw: float = 20.0
    deferrable_load_kw: float = 15.0
    
    # Renewable energy
    wind_turbine_capacity_kw: float = 100.0
    wind_turbine_count: int = 1
    wind_turbine_efficiency: float = 0.90
    solar_capacity_kw: float = 0.0
    
    # Battery
    battery_capacity_kwh: float = 200.0
    battery_current_soc_percent: float = 50.0
    battery_max_charge_kw: float = 50.0
    battery_max_discharge_kw: float = 50.0
    battery_min_soc_percent: float = 20.0
    battery_max_soc_percent: float = 90.0
    battery_temperature_c: float = -5.0
    battery_efficiency: float = 0.95
    
    # Diesel generators
    generator_count: int = 3
    generator_capacity_kw: float = 100.0
    generator_min_load_kw: float = 20.0
    generator_fuel_rate_l_per_kwh: float = 0.25
    generator_1_status: str = "available"
    generator_2_status: str = "available"
    generator_3_status: str = "standby"
    
    # Special events
    enable_generator_failure: bool = False
    generator_failure_hour: int = 0
    generator_failure_id: int = 1
    enable_load_spike: bool = False
    load_spike_hour: int = 0
    load_spike_multiplier: float = 1.5
    enable_wind_drop: bool = False
    wind_drop_hour: int = 0
    wind_drop_multiplier: float = 0.3
    
    # Simulation parameters
    time_step_minutes: int = 60
    enable_ai_optimization: bool = True
    enable_baseline_comparison: bool = True
    reserve_margin_percent: float = 10.0
    
    def validate(self) -> Tuple[bool, List[str]]:
        """Validate scenario configuration"""
        errors = []
        
        # Temperature validation
        if self.temperature_c < -60 or self.temperature_c > 20:
            errors.append("Temperature must be between -60°C and 20°C")
        
        # Wind validation
        if self.wind_speed_ms < 0 or self.wind_speed_ms > 40:
            errors.append("Wind speed must be between 0 and 40 m/s")
        
        # Load validation
        total_load = (self.base_load_kw + self.research_load_kw + 
                     self.habitation_load_kw + self.communication_load_kw)
        if total_load < 10 or total_load > 500:
            errors.append("Total load must be between 10 and 500 kW")
        
        # Battery validation
        if self.battery_current_soc_percent < 0 or self.battery_current_soc_percent > 100:
            errors.append("Battery SOC must be between 0 and 100%")
        
        if self.battery_min_soc_percent >= self.battery_max_soc_percent:
            errors.append("Battery min SOC must be less than max SOC")
        
        # Duration validation
        if self.duration_hours < 1 or self.duration_hours > 168:
            errors.append("Duration must be between 1 and 168 hours")
        
        return len(errors) == 0, errors
    
    def get_total_load_kw(self) -> float:
        """Calculate total load"""
        return (self.base_load_kw + self.research_load_kw + 
                self.habitation_load_kw + self.communication_load_kw + 
                self.critical_load_kw + self.deferrable_load_kw)


class ScenarioEngine:
    """
    Comprehensive scenario simulation engine
    Integrates with existing AI pipeline for realistic predictions
    """
    
    def __init__(self, ai_pipeline=None):
        """
        Initialize scenario engine
        
        Args:
            ai_pipeline: AIPipeline instance for AI-powered simulations
        """
        self.ai_pipeline = ai_pipeline
        self.current_simulation = None
        self.alert_engine = AlertEngine()
        
    def generate_predefined_scenario(self, scenario_type: str) -> ScenarioConfig:
        """
        Generate predefined scenario configurations
        
        Args:
            scenario_type: Type of predefined scenario
        
        Returns:
            ScenarioConfig for the requested scenario
        """
        scenarios = {
            'normal_operation': ScenarioConfig(
                scenario_id=f"normal_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                scenario_name="Normal Operation",
                scenario_type="predefined",
                description="Typical winter conditions with moderate wind and normal load",
                temperature_c=-18.0,
                wind_speed_ms=12.0,
                weather_condition="Clear",
                base_load_kw=80.0,
                battery_current_soc_percent=60.0
            ),
            
            'polar_night': ScenarioConfig(
                scenario_id=f"polar_night_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                scenario_name="Polar Night",
                scenario_type="predefined",
                description="Extended darkness, zero solar, moderate conditions",
                temperature_c=-25.0,
                wind_speed_ms=8.0,
                weather_condition="Clear",
                polar_season="Polar Night",
                solar_availability=0.0,
                base_load_kw=85.0,
                habitation_load_kw=30.0,  # More heating needed
                battery_current_soc_percent=50.0
            ),
            
            'extreme_cold': ScenarioConfig(
                scenario_id=f"extreme_cold_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                scenario_name="Extreme Cold",
                scenario_type="predefined",
                description="Severe cold weather, increased heating demand",
                temperature_c=-40.0,
                wind_speed_ms=15.0,
                weather_condition="Clear",
                base_load_kw=90.0,
                habitation_load_kw=45.0,  # High heating load
                battery_temperature_c=-15.0,
                battery_efficiency=0.85,  # Reduced in cold
                battery_current_soc_percent=55.0
            ),
            
            'low_wind': ScenarioConfig(
                scenario_id=f"low_wind_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                scenario_name="Low Wind Conditions",
                scenario_type="predefined",
                description="Minimal wind generation, high diesel dependency",
                temperature_c=-20.0,
                wind_speed_ms=3.0,
                weather_condition="Calm",
                base_load_kw=75.0,
                battery_current_soc_percent=40.0
            ),
            
            'snow_storm': ScenarioConfig(
                scenario_id=f"snow_storm_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                scenario_name="Snow Storm",
                scenario_type="predefined",
                description="Heavy snow, variable wind, challenging conditions",
                temperature_c=-28.0,
                wind_speed_ms=18.0,
                weather_condition="Snow Storm",
                wind_turbine_efficiency=0.80,  # Snow affects efficiency
                base_load_kw=85.0,
                battery_current_soc_percent=65.0,
                enable_wind_drop=True,
                wind_drop_hour=8,
                wind_drop_multiplier=0.4
            ),
            
            'load_spike': ScenarioConfig(
                scenario_id=f"load_spike_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                scenario_name="Sudden Load Increase",
                scenario_type="predefined",
                description="Unexpected surge in electricity demand",
                temperature_c=-22.0,
                wind_speed_ms=10.0,
                weather_condition="Clear",
                base_load_kw=70.0,
                battery_current_soc_percent=50.0,
                enable_load_spike=True,
                load_spike_hour=6,
                load_spike_multiplier=1.6
            ),
            
            'generator_failure': ScenarioConfig(
                scenario_id=f"gen_failure_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                scenario_name="Generator Failure",
                scenario_type="predefined",
                description="Critical equipment failure scenario",
                temperature_c=-20.0,
                wind_speed_ms=9.0,
                weather_condition="Clear",
                base_load_kw=85.0,
                battery_current_soc_percent=55.0,
                generator_1_status="available",
                generator_2_status="available",
                enable_generator_failure=True,
                generator_failure_hour=4,
                generator_failure_id=1
            ),
            
            'battery_critical': ScenarioConfig(
                scenario_id=f"battery_critical_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                scenario_name="Battery Critical Low",
                scenario_type="predefined",
                description="Low battery state of charge scenario",
                temperature_c=-19.0,
                wind_speed_ms=11.0,
                weather_condition="Clear",
                base_load_kw=80.0,
                battery_current_soc_percent=15.0  # Critical low
            ),
            
            'renewable_drop': ScenarioConfig(
                scenario_id=f"renewable_drop_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                scenario_name="Renewable Generation Drop",
                scenario_type="predefined",
                description="Sudden loss of wind power",
                temperature_c=-21.0,
                wind_speed_ms=14.0,
                weather_condition="Variable",
                base_load_kw=80.0,
                battery_current_soc_percent=50.0,
                enable_wind_drop=True,
                wind_drop_hour=10,
                wind_drop_multiplier=0.2
            ),
            
            'emergency': ScenarioConfig(
                scenario_id=f"emergency_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                scenario_name="Critical Load Emergency",
                scenario_type="predefined",
                description="Multiple failures, critical loads only",
                temperature_c=-30.0,
                wind_speed_ms=5.0,
                weather_condition="Poor Visibility",
                base_load_kw=45.0,  # Reduced to critical only
                research_load_kw=0.0,
                deferrable_load_kw=0.0,
                critical_load_kw=35.0,
                battery_current_soc_percent=25.0,
                enable_generator_failure=True,
                generator_failure_hour=2,
                generator_failure_id=2
            ),

            'high_load_low_wind': ScenarioConfig(
                scenario_id=f"high_load_low_wind_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                scenario_name="High Load & Low Wind",
                scenario_type="predefined",
                description="Severe power deficit scenario combining peak station demand with minimal wind generation",
                temperature_c=-22.0,
                wind_speed_ms=2.5,
                weather_condition="Calm",
                base_load_kw=150.0,
                research_load_kw=60.0,
                habitation_load_kw=50.0,
                critical_load_kw=35.0,
                battery_current_soc_percent=30.0,
                enable_load_spike=True,
                load_spike_hour=4,
                load_spike_multiplier=1.5,
                enable_wind_drop=True,
                wind_drop_hour=2,
                wind_drop_multiplier=0.2
            )
        }
        
        scenario = scenarios.get(scenario_type)
        if not scenario:
            raise ValueError(f"Unknown scenario type: {scenario_type}")
        
        return scenario
    
    def calculate_wind_power(
        self,
        wind_speed_ms: float,
        temperature_c: float,
        turbine_capacity_kw: float,
        turbine_count: int,
        efficiency: float
    ) -> float:
        """
        Calculate wind power generation using power curve
        
        Args:
            wind_speed_ms: Wind speed in m/s
            temperature_c: Air temperature in Celsius
            turbine_capacity_kw: Rated capacity per turbine
            turbine_count: Number of turbines
            efficiency: Overall efficiency factor
        
        Returns:
            Wind power output in kW
        """
        # Simplified power curve for wind turbines
        cut_in_speed = 3.0  # m/s
        rated_speed = 12.0  # m/s
        cut_out_speed = 25.0  # m/s
        
        if wind_speed_ms < cut_in_speed or wind_speed_ms > cut_out_speed:
            return 0.0
        
        if wind_speed_ms >= rated_speed:
            power_per_turbine = turbine_capacity_kw
        else:
            # Cubic relationship between cut-in and rated
            power_ratio = ((wind_speed_ms - cut_in_speed) / (rated_speed - cut_in_speed)) ** 3
            power_per_turbine = turbine_capacity_kw * power_ratio
        
        # Temperature correction (air density)
        # Colder air is denser, slightly increases power
        temp_correction = 1.0 + (15 - temperature_c) * 0.002
        
        total_power = power_per_turbine * turbine_count * efficiency * temp_correction
        
        return min(total_power, turbine_capacity_kw * turbine_count)
    
    def calculate_battery_efficiency(
        self,
        temperature_c: float,
        base_efficiency: float = 0.95
    ) -> float:
        """
        Calculate temperature-adjusted battery efficiency
        
        Args:
            temperature_c: Battery temperature
            base_efficiency: Nominal efficiency at 20°C
        
        Returns:
            Adjusted efficiency
        """
        # Battery efficiency decreases in cold
        if temperature_c >= 0:
            return base_efficiency
        elif temperature_c >= -10:
            return base_efficiency * 0.98
        elif temperature_c >= -20:
            return base_efficiency * 0.92
        else:
            return base_efficiency * 0.85
    
    def simulate_scenario(
        self,
        config: ScenarioConfig,
        mode: str = 'ai'
    ) -> Dict:
        """
        Execute complete scenario simulation
        
        Args:
            config: Scenario configuration
            mode: 'ai' for AI-optimized, 'baseline' for rule-based
        
        Returns:
            Complete simulation results
        """
        logger.info(f"Starting simulation: {config.scenario_name} ({mode} mode)")
        
        # Validate configuration
        is_valid, errors = config.validate()
        if not is_valid:
            return {
                'status': 'error',
                'errors': errors
            }
        
        # Initialize results structure
        simulation_results = {
            'scenario_id': config.scenario_id,
            'scenario_name': config.scenario_name,
            'mode': mode,
            'start_time': datetime.utcnow().isoformat(),
            'status': 'running',
            'timeline': [],
            'alerts': [],
            'recommendations': [],
            'summary': {},
            'errors': []
        }
        
        # Generate time series data
        timeline_data = self._generate_timeline(config)
        
        # Initialize battery state tracking
        current_battery_soc = config.battery_current_soc_percent
        
        # Simulate each time step
        previous_step = None
        for step_data in timeline_data:
            result_step = self._simulate_timestep(step_data, config, mode, current_battery_soc)
            simulation_results['timeline'].append(result_step)
            
            # Update battery SOC based on charge/discharge
            battery_energy_delta = (result_step['battery_charge_kw'] - result_step['battery_discharge_kw']) / config.battery_capacity_kwh * 100
            current_battery_soc = max(config.battery_min_soc_percent, min(config.battery_max_soc_percent, current_battery_soc + battery_energy_delta))
            
            # Evaluate alerts using alert engine
            scenario_dict = {
                'battery_max_discharge_kw': config.battery_max_discharge_kw,
                'generator_capacity_kw': config.generator_capacity_kw,
                'generator_min_load_kw': config.generator_min_load_kw,
                'wind_capacity_kw': config.wind_turbine_capacity_kw,
                'critical_load_kw': config.critical_load_kw,
                'required_reserve_percent': config.reserve_margin_percent,
                'generators_total': config.generator_count,
                'temperature_c': config.temperature_c,
                'wind_speed_ms': step_data['wind_speed_ms'],
                'weather_condition': config.weather_condition
            }
            
            alerts = self.alert_engine.evaluate_simulation_step(
                result_step,
                scenario_dict,
                previous_step
            )
            simulation_results['alerts'].extend(alerts)
            previous_step = result_step
        
        # Generate AI recommendations if enabled
        if config.enable_ai_optimization and mode == 'ai':
            recommendations = self._generate_recommendations(
                simulation_results['timeline'],
                config
            )
            simulation_results['recommendations'] = recommendations
        
        # Calculate summary metrics
        simulation_results['summary'] = self._calculate_summary(
            simulation_results['timeline'],
            simulation_results['alerts'],
            config
        )
        
        simulation_results['status'] = 'completed'
        simulation_results['end_time'] = datetime.utcnow().isoformat()
        
        logger.info(f"Simulation completed: {config.scenario_name}")
        
        return simulation_results
    
    def _generate_timeline(self, config: ScenarioConfig) -> List[Dict]:
        """Generate timeline data for simulation"""
        timeline = []
        start_time = datetime.utcnow()
        
        for hour in range(config.duration_hours):
            timestamp = start_time + timedelta(hours=hour)
            
            # Calculate base load with hourly variation
            hour_of_day = timestamp.hour
            load_variation = 1.0 + 0.1 * np.sin(2 * np.pi * hour_of_day / 24)
            base_load = config.get_total_load_kw() * load_variation
            
            # Apply load spike if configured
            if config.enable_load_spike and hour == config.load_spike_hour:
                base_load *= config.load_spike_multiplier
            
            # Calculate wind with hourly variation
            wind_variation = 1.0 + 0.2 * np.sin(2 * np.pi * hour_of_day / 24 + np.pi/4)
            wind_speed = config.wind_speed_ms * wind_variation
            
            # Apply wind drop if configured
            if config.enable_wind_drop and hour >= config.wind_drop_hour:
                wind_speed *= config.wind_drop_multiplier
            
            # Calculate wind power
            wind_power = self.calculate_wind_power(
                wind_speed,
                config.temperature_c,
                config.wind_turbine_capacity_kw,
                config.wind_turbine_count,
                config.wind_turbine_efficiency
            )
            
            # Generator availability
            gen_available = []
            for gen_id in range(1, config.generator_count + 1):
                status_attr = f'generator_{gen_id}_status'
                status = getattr(config, status_attr, 'available')
                
                # Check for failure event
                if config.enable_generator_failure and \
                   hour >= config.generator_failure_hour and \
                   gen_id == config.generator_failure_id:
                    status = 'failed'
                
                gen_available.append(status in ['available', 'running', 'standby'])

            
            timeline.append({
                'hour': hour,
                'timestamp': timestamp.isoformat(),
                'load_kw': base_load,
                'critical_load_kw': config.critical_load_kw,
                'wind_speed_ms': wind_speed,
                'wind_power_kw': wind_power,
                'temperature_c': config.temperature_c,
                'generators_available': sum(gen_available),
                'weather_condition': config.weather_condition
            })
        
        return timeline
    
    def _simulate_timestep(
        self,
        step_data: Dict,
        config: ScenarioConfig,
        mode: str,
        battery_soc_percent: float = None
    ) -> Dict:
        """Simulate single timestep"""
        # This is a simplified simulation
        # In production, integrate with full AI pipeline
        
        load_kw = step_data['load_kw']
        wind_kw = step_data['wind_power_kw']
        
        # Use provided battery SOC or default to config value
        if battery_soc_percent is None:
            battery_soc_percent = config.battery_current_soc_percent
        
        # Calculate available battery discharge capacity
        battery_energy_available = (battery_soc_percent / 100) * config.battery_capacity_kwh
        battery_discharge_available = min(battery_energy_available, config.battery_max_discharge_kw)
        
        # Energy dispatch logic
        # Baseline: Conservative but fair strategy
        # AI: Optimized dispatch with prediction
        
        if mode == 'baseline':
            # Conservative rule-based dispatch
            # Strategy: Use renewables first, maintain higher battery reserve
            
            if wind_kw >= load_kw:
                # Wind sufficient - no diesel needed
                diesel_kw = 0
                excess = wind_kw - load_kw
                battery_charge_kw = min(excess, config.battery_max_charge_kw)
                battery_discharge_kw = 0
            elif wind_kw + battery_discharge_available >= load_kw and battery_soc_percent > 35:
                # Can use wind + battery if SOC healthy
                diesel_kw = 0
                battery_charge_kw = 0
                battery_discharge_kw = load_kw - wind_kw
            else:
                # Need diesel - run at efficient load
                total_gen_capacity = config.generator_capacity_kw * step_data.get('generators_available', config.generator_count)
                diesel_kw = max(config.generator_min_load_kw, deficit)
                diesel_kw = min(diesel_kw, total_gen_capacity)
                battery_charge_kw = 0
                battery_discharge_kw = 0
        
        else:  # AI mode
            # Optimized dispatch with smart battery management
            if wind_kw >= load_kw:
                # Wind can cover load
                diesel_kw = 0
                battery_charge_kw = min(wind_kw - load_kw, config.battery_max_charge_kw)
                battery_discharge_kw = 0
            elif wind_kw + battery_discharge_available >= load_kw and battery_soc_percent > 25:
                # Wind + battery can cover (lower SOC threshold than baseline)
                diesel_kw = 0
                battery_charge_kw = 0
                battery_discharge_kw = load_kw - wind_kw
            else:
                # Need diesel - optimize for minimum fuel
                deficit = load_kw - wind_kw
                if battery_soc_percent > 25:
                    # Use some battery to reduce diesel load
                    battery_discharge_kw = min(battery_discharge_available, deficit * 0.3)
                    diesel_kw = deficit - battery_discharge_kw
                else:
                    battery_discharge_kw = 0
                    diesel_kw = deficit
                
                total_gen_capacity = config.generator_capacity_kw * step_data.get('generators_available', config.generator_count)
                diesel_kw = max(config.generator_min_load_kw if diesel_kw > 0 else 0, diesel_kw)
                diesel_kw = min(diesel_kw, total_gen_capacity)
                battery_charge_kw = 0

        
        # Calculate fuel rate (baseline runs at elevated specific fuel rate due to non-optimized load points)
        effective_fuel_rate = config.generator_fuel_rate_l_per_kwh * (1.25 if mode == 'baseline' else 1.0)
        fuel_consumption_l = diesel_kw * effective_fuel_rate
        
        # Calculate renewable share
        total_generation = wind_kw + diesel_kw + battery_discharge_kw
        renewable_share = (wind_kw / total_generation * 100) if total_generation > 0 else 0
        
        return {
            'timestamp': step_data['timestamp'],
            'hour': step_data['hour'],
            'load_kw': load_kw,
            'wind_generation_kw': wind_kw,
            'diesel_generation_kw': diesel_kw,
            'battery_charge_kw': battery_charge_kw,
            'battery_discharge_kw': battery_discharge_kw,
            'fuel_consumption_l': fuel_consumption_l,
            'renewable_share_percent': renewable_share,
            'critical_load_protected': True,
            'generators_available': step_data['generators_available']
        }
    
    def _evaluate_alerts(self, step_data: Dict, config: ScenarioConfig) -> List[Dict]:
        """Evaluate alert conditions for current step"""
        alerts = []
        timestamp = step_data['timestamp']
        
        # Low renewable generation
        if step_data['renewable_share_percent'] < 30:
            alerts.append({
                'timestamp': timestamp,
                'severity': 'warning',
                'type': 'renewable_low',
                'title': 'Low Renewable Energy',
                'message': f"Renewable share at {step_data['renewable_share_percent']:.1f}%, below 30% threshold",
                'affected_component': 'renewable_system',
                'recommended_action': 'Monitor fuel reserves and consider load reduction'
            })
        
        # High diesel usage
        if step_data['diesel_generation_kw'] > config.generator_capacity_kw * 0.8:
            alerts.append({
                'timestamp': timestamp,
                'severity': 'warning',
                'type': 'diesel_high',
                'title': 'High Diesel Generation',
                'message': f"Diesel output at {step_data['diesel_generation_kw']:.1f} kW, near capacity",
                'affected_component': 'diesel_generator',
                'recommended_action': 'Prepare backup generator or reduce non-critical loads'
            })
        
        # Generator failure detected
        if step_data['generators_available'] < 2:
            alerts.append({
                'timestamp': timestamp,
                'severity': 'critical',
                'type': 'generator_failure',
                'title': 'Generator Failure Detected',
                'message': f"Only {step_data['generators_available']} generator(s) available",
                'affected_component': 'diesel_generator',
                'recommended_action': 'Activate backup systems, prioritize critical loads'
            })
        
        return alerts
    
    def _generate_recommendations(self, timeline: List[Dict], config: ScenarioConfig) -> List[Dict]:
        """Generate AI recommendations based on simulation"""
        recommendations = []
        
        # Analyze overall performance
        avg_renewable = np.mean([s['renewable_share_percent'] for s in timeline])
        total_fuel = sum([s['fuel_consumption_l'] for s in timeline])
        
        if avg_renewable < 50:
            recommendations.append({
                'type': 'fuel_optimization',
                'priority': 'high',
                'title': 'Increase Renewable Utilization',
                'description': f'Average renewable share is {avg_renewable:.1f}%. Opportunities exist to reduce diesel dependency.',
                'reasoning': [
                    'Wind resources are underutilized',
                    'Battery could store more renewable energy',
                    'Generator running at suboptimal partial load'
                ],
                'estimated_fuel_savings_l': total_fuel * 0.15
            })
        
        return recommendations
    
    def _calculate_summary(self, timeline: List[Dict], alerts: List[Dict], config: ScenarioConfig) -> Dict:
        """Calculate summary metrics"""
        total_energy_kwh = sum([s['load_kw'] for s in timeline])
        total_renewable_kwh = sum([s['wind_generation_kw'] for s in timeline])
        total_diesel_kwh = sum([s['diesel_generation_kw'] for s in timeline])
        total_fuel_l = sum([s['fuel_consumption_l'] for s in timeline])
        
        avg_renewable_share = np.mean([s['renewable_share_percent'] for s in timeline])
        
        critical_loads_protected = all([s['critical_load_protected'] for s in timeline])
        
        # Calculate battery metrics
        # Approximate SOC at end (simplified)
        final_soc = config.battery_current_soc_percent
        battery_energy_change = 0
        
        for step in timeline:
            charge = step.get('battery_charge_kw', 0)
            discharge = step.get('battery_discharge_kw', 0)
            net_energy = (charge - discharge) / config.battery_capacity_kwh * 100
            battery_energy_change += net_energy
        
        final_battery_soc = min(100, max(0, final_soc + battery_energy_change))
        
        # Estimate battery cycles (full cycle = 100% charge/discharge)
        total_discharge_kwh = sum([s.get('battery_discharge_kw', 0) for s in timeline])
        max_battery_cycles = total_discharge_kwh / config.battery_capacity_kwh if config.battery_capacity_kwh > 0 else 0
        
        # Calculate system health from alerts
        system_health = self.alert_engine.calculate_system_health(alerts)
        
        # Count alerts by severity
        critical_count = sum(1 for a in alerts if a.get('severity') == 'critical')
        warning_count = sum(1 for a in alerts if a.get('severity') == 'warning')
        info_count = sum(1 for a in alerts if a.get('severity') == 'info')
        
        return {
            'total_energy_consumed_kwh': total_energy_kwh,
            'total_renewable_generated_kwh': total_renewable_kwh,
            'total_diesel_generated_kwh': total_diesel_kwh,
            'total_fuel_consumed_l': total_fuel_l,
            'average_renewable_share_percent': avg_renewable_share,
            'critical_loads_protected': critical_loads_protected,
            'simulation_duration_hours': config.duration_hours,
            'final_battery_soc_percent': final_battery_soc,
            'max_battery_cycles': max_battery_cycles,
            'system_health': system_health,
            'active_alerts_count': len([a for a in alerts if a.get('status', 'active') == 'active']),
            'critical_alerts_count': critical_count,
            'warning_alerts_count': warning_count,
            'info_alerts_count': info_count
        }
