"""
Wind Power Forecasting
Predicts wind turbine power output based on weather forecasts
"""
import numpy as np
import pandas as pd
from datetime import timedelta
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)


class WindForecaster:
    """
    Wind power forecasting using power curve and weather data
    
    Uses a combination of:
    - Turbine power curve (physics-based)
    - Air density corrections
    - Historical performance adjustments
    """
    
    def __init__(self, turbine_specs: Optional[Dict] = None):
        """
        Initialize wind forecaster
        
        Args:
            turbine_specs: Dictionary with turbine specifications
                {
                    'rated_power_kw': 50,
                    'cut_in_speed_ms': 3.0,
                    'rated_speed_ms': 12.0,
                    'cut_out_speed_ms': 25.0,
                    'hub_height_m': 30,
                    'rotor_diameter_m': 15
                }
        """
        self.turbine_specs = turbine_specs or {
            'rated_power_kw': 50,
            'cut_in_speed_ms': 3.0,
            'rated_speed_ms': 12.0,
            'cut_out_speed_ms': 25.0,
            'hub_height_m': 30,
            'rotor_diameter_m': 15
        }
        
        self.performance_factor = 1.0  # Adjust based on historical performance
    
    def power_curve(self, wind_speed_ms: float) -> float:
        """
        Calculate power output from wind speed using power curve
        
        Args:
            wind_speed_ms: Wind speed in m/s
        
        Returns:
            Power output in kW
        """
        cut_in = self.turbine_specs['cut_in_speed_ms']
        rated_speed = self.turbine_specs['rated_speed_ms']
        cut_out = self.turbine_specs['cut_out_speed_ms']
        rated_power = self.turbine_specs['rated_power_kw']
        
        if wind_speed_ms < cut_in or wind_speed_ms > cut_out:
            return 0.0
        elif wind_speed_ms >= rated_speed:
            return rated_power
        else:
            # Cubic relationship between cut-in and rated speed
            power_ratio = ((wind_speed_ms - cut_in) / (rated_speed - cut_in)) ** 3
            return rated_power * power_ratio
    
    def adjust_for_air_density(
        self,
        power_kw: float,
        temperature_c: float,
        pressure_hpa: float = 1013.25,
        altitude_m: float = 0
    ) -> float:
        """
        Adjust power output for air density
        
        Air density affects turbine performance
        """
        # Standard air density at sea level (kg/m³)
        rho_0 = 1.225
        
        # Calculate actual air density
        # ρ = P / (R * T)
        temperature_k = temperature_c + 273.15
        R = 287.05  # Specific gas constant for dry air (J/kg·K)
        rho = (pressure_hpa * 100) / (R * temperature_k)
        
        # Adjust power based on density ratio
        density_ratio = rho / rho_0
        adjusted_power = power_kw * density_ratio
        
        return adjusted_power
    
    def predict(
        self,
        weather_forecast: pd.DataFrame,
        apply_performance_factor: bool = True
    ) -> pd.DataFrame:
        """
        Predict wind power output
        
        Args:
            weather_forecast: DataFrame with columns [timestamp, wind_speed_ms, temperature_c, pressure_hpa]
            apply_performance_factor: Whether to apply historical performance adjustment
        
        Returns:
            DataFrame with wind power predictions
        """
        result = weather_forecast.copy()
        
        # Calculate base power from wind speed
        result['base_power_kw'] = result['wind_speed_ms'].apply(self.power_curve)
        
        # Adjust for air density if temperature and pressure available
        if 'temperature_c' in result.columns and 'pressure_hpa' in result.columns:
            result['predicted_power_kw'] = result.apply(
                lambda row: self.adjust_for_air_density(
                    row['base_power_kw'],
                    row['temperature_c'],
                    row.get('pressure_hpa', 1013.25)
                ),
                axis=1
            )
        else:
            result['predicted_power_kw'] = result['base_power_kw']
        
        # Apply performance factor (accounts for wake effects, availability, etc.)
        if apply_performance_factor:
            result['predicted_power_kw'] *= self.performance_factor
        
        # Add uncertainty estimates based on wind speed uncertainty
        # Typical wind forecast uncertainty: ±2 m/s
        wind_uncertainty = 2.0
        result['lower_bound'] = result.apply(
            lambda row: max(0, self.power_curve(max(0, row['wind_speed_ms'] - wind_uncertainty))),
            axis=1
        ) * (self.performance_factor if apply_performance_factor else 1.0)
        
        result['upper_bound'] = result.apply(
            lambda row: self.power_curve(row['wind_speed_ms'] + wind_uncertainty),
            axis=1
        ) * (self.performance_factor if apply_performance_factor else 1.0)
        
        result['confidence_percent'] = 90.0
        
        return result[['timestamp', 'predicted_power_kw', 'lower_bound', 'upper_bound', 'confidence_percent']]
    
    def update_performance_factor(self, historical_data: pd.DataFrame):
        """
        Update performance factor based on historical performance
        
        Args:
            historical_data: DataFrame with [wind_speed_ms, actual_power_kw]
        """
        if len(historical_data) < 100:
            logger.warning("Insufficient data for performance factor update")
            return
        
        # Calculate theoretical power
        historical_data['theoretical_power_kw'] = historical_data['wind_speed_ms'].apply(self.power_curve)
        
        # Filter out zero values
        valid_data = historical_data[historical_data['theoretical_power_kw'] > 0]
        
        if len(valid_data) > 0:
            # Calculate performance factor as ratio of actual to theoretical
            performance_ratios = valid_data['actual_power_kw'] / valid_data['theoretical_power_kw']
            
            # Use median to avoid outliers
            self.performance_factor = performance_ratios.median()
            
            logger.info(f"Updated performance factor: {self.performance_factor:.3f}")
    
    def get_capacity_factor(self, wind_data: pd.DataFrame) -> float:
        """
        Calculate capacity factor from historical wind data
        
        Args:
            wind_data: DataFrame with wind speeds
        
        Returns:
            Capacity factor (0-1)
        """
        predictions = self.predict(wind_data, apply_performance_factor=True)
        average_power = predictions['predicted_power_kw'].mean()
        rated_power = self.turbine_specs['rated_power_kw']
        
        return average_power / rated_power if rated_power > 0 else 0.0
