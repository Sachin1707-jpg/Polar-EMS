"""
Data Simulator for POLAR-EMS
Generates realistic synthetic data for development and demonstration
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import random
import logging

logger = logging.getLogger(__name__)


class DataSimulator:
    """
    Simulates realistic polar station energy data
    
    Simulates:
    - Load patterns (daily, weekly cycles)
    - Weather conditions (temperature, wind)
    - Equipment behavior
    - System events and failures
    """
    
    def __init__(self, config: Optional[Dict] = None):
        """Initialize data simulator"""
        self.config = config or self._default_config()
        self.random_state = np.random.RandomState(42)
        
    def _default_config(self) -> Dict:
        """Default simulation configuration"""
        return {
            'station_name': 'Antarctic-Station-01',
            'latitude': -77.8419,
            'longitude': 166.6863,
            'base_load_kw': 35,
            'peak_load_kw': 75,
            'diesel_capacity_kw': 100,
            'battery_capacity_kwh': 200,
            'wind_capacity_kw': 50,
            'seasonal_temp_range': (-50, -20),  # °C
            'avg_wind_speed_ms': 12,
        }
    
    def generate_weather_data(
        self,
        start_time: datetime,
        hours: int = 168
    ) -> pd.DataFrame:
        """
        Generate realistic weather data for polar conditions
        
        Args:
            start_time: Start timestamp
            hours: Number of hours to generate
        
        Returns:
            DataFrame with weather data
        """
        timestamps = pd.date_range(start=start_time, periods=hours, freq='h')
        
        # Base patterns
        hour_of_day = timestamps.hour
        day_of_year = timestamps.dayofyear
        
        # Temperature: Cold with seasonal variation and daily cycle
        seasonal_temp = -35 + 15 * np.sin(2 * np.pi * day_of_year / 365)
        daily_variation = 5 * np.sin(2 * np.pi * hour_of_day / 24)
        noise = self.random_state.normal(0, 2, hours)
        temperature = seasonal_temp + daily_variation + noise
        
        # Wind speed: Variable with some persistence
        base_wind = self.config['avg_wind_speed_ms']
        wind_variation = self.random_state.normal(0, 0.3, hours)
        wind_speed = np.zeros(hours)
        wind_speed[0] = base_wind
        
        for i in range(1, hours):
            # Persistence model
            wind_speed[i] = 0.7 * wind_speed[i-1] + 0.3 * base_wind + wind_variation[i] * 5
            wind_speed[i] = np.clip(wind_speed[i], 0, 30)
        
        # Wind direction
        wind_direction = self.random_state.uniform(0, 360, hours)
        
        # Other weather parameters
        humidity = np.clip(self.random_state.normal(75, 10, hours), 30, 100)
        pressure = self.random_state.normal(1013, 15, hours)
        visibility = np.clip(self.random_state.normal(10, 3, hours), 0.1, 50)
        cloud_cover = np.clip(self.random_state.normal(60, 20, hours), 0, 100)
        
        # Weather conditions
        conditions = []
        for i in range(hours):
            if wind_speed[i] > 20:
                conditions.append('storm')
            elif cloud_cover[i] > 80:
                conditions.append('cloudy')
            elif temperature[i] < -40:
                conditions.append('extreme_cold')
            else:
                conditions.append('clear')
        
        return pd.DataFrame({
            'timestamp': timestamps,
            'temperature_c': temperature,
            'wind_speed_ms': wind_speed,
            'wind_direction_deg': wind_direction,
            'humidity_percent': humidity,
            'pressure_hpa': pressure,
            'visibility_km': visibility,
            'cloud_cover_percent': cloud_cover,
            'condition': conditions,
            'precipitation_mm': np.zeros(hours),  # Simplified
        })
    
    def generate_load_data(
        self,
        start_time: datetime,
        hours: int = 168,
        weather_data: Optional[pd.DataFrame] = None
    ) -> pd.DataFrame:
        """
        Generate realistic load patterns
        
        Args:
            start_time: Start timestamp
            hours: Number of hours
            weather_data: Optional weather data for temperature-dependent load
        
        Returns:
            DataFrame with load data
        """
        timestamps = pd.date_range(start=start_time, periods=hours, freq='h')
        
        base_load = self.config['base_load_kw']
        peak_load = self.config['peak_load_kw']
        
        # Daily pattern (higher during work hours)
        hour_of_day = timestamps.hour
        daily_pattern = 0.3 * np.sin(2 * np.pi * (hour_of_day - 6) / 24) + 0.7
        
        # Weekly pattern (lower on weekends)
        day_of_week = timestamps.dayofweek
        weekend_factor = np.where(day_of_week >= 5, 0.8, 1.0)
        
        # Base load
        load = base_load + (peak_load - base_load) * daily_pattern * weekend_factor
        
        # Temperature-dependent heating load
        if weather_data is not None:
            temp = weather_data['temperature_c'].values
            # More heating needed when colder
            heating_load = np.maximum(0, (-20 - temp) * 0.5)
            load += heating_load
        
        # Random variations
        noise = self.random_state.normal(0, 3, hours)
        load += noise
        
        # Ensure realistic bounds
        load = np.clip(load, base_load * 0.7, peak_load * 1.2)
        
        # Critical load (always 40-60% of total)
        critical_load = load * self.random_state.uniform(0.4, 0.6, hours)
        deferrable_load = load - critical_load
        
        return pd.DataFrame({
            'timestamp': timestamps,
            'total_load_kw': load,
            'critical_load_kw': critical_load,
            'deferrable_load_kw': deferrable_load,
        })
    
    def generate_wind_generation(
        self,
        weather_data: pd.DataFrame
    ) -> pd.DataFrame:
        """
        Generate wind power output based on wind speed
        
        Args:
            weather_data: Weather data with wind speeds
        
        Returns:
            DataFrame with wind generation
        """
        wind_speed = weather_data['wind_speed_ms'].values
        capacity = self.config['wind_capacity_kw']
        
        # Wind turbine power curve
        cut_in = 3.0  # m/s
        rated = 12.0  # m/s
        cut_out = 25.0  # m/s
        
        power = np.zeros_like(wind_speed)
        
        for i, ws in enumerate(wind_speed):
            if ws < cut_in or ws > cut_out:
                power[i] = 0
            elif ws >= rated:
                power[i] = capacity
            else:
                # Cubic relationship
                power[i] = capacity * ((ws - cut_in) / (rated - cut_in)) ** 3
        
        # Add some variability (turbulence, availability)
        power *= self.random_state.uniform(0.85, 1.0, len(power))
        
        result = weather_data[['timestamp']].copy()
        result['wind_generation_kw'] = power
        
        return result
    
    def generate_energy_system_data(
        self,
        start_time: datetime,
        hours: int = 168
    ) -> pd.DataFrame:
        """
        Generate complete energy system data
        
        Args:
            start_time: Start timestamp
            hours: Number of hours
        
        Returns:
            Complete energy system DataFrame
        """
        # Generate weather
        weather = self.generate_weather_data(start_time, hours)
        
        # Generate load
        load = self.generate_load_data(start_time, hours, weather)
        
        # Generate wind generation
        wind = self.generate_wind_generation(weather)
        
        # Combine
        data = load.merge(wind, on='timestamp')
        data = data.merge(weather[['timestamp', 'temperature_c', 'wind_speed_ms']], on='timestamp')
        
        # Simulate diesel and battery behavior
        battery_capacity = self.config['battery_capacity_kwh']
        battery_soc = np.zeros(hours)
        diesel_gen = np.zeros(hours)
        battery_charge = np.zeros(hours)
        battery_discharge = np.zeros(hours)
        fuel_consumption = np.zeros(hours)
        
        battery_soc[0] = 50  # Start at 50%
        
        for i in range(hours):
            load_kw = data.loc[i, 'total_load_kw']
            wind_kw = data.loc[i, 'wind_generation_kw']
            
            # Simple dispatch logic
            net_load = load_kw - wind_kw
            
            if net_load > 0:
                # Need additional power
                if battery_soc[i if i == 0 else i-1] > 30:
                    # Use battery if available
                    battery_power = min(net_load, 50, battery_soc[i if i == 0 else i-1] * battery_capacity / 100)
                    battery_discharge[i] = battery_power
                    net_load -= battery_power
                    
                    # Use diesel for remaining
                    diesel_gen[i] = max(20, net_load) if net_load > 0 else 0
                else:
                    # Battery low, use diesel
                    diesel_gen[i] = max(20, net_load)
            else:
                # Excess renewable energy
                if battery_soc[i if i == 0 else i-1] < 90:
                    # Charge battery
                    battery_charge[i] = min(-net_load, 50)
            
            # Update battery SOC
            if i > 0:
                battery_soc[i] = battery_soc[i-1]
            battery_soc[i] += (battery_charge[i] * 0.95 - battery_discharge[i] / 0.95) / battery_capacity * 100
            battery_soc[i] = np.clip(battery_soc[i], 0, 100)
            
            # Fuel consumption (liters per hour)
            fuel_consumption[i] = diesel_gen[i] * 0.25 if diesel_gen[i] > 0 else 0
        
        # Add to dataframe
        data['diesel_generation_kw'] = diesel_gen
        data['total_generation_kw'] = diesel_gen + data['wind_generation_kw']
        data['battery_charge_kw'] = battery_charge
        data['battery_discharge_kw'] = battery_discharge
        data['battery_soc_percent'] = battery_soc
        data['fuel_consumption_liters'] = fuel_consumption
        data['frequency_hz'] = 50.0
        data['voltage_v'] = 230.0
        
        logger.info(f"Generated {hours} hours of energy system data")
        
        return data
    
    def generate_equipment_status(
        self,
        timestamp: datetime,
        system_data: pd.DataFrame,
        row_index: int
    ) -> List[Dict]:
        """
        Generate equipment status snapshots
        
        Args:
            timestamp: Current timestamp
            system_data: System data
            row_index: Row index in system_data
        
        Returns:
            List of equipment status dicts
        """
        equipment_statuses = []
        
        # Diesel Generator
        diesel_power = system_data.loc[row_index, 'diesel_generation_kw']
        equipment_statuses.append({
            'equipment_type': 'diesel_generator',
            'equipment_id': 'gen_01',
            'timestamp': timestamp,
            'status': 'running' if diesel_power > 0 else 'stopped',
            'power_output_kw': diesel_power,
            'efficiency_percent': 85 + self.random_state.uniform(-5, 5) if diesel_power > 0 else 0,
            'temperature_c': 70 + self.random_state.uniform(-10, 10) if diesel_power > 0 else 25,
            'runtime_hours': None,
        })
        
        # Battery
        battery_soc = system_data.loc[row_index, 'battery_soc_percent']
        battery_charge = system_data.loc[row_index, 'battery_charge_kw']
        battery_discharge = system_data.loc[row_index, 'battery_discharge_kw']
        
        equipment_statuses.append({
            'equipment_type': 'battery',
            'equipment_id': 'battery_01',
            'timestamp': timestamp,
            'status': 'charging' if battery_charge > 0 else ('discharging' if battery_discharge > 0 else 'idle'),
            'power_output_kw': battery_discharge - battery_charge,
            'efficiency_percent': 95,
            'temperature_c': 20 + self.random_state.uniform(-5, 5),
            'state_of_charge': battery_soc,
        })
        
        # Wind Turbine
        wind_power = system_data.loc[row_index, 'wind_generation_kw']
        wind_speed = system_data.loc[row_index, 'wind_speed_ms']
        
        equipment_statuses.append({
            'equipment_type': 'wind_turbine',
            'equipment_id': 'wind_01',
            'timestamp': timestamp,
            'status': 'running' if wind_power > 0 else 'stopped',
            'power_output_kw': wind_power,
            'efficiency_percent': None,
            'temperature_c': system_data.loc[row_index, 'temperature_c'],
            'wind_speed_ms': wind_speed,
        })
        
        return equipment_statuses
    
    def simulate_failure(self, probability: float = 0.01) -> Optional[Dict]:
        """
        Randomly simulate equipment failure
        
        Args:
            probability: Failure probability per time step
        
        Returns:
            Failure event dict or None
        """
        if self.random_state.random() < probability:
            failures = [
                {
                    'type': 'generator_fault',
                    'severity': 'critical',
                    'equipment': 'diesel_generator',
                    'message': 'Generator fault detected - automatic shutdown',
                },
                {
                    'type': 'battery_warning',
                    'severity': 'warning',
                    'equipment': 'battery',
                    'message': 'Battery temperature elevated',
                },
                {
                    'type': 'wind_turbine_fault',
                    'severity': 'warning',
                    'equipment': 'wind_turbine',
                    'message': 'Wind turbine vibration detected',
                },
            ]
            return self.random_state.choice(failures)
        return None
