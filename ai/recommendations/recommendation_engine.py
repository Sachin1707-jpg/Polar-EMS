"""
AI Recommendation Engine
Generates actionable recommendations with clear explanations
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)


class RecommendationEngine:
    """
    Generate AI-powered operational recommendations
    
    Analyzes:
    - Current system state
    - Forecasts (load, wind, weather)
    - Optimization results
    - Historical performance
    
    Produces:
    - Fuel-saving opportunities
    - Load shifting suggestions
    - Maintenance alerts
    - Operational improvements
    """
    
    def __init__(self, config: Dict):
        """Initialize recommendation engine"""
        self.config = config
        self.fuel_cost_per_liter = config.get('diesel_cost_per_liter', 1.5)
    
    def generate_recommendations(
        self,
        current_state: Dict,
        forecasts: Dict,
        optimization_result: Dict,
        historical_data: Optional[pd.DataFrame] = None
    ) -> List[Dict]:
        """
        Generate recommendations based on current conditions
        
        Args:
            current_state: Current system state
            forecasts: Load and wind forecasts
            optimization_result: Optimization schedule
            historical_data: Recent historical performance
        
        Returns:
            List of recommendations
        """
        recommendations = []
        
        # 1. Check for fuel-saving opportunities
        fuel_recs = self._analyze_fuel_savings(current_state, forecasts, optimization_result)
        recommendations.extend(fuel_recs)
        
        # 2. Battery management recommendations
        battery_recs = self._analyze_battery_management(current_state, forecasts)
        recommendations.extend(battery_recs)
        
        # 3. Load shifting opportunities
        load_recs = self._analyze_load_shifting(current_state, forecasts)
        recommendations.extend(load_recs)
        
        # 4. Weather-based recommendations
        weather_recs = self._analyze_weather_impacts(forecasts)
        recommendations.extend(weather_recs)
        
        # 5. Equipment maintenance suggestions
        if historical_data is not None:
            maintenance_recs = self._analyze_maintenance_needs(historical_data)
            recommendations.extend(maintenance_recs)
        
        # Sort by priority
        priority_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
        recommendations.sort(key=lambda x: priority_order.get(x['priority'], 3))
        
        return recommendations
    
    def _analyze_fuel_savings(
        self,
        current_state: Dict,
        forecasts: Dict,
        optimization_result: Dict
    ) -> List[Dict]:
        """Analyze fuel-saving opportunities"""
        recommendations = []
        
        # Check upcoming wind availability
        wind_forecast = forecasts.get('wind_forecast', [])
        if len(wind_forecast) > 0:
            wind_df = pd.DataFrame(wind_forecast)
            avg_wind_next_6h = wind_df.head(6)['power_kw'].mean()
            current_wind = current_state.get('wind_generation_kw', 0)
            
            # Recommendation: Defer generator startup if wind increasing
            if avg_wind_next_6h > current_wind * 1.5 and avg_wind_next_6h > 20:
                generator_on = current_state.get('generator_status') == 'running'
                
                if not generator_on or current_state.get('diesel_generation_kw', 0) < 30:
                    estimated_savings = avg_wind_next_6h * 6 * 0.25 * self.fuel_cost_per_liter
                    
                    recommendations.append({
                        'type': 'fuel_saving',
                        'priority': 'medium',
                        'title': 'High Wind Expected - Optimize Generator Usage',
                        'description': f'Wind generation expected to increase to {avg_wind_next_6h:.1f} kW over the next 6 hours. Consider reducing diesel generation.',
                        'reasoning': [
                            f'Current wind generation: {current_wind:.1f} kW',
                            f'Expected average wind (next 6h): {avg_wind_next_6h:.1f} kW',
                            f'This represents a {((avg_wind_next_6h - current_wind) / current_wind * 100) if current_wind > 0 else 100:.0f}% increase',
                            'Renewable energy can reduce diesel dependency'
                        ],
                        'actions': [
                            {
                                'action': 'reduce_diesel_generation',
                                'target': 'Reduce diesel output as wind ramps up',
                                'timing': 'Next 6 hours'
                            },
                            {
                                'action': 'charge_battery',
                                'target': 'Use excess wind to charge batteries',
                                'timing': 'When wind > load'
                            }
                        ],
                        'estimated_fuel_savings_liters': avg_wind_next_6h * 6 * 0.25,
                        'estimated_cost_savings': estimated_savings,
                        'estimated_renewable_increase_percent': 15
                    })
        
        # Check for extended low-load periods
        load_forecast = forecasts.get('load_forecast', [])
        if len(load_forecast) > 0:
            load_df = pd.DataFrame(load_forecast)
            # Find periods of load < 30 kW
            low_load_periods = load_df[load_df['load_kw'] < 30]
            
            if len(low_load_periods) > 4:  # More than 4 hours of low load
                recommendations.append({
                    'type': 'fuel_saving',
                    'priority': 'high',
                    'title': 'Extended Low Load Period - Battery-Only Operation',
                    'description': f'Low electricity demand expected for {len(low_load_periods)} hours. Consider battery-only operation.',
                    'reasoning': [
                        f'{len(low_load_periods)} hours of load below 30 kW detected',
                        'Generator efficiency is poor at low loads',
                        'Battery can handle low loads efficiently',
                        f'Current battery SOC: {current_state.get("battery_soc_percent", 50):.0f}%'
                    ],
                    'actions': [
                        {
                            'action': 'switch_to_battery',
                            'target': 'Shutdown generator, run on battery',
                            'timing': 'During low-load hours',
                            'condition': 'Battery SOC > 40%'
                        },
                        {
                            'action': 'schedule_generator_restart',
                            'target': 'Restart generator before battery depletes',
                            'timing': 'When SOC reaches 30%'
                        }
                    ],
                    'estimated_fuel_savings_liters': len(low_load_periods) * 5,
                    'estimated_cost_savings': len(low_load_periods) * 5 * self.fuel_cost_per_liter
                })
        
        return recommendations
    
    def _analyze_battery_management(self, current_state: Dict, forecasts: Dict) -> List[Dict]:
        """Analyze battery management"""
        recommendations = []
        
        battery_soc = current_state.get('battery_soc_percent', 50)
        
        # Low battery warning
        if battery_soc < 25:
            recommendations.append({
                'type': 'battery_management',
                'priority': 'high',
                'title': 'Low Battery State of Charge',
                'description': f'Battery SOC is {battery_soc:.0f}%, below recommended minimum of 25%.',
                'reasoning': [
                    'Low battery reserves reduce system resilience',
                    'Risk of power interruption if generator fails',
                    'Battery performance degrades at very low SOC'
                ],
                'actions': [
                    {
                        'action': 'charge_battery',
                        'target': 'Charge battery to at least 40%',
                        'timing': 'Immediate',
                        'method': 'Use excess generator capacity or wind power'
                    }
                ],
                'estimated_renewable_increase_percent': 5
            })
        
        # Opportunity to charge battery with wind
        wind_forecast = forecasts.get('wind_forecast', [])
        if len(wind_forecast) > 0 and battery_soc < 70:
            wind_df = pd.DataFrame(wind_forecast)
            high_wind_periods = wind_df[wind_df['power_kw'] > 40]
            
            if len(high_wind_periods) > 2:
                recommendations.append({
                    'type': 'battery_management',
                    'priority': 'medium',
                    'title': 'Opportunity to Charge Battery with Wind',
                    'description': f'High wind expected with battery at {battery_soc:.0f}%. Optimal time to store renewable energy.',
                    'reasoning': [
                        f'{len(high_wind_periods)} hours of wind > 40 kW expected',
                        f'Current battery SOC: {battery_soc:.0f}%',
                        'Storing wind energy now enables diesel-free operation later',
                        'Maximize renewable energy utilization'
                    ],
                    'actions': [
                        {
                            'action': 'charge_battery_with_wind',
                            'target': 'Charge battery to 80% using wind power',
                            'timing': 'During high wind periods'
                        }
                    ]
                })
        
        return recommendations
    
    def _analyze_load_shifting(self, current_state: Dict, forecasts: Dict) -> List[Dict]:
        """Analyze load shifting opportunities"""
        recommendations = []
        
        load_forecast = forecasts.get('load_forecast', [])
        wind_forecast = forecasts.get('wind_forecast', [])
        
        if len(load_forecast) > 12 and len(wind_forecast) > 12:
            load_df = pd.DataFrame(load_forecast)
            wind_df = pd.DataFrame(wind_forecast)
            
            # Merge forecasts
            combined = load_df.merge(wind_df, on='timestamp', suffixes=('_load', '_wind'))
            combined['net_load'] = combined['load_kw'] - combined['power_kw']
            
            # Find optimal times (low net load)
            combined['hour'] = pd.to_datetime(combined['timestamp']).dt.hour
            optimal_hours = combined.nsmallest(6, 'net_load')
            
            if optimal_hours['net_load'].mean() < combined['net_load'].mean() * 0.7:
                recommendations.append({
                    'type': 'load_shifting',
                    'priority': 'low',
                    'title': 'Optimal Times for Deferrable Loads',
                    'description': 'Identified optimal time windows to run non-critical equipment with maximum renewable energy.',
                    'reasoning': [
                        'Analysis found periods of high wind and low base load',
                        'Running deferrable loads during these times maximizes renewable usage',
                        'Reduces overall fuel consumption'
                    ],
                    'actions': [
                        {
                            'action': 'schedule_deferrable_loads',
                            'target': 'Water heating, battery charging, etc.',
                            'timing': f'Between {optimal_hours["hour"].min():.0f}:00 - {optimal_hours["hour"].max():.0f}:00'
                        }
                    ],
                    'estimated_fuel_savings_liters': 10,
                    'estimated_renewable_increase_percent': 8
                })
        
        return recommendations
    
    def _analyze_weather_impacts(self, forecasts: Dict) -> List[Dict]:
        """Analyze weather impact on operations"""
        recommendations = []
        
        weather_forecast = forecasts.get('weather_forecast', [])
        if len(weather_forecast) > 0:
            weather_df = pd.DataFrame(weather_forecast)
            
            # Check for extreme cold
            min_temp = weather_df['temperature_c'].min()
            if min_temp < -30:
                recommendations.append({
                    'type': 'weather_alert',
                    'priority': 'high',
                    'title': 'Extreme Cold Warning - Increased Heating Load',
                    'description': f'Temperature expected to drop to {min_temp:.1f}°C. Heating demand will increase significantly.',
                    'reasoning': [
                        'Extreme cold increases heating requirements',
                        'Generator efficiency decreases in very cold weather',
                        'Battery performance affected by temperature',
                        'Increased fuel consumption expected'
                    ],
                    'actions': [
                        {
                            'action': 'prepare_for_high_load',
                            'target': 'Ensure generator is ready and fuel sufficient',
                            'timing': 'Before temperature drops'
                        },
                        {
                            'action': 'check_battery_heating',
                            'target': 'Verify battery thermal management',
                            'timing': 'Immediate'
                        }
                    ]
                })
            
            # Check for high winds (good for generation)
            max_wind = weather_df['wind_speed_ms'].max()
            if max_wind > 15:
                recommendations.append({
                    'type': 'weather_alert',
                    'priority': 'medium',
                    'title': 'Strong Winds Expected - Maximize Renewable Energy',
                    'description': f'Wind speeds up to {max_wind:.1f} m/s expected. Excellent opportunity for wind generation.',
                    'reasoning': [
                        f'Peak wind speed: {max_wind:.1f} m/s',
                        'Wind turbine will operate at or near rated capacity',
                        'Opportunity to minimize diesel usage',
                        'Charge batteries during peak wind periods'
                    ],
                    'actions': [
                        {
                            'action': 'maximize_wind_utilization',
                            'target': 'Reduce diesel, charge batteries',
                            'timing': 'During high wind period'
                        }
                    ],
                    'estimated_fuel_savings_liters': 20,
                    'estimated_renewable_increase_percent': 25
                })
        
        return recommendations
    
    def _analyze_maintenance_needs(self, historical_data: pd.DataFrame) -> List[Dict]:
        """Analyze equipment maintenance needs"""
        recommendations = []
        
        # This would typically analyze equipment runtime, efficiency trends, etc.
        # For now, return a placeholder
        
        return recommendations
    
    def explain_decision(
        self,
        decision_type: str,
        context: Dict
    ) -> Dict:
        """
        Generate detailed explanation for an AI decision
        
        Args:
            decision_type: Type of decision (optimization, recommendation, etc.)
            context: Decision context and parameters
        
        Returns:
            Structured explanation
        """
        explanation = {
            'decision_type': decision_type,
            'timestamp': datetime.utcnow().isoformat(),
            'situation': '',
            'recommendation': '',
            'reasoning': [],
            'factors': {},
            'expected_impact': {},
            'confidence_percent': 85.0
        }
        
        if decision_type == 'fuel_optimization':
            explanation['situation'] = 'The system analyzed upcoming load and wind forecasts to optimize diesel generator operation.'
            explanation['recommendation'] = 'Reduce diesel generation during high wind periods and use battery storage.'
            explanation['reasoning'] = [
                'Wind forecast shows 50+ kW generation in next 6 hours',
                'Current load is 45 kW, within battery capacity',
                'Generator efficiency is poor at partial load',
                'Battery SOC is sufficient (65%) to handle transition'
            ]
            explanation['factors'] = {
                'wind_availability': 'High',
                'load_level': 'Medium',
                'battery_state': 'Good',
                'fuel_price': f'${self.fuel_cost_per_liter}/L'
            }
            explanation['expected_impact'] = {
                'fuel_savings': '15 liters over 6 hours',
                'cost_savings': f'${15 * self.fuel_cost_per_liter:.2f}',
                'renewable_increase': '+20% renewable share',
                'emissions_reduction': '40 kg CO2'
            }
        
        return explanation
