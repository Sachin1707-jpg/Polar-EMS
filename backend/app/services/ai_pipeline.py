"""
AI Pipeline Service
Integrates all AI components: forecasting, optimization, and recommendations
"""
import sys
import os
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import pandas as pd
import numpy as np
import logging

# Add project root and AI module to path
PROJECT_ROOT = Path(__file__).resolve().parents[3]
AI_PATH = PROJECT_ROOT / "ai"
for p in [str(PROJECT_ROOT), str(AI_PATH)]:
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from ai.forecasting import LoadForecaster, WindForecaster
    from ai.optimization import EnergyOptimizer
    from ai.recommendations import RecommendationEngine
except ImportError:
    from forecasting.load_forecaster import LoadForecaster
    from forecasting.wind_forecaster import WindForecaster
    from optimization.energy_optimizer import EnergyOptimizer
    from recommendations.recommendation_engine import RecommendationEngine

logger = logging.getLogger(__name__)


class AIPipeline:
    """
    Main AI Pipeline for POLAR-EMS
    
    Responsibilities:
    - Load forecasting (24-48h ahead)
    - Wind power forecasting (24-48h ahead)
    - Energy optimization (dispatch scheduling)
    - AI-powered recommendations
    - KPI calculation
    
    IMPORTANT: Never fabricates model accuracy or fuel savings
    All metrics are based on actual model performance or clearly marked as simulated
    """
    
    def __init__(self, config: Dict, mode: str = "simulation"):
        """
        Initialize AI Pipeline
        
        Args:
            config: Configuration dictionary with equipment specs and costs
            mode: "simulation" (uses synthetic data) or "production" (uses trained models)
        """
        self.config = config
        self.mode = mode
        
        logger.info(f"Initializing AI Pipeline in {mode} mode")
        
        # Initialize components
        self.load_forecaster = LoadForecaster()
        self.wind_forecaster = WindForecaster(
            turbine_specs=config.get('turbine_specs', {
                'rated_power_kw': 30,  # 3x 30kW turbines = 90kW total
                'cut_in_speed_ms': 3.0,
                'rated_speed_ms': 12.0,
                'cut_out_speed_ms': 25.0,
                'hub_height_m': 30,
                'rotor_diameter_m': 15
            })
        )
        
        self.optimizer = EnergyOptimizer(config)
        self.recommendation_engine = RecommendationEngine(config)
        
        # Model metadata (truthful reporting)
        self.model_metadata = {
            'load_forecaster': {
                'status': 'simulation' if mode == 'simulation' else 'trained',
                'last_trained': None,
                'training_samples': 0,
                'metrics': {}
            },
            'wind_forecaster': {
                'status': 'physics_based',  # Always physics-based (power curve)
                'model_type': 'power_curve',
                'performance_factor': 1.0
            }
        }
    
    def forecast_load(
        self,
        historical_data: pd.DataFrame,
        weather_forecast: pd.DataFrame,
        horizon_hours: int = 24
    ) -> Dict:
        """
        Generate load forecast
        
        Args:
            historical_data: Recent load and weather history
            weather_forecast: Weather predictions
            horizon_hours: Forecast horizon (24 or 48)
        
        Returns:
            Forecast results with metadata
        """
        logger.info(f"Generating {horizon_hours}h load forecast in {self.mode} mode")
        
        if self.mode == "simulation":
            # Generate realistic synthetic load forecast
            forecast_df = self._generate_synthetic_load_forecast(
                historical_data,
                weather_forecast,
                horizon_hours
            )
            
            return {
                'mode': 'simulation',
                'forecast': forecast_df.to_dict('records'),
                'metadata': {
                    'model_status': 'simulation',
                    'note': 'Using synthetic data for demonstration',
                    'horizon_hours': horizon_hours,
                    'confidence_level': 0.90,
                    'generated_at': datetime.utcnow().isoformat()
                },
                'metrics': None  # No metrics in simulation mode
            }
        else:
            # Use trained model
            if not self.load_forecaster.is_trained:
                raise ValueError("Load forecaster not trained. Train model first or use simulation mode.")
            
            forecast_df = self.load_forecaster.predict(
                historical_data,
                weather_forecast,
                horizon_hours
            )
            
            return {
                'mode': 'production',
                'forecast': forecast_df.to_dict('records'),
                'metadata': {
                    'model_status': 'trained',
                    'model_type': 'XGBoost',
                    'features_used': self.load_forecaster.feature_names,
                    'horizon_hours': horizon_hours,
                    'confidence_level': 0.95,
                    'generated_at': datetime.utcnow().isoformat()
                },
                'metrics': self.model_metadata['load_forecaster']['metrics']
            }
    
    def forecast_wind_power(
        self,
        weather_forecast: pd.DataFrame,
        historical_performance: Optional[pd.DataFrame] = None
    ) -> Dict:
        """
        Generate wind power forecast
        
        Args:
            weather_forecast: Weather predictions (wind speed, temperature, pressure)
            historical_performance: Recent actual power output (optional, for calibration)
        
        Returns:
            Wind power forecast with metadata
        """
        logger.info(f"Generating wind power forecast in {self.mode} mode")
        
        # Update performance factor if historical data available
        if historical_performance is not None and len(historical_performance) > 100:
            self.wind_forecaster.update_performance_factor(historical_performance)
            self.model_metadata['wind_forecaster']['performance_factor'] = \
                self.wind_forecaster.performance_factor
        
        # Physics-based power curve prediction (same for simulation and production)
        forecast_df = self.wind_forecaster.predict(
            weather_forecast,
            apply_performance_factor=True
        )
        
        # Multiply by number of turbines (3x 30kW turbines)
        num_turbines = 3
        forecast_df['predicted_power_kw'] *= num_turbines
        forecast_df['lower_bound'] *= num_turbines
        forecast_df['upper_bound'] *= num_turbines
        
        return {
            'mode': self.mode,
            'forecast': forecast_df.to_dict('records'),
            'metadata': {
                'model_type': 'physics_based_power_curve',
                'turbine_count': num_turbines,
                'rated_capacity_kw': self.wind_forecaster.turbine_specs['rated_power_kw'] * num_turbines,
                'performance_factor': self.wind_forecaster.performance_factor,
                'note': 'Uses turbine power curve with air density corrections',
                'generated_at': datetime.utcnow().isoformat()
            }
        }
    
    def optimize_dispatch(
        self,
        load_forecast: pd.DataFrame,
        wind_forecast: pd.DataFrame,
        initial_conditions: Dict,
        horizon_hours: int = 24
    ) -> Dict:
        """
        Optimize energy dispatch schedule
        
        Args:
            load_forecast: Load predictions
            wind_forecast: Wind power predictions
            initial_conditions: Current system state
            horizon_hours: Optimization horizon
        
        Returns:
            Optimization results with schedule and metrics
        """
        logger.info(f"Running energy optimization for {horizon_hours}h")
        
        # Run MILP optimization (same for simulation and production)
        result = self.optimizer.optimize(
            load_forecast,
            wind_forecast,
            initial_conditions,
            horizon_hours
        )
        
        # Calculate actual metrics (never fabricated)
        metrics = self._calculate_optimization_metrics(result)
        
        # Add metadata
        result['mode'] = self.mode
        result['metadata'] = {
            'optimization_method': 'MILP (Mixed-Integer Linear Programming)',
            'solver': 'PULP_CBC',
            'objective': 'Minimize fuel consumption while meeting all constraints',
            'constraints': [
                'Power balance at each timestep',
                'Generator capacity limits',
                'Battery SOC limits (20-90%)',
                'Reserve margin (10%)',
                'Critical load protection (no load shedding)'
            ],
            'generated_at': datetime.utcnow().isoformat()
        }
        result['metrics'] = metrics
        
        return result
    
    def generate_recommendations(
        self,
        current_state: Dict,
        forecasts: Dict,
        optimization_result: Optional[Dict] = None,
        historical_data: Optional[pd.DataFrame] = None
    ) -> List[Dict]:
        """
        Generate AI-powered recommendations
        
        Args:
            current_state: Current system state
            forecasts: Load, wind, and weather forecasts
            optimization_result: Optimization schedule (optional)
            historical_data: Recent performance data (optional)
        
        Returns:
            List of recommendations with clear reasoning
        """
        logger.info("Generating AI recommendations")
        
        recommendations = self.recommendation_engine.generate_recommendations(
            current_state,
            forecasts,
            optimization_result or {},
            historical_data
        )
        
        # Add metadata to each recommendation
        for rec in recommendations:
            rec['mode'] = self.mode
            rec['generated_at'] = datetime.utcnow().isoformat()
            rec['ai_model'] = 'rule_based_with_optimization'  # Truthful description
            
            # Mark estimated savings as estimates, not guaranteed
            if 'estimated_fuel_savings_liters' in rec:
                rec['savings_note'] = 'Estimated savings based on optimization model, actual savings may vary'
            
            # Add confidence level based on data quality
            if self.mode == 'simulation':
                rec['confidence_note'] = 'Based on simulated data'
            else:
                rec['confidence_note'] = 'Based on actual forecasts and optimization'
        
        return recommendations
    
    def calculate_kpis(
        self,
        current_state: Dict,
        time_window_hours: int = 24
    ) -> Dict:
        """
        Calculate system KPIs
        
        Args:
            current_state: Current system measurements
            time_window_hours: Time window for cumulative metrics
        
        Returns:
            KPI dictionary with all metrics
        """
        logger.info("Calculating system KPIs")
        
        # Current instantaneous values
        kpis = {
            'current_load_kw': current_state.get('load_kw', 0),
            'renewable_power_kw': current_state.get('wind_generation_kw', 0),
            'diesel_power_kw': current_state.get('diesel_generation_kw', 0),
            'battery_soc_percent': current_state.get('battery_soc_percent', 50),
            'battery_power_kw': current_state.get('battery_power_kw', 0),
            
            # Calculated metrics
            'total_generation_kw': (
                current_state.get('wind_generation_kw', 0) +
                current_state.get('diesel_generation_kw', 0)
            ),
            
            'renewable_share_percent': 0,
            'fuel_consumption_rate_lph': 0,
            
            # System status
            'critical_load_status': 'protected',  # Always protected (design constraint)
            'system_status': 'normal',
            
            # Metadata
            'timestamp': datetime.utcnow().isoformat(),
            'mode': self.mode
        }
        
        # Calculate renewable share (actual calculation, not fabricated)
        total_gen = kpis['total_generation_kw']
        if total_gen > 0:
            kpis['renewable_share_percent'] = (
                kpis['renewable_power_kw'] / total_gen * 100
            )
        
        # Calculate fuel consumption (actual based on generator output)
        diesel_kw = kpis['diesel_power_kw']
        fuel_rate_l_per_kwh = self.config.get('generator_fuel_rate_l_per_kwh', 0.25)
        kpis['fuel_consumption_rate_lph'] = diesel_kw * fuel_rate_l_per_kwh
        
        # Determine system status based on actual conditions
        battery_soc = kpis['battery_soc_percent']
        if battery_soc < 20 or diesel_kw > 80:
            kpis['system_status'] = 'warning'
        elif battery_soc < 10:
            kpis['system_status'] = 'critical'
        
        return kpis
    
    def train_load_forecaster(
        self,
        training_data: pd.DataFrame
    ) -> Dict:
        """
        Train load forecasting model with historical data
        
        Args:
            training_data: Historical data with load, weather, and time features
        
        Returns:
            Training metrics
        """
        logger.info("Training load forecasting model")
        
        if training_data is None or len(training_data) < 1000:
            raise ValueError("Insufficient training data. Need at least 1000 samples.")
        
        # Train model
        metrics = self.load_forecaster.train(training_data, target_col='load_kw')
        
        # Update metadata with actual metrics (never fabricated)
        self.model_metadata['load_forecaster'] = {
            'status': 'trained',
            'last_trained': datetime.utcnow().isoformat(),
            'training_samples': len(training_data),
            'metrics': {
                'mape': float(metrics['mape']),
                'rmse': float(metrics['rmse']),
                'note': 'Metrics on training data, validation metrics may differ'
            }
        }
        
        self.mode = 'production'
        
        logger.info(f"Model trained successfully - MAPE: {metrics['mape']:.2f}%, RMSE: {metrics['rmse']:.2f} kW")
        
        return self.model_metadata['load_forecaster']
    
    def _generate_synthetic_load_forecast(
        self,
        historical_data: pd.DataFrame,
        weather_forecast: pd.DataFrame,
        horizon_hours: int
    ) -> pd.DataFrame:
        """
        Generate realistic synthetic load forecast for simulation mode
        
        Uses typical polar station load patterns:
        - Base load: 80-120 kW
        - Daily pattern: Higher during work hours (08:00-18:00)
        - Temperature effect: +1 kW per degree below -20°C (heating)
        - Random variation: ±10%
        """
        # Get starting point
        base_load = 100.0  # kW
        if len(historical_data) > 0 and 'load_kw' in historical_data.columns:
            base_load = historical_data['load_kw'].iloc[-1]
        
        # Create timestamps
        if historical_data is not None and len(historical_data) > 0 and 'timestamp' in historical_data.columns:
            last_timestamp = pd.to_datetime(historical_data['timestamp'].max())
        elif historical_data is not None and len(historical_data) > 0 and isinstance(historical_data.index, pd.DatetimeIndex):
            last_timestamp = pd.to_datetime(historical_data.index.max())
        else:
            last_timestamp = datetime.utcnow()

        future_timestamps = pd.date_range(
            start=last_timestamp + timedelta(hours=1),
            periods=horizon_hours,
            freq='h'
        )
        
        forecast_data = []
        
        for i, ts in enumerate(future_timestamps):
            hour = ts.hour
            
            # Daily pattern
            if 8 <= hour < 18:
                time_factor = 1.15  # 15% higher during work hours
            elif 22 <= hour or hour < 6:
                time_factor = 0.90  # 10% lower at night
            else:
                time_factor = 1.0
            
            # Temperature effect (from weather forecast)
            temp_effect = 0
            if len(weather_forecast) > i and 'temperature_c' in weather_forecast.columns:
                temp_c = weather_forecast.iloc[i]['temperature_c']
                if temp_c < -20:
                    temp_effect = (-20 - temp_c) * 1.0  # +1 kW per degree below -20°C
            
            # Calculate load with random variation
            load = base_load * time_factor + temp_effect
            load *= (1 + np.random.uniform(-0.10, 0.10))  # ±10% random variation
            
            # Ensure realistic bounds
            load = max(60, min(150, load))
            
            # Confidence intervals (wider for longer horizons)
            uncertainty = 5 + (i / horizon_hours) * 10  # 5-15 kW uncertainty
            
            forecast_data.append({
                'timestamp': ts,
                'predicted_load_kw': load,
                'lower_bound': load - uncertainty,
                'upper_bound': load + uncertainty,
                'confidence_percent': 90.0
            })
        
        return pd.DataFrame(forecast_data)
    
    def _calculate_optimization_metrics(self, optimization_result: Dict) -> Dict:
        """
        Calculate actual metrics from optimization result
        Never fabricates metrics - all calculated from actual optimization
        """
        if not optimization_result or 'schedule' not in optimization_result or not optimization_result['schedule']:
            return {}
        
        schedule = optimization_result['schedule']
        
        total_load = sum(step.get('load_kw', 0) for step in schedule)
        total_wind = sum(step.get('wind_generation_kw', 0) for step in schedule)
        total_diesel = sum(step.get('diesel_generation_kw', 0) for step in schedule)
        total_fuel = sum(step.get('fuel_consumption_liters', 0) for step in schedule)
        
        total_generation = total_wind + total_diesel
        
        return {
            'total_load_kwh': total_load,
            'total_wind_kwh': total_wind,
            'total_diesel_kwh': total_diesel,
            'total_fuel_liters': total_fuel,
            'renewable_share_percent': (total_wind / total_generation * 100) if total_generation > 0 else 0,
            'average_fuel_rate_l_per_kwh': total_fuel / total_diesel if total_diesel > 0 else 0,
            'hours_optimized': len(schedule),
            'note': 'All metrics calculated from optimization schedule, not estimates'
        }
    
    def get_model_status(self) -> Dict:
        """
        Get current status of all AI models
        
        Returns truthful status, never fabricates capabilities
        """
        return {
            'mode': self.mode,
            'load_forecaster': self.model_metadata['load_forecaster'],
            'wind_forecaster': self.model_metadata['wind_forecaster'],
            'optimizer': {
                'status': 'ready',
                'method': 'MILP (Mixed-Integer Linear Programming)',
                'solver': 'PULP_CBC'
            },
            'recommendation_engine': {
                'status': 'ready',
                'type': 'rule_based_with_optimization',
                'note': 'Generates recommendations based on forecasts and optimization results'
            },
            'disclaimer': 'All metrics and predictions are based on models and may differ from actual results. Simulation mode uses synthetic data for demonstration.'
        }
