"""
Anomaly Detection and Failure Response
Detects equipment failures and system anomalies in real-time
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from sklearn.ensemble import IsolationForest
import logging

logger = logging.getLogger(__name__)


class AnomalyDetector:
    """
    Detect equipment failures and system anomalies
    
    Detection methods:
    - Rule-based checks (thresholds, logic rules)
    - Statistical anomaly detection
    - Pattern-based detection
    
    Detects:
    - Generator failures
    - Battery issues
    - Wind turbine problems
    - Sensor malfunctions
    - Load anomalies
    """
    
    def __init__(self, config: Dict):
        """Initialize anomaly detector"""
        self.config = config
        self.models = {}
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize anomaly detection models"""
        # Isolation Forest for general anomaly detection
        self.models['isolation_forest'] = IsolationForest(
            contamination=0.05,
            random_state=42
        )
    
    def detect_anomalies(
        self,
        current_data: Dict,
        historical_data: Optional[pd.DataFrame] = None
    ) -> List[Dict]:
        """
        Detect anomalies in current system state
        
        Args:
            current_data: Current system measurements
            historical_data: Recent historical data for context
        
        Returns:
            List of detected anomalies/failures
        """
        anomalies = []
        
        # Rule-based checks (fast, immediate)
        rule_based = self._rule_based_detection(current_data)
        anomalies.extend(rule_based)
        
        # Statistical checks
        if historical_data is not None and len(historical_data) > 100:
            statistical = self._statistical_detection(current_data, historical_data)
            anomalies.extend(statistical)
        
        # Pattern-based checks
        pattern_based = self._pattern_based_detection(current_data)
        anomalies.extend(pattern_based)
        
        # Remove duplicates and sort by severity
        anomalies = self._deduplicate_anomalies(anomalies)
        
        return anomalies
    
    def _rule_based_detection(self, data: Dict) -> List[Dict]:
        """Rule-based anomaly detection"""
        anomalies = []
        timestamp = datetime.utcnow()
        
        # Generator checks
        gen_status = data.get('generator_status')
        gen_power = data.get('diesel_generation_kw', 0)
        
        # Generator failure: Status is 'running' but no power output
        if gen_status == 'running' and gen_power < 1:
            anomalies.append({
                'type': 'equipment_failure',
                'severity': 'critical',
                'equipment': 'diesel_generator',
                'title': 'Generator Failure Detected',
                'description': 'Generator status shows running but no power output detected.',
                'detected_at': timestamp,
                'data': {
                    'status': gen_status,
                    'power_output_kw': gen_power
                },
                'recommended_actions': [
                    'Switch to battery backup immediately',
                    'Check generator fault indicators',
                    'Attempt generator restart if safe',
                    'Prepare backup generator'
                ]
            })
        
        # Battery checks
        battery_soc = data.get('battery_soc_percent', 50)
        battery_charge = data.get('battery_charge_kw', 0)
        battery_discharge = data.get('battery_discharge_kw', 0)
        
        # Critical low battery
        if battery_soc < 15:
            anomalies.append({
                'type': 'battery_critical',
                'severity': 'critical',
                'equipment': 'battery',
                'title': 'Critical Low Battery',
                'description': f'Battery SOC at {battery_soc:.0f}%, below critical threshold of 15%.',
                'detected_at': timestamp,
                'data': {
                    'soc_percent': battery_soc
                },
                'recommended_actions': [
                    'Start generator immediately',
                    'Charge battery as priority',
                    'Shed non-critical loads if necessary'
                ]
            })
        
        # Battery charging but SOC not increasing (possible battery failure)
        # This would require historical data to properly detect
        
        # Wind turbine checks
        wind_speed = data.get('wind_speed_ms', 0)
        wind_power = data.get('wind_generation_kw', 0)
        
        # Wind turbine underperformance
        if wind_speed > 8 and wind_power < 5:  # Should be generating
            anomalies.append({
                'type': 'equipment_failure',
                'severity': 'warning',
                'equipment': 'wind_turbine',
                'title': 'Wind Turbine Underperformance',
                'description': f'Wind speed is {wind_speed:.1f} m/s but turbine only generating {wind_power:.1f} kW.',
                'detected_at': timestamp,
                'data': {
                    'wind_speed_ms': wind_speed,
                    'power_output_kw': wind_power
                },
                'recommended_actions': [
                    'Check turbine status indicators',
                    'Inspect for mechanical issues',
                    'Verify turbine is not in fault mode'
                ]
            })
        
        # Load checks
        total_load = data.get('total_load_kw', 0)
        critical_load = data.get('critical_load_kw', 0)
        
        # Sudden load spike
        if total_load > self.config.get('max_expected_load_kw', 150):
            anomalies.append({
                'type': 'load_anomaly',
                'severity': 'warning',
                'equipment': 'load',
                'title': 'Unexpected High Load',
                'description': f'Total load ({total_load:.0f} kW) exceeds normal operating range.',
                'detected_at': timestamp,
                'data': {
                    'total_load_kw': total_load,
                    'expected_max_kw': self.config.get('max_expected_load_kw', 150)
                },
                'recommended_actions': [
                    'Identify source of additional load',
                    'Verify all equipment operating normally',
                    'Check for equipment malfunctions'
                ]
            })
        
        # Power balance check
        total_generation = data.get('total_generation_kw', 0)
        unmet_load = max(0, total_load - total_generation)
        
        if unmet_load > 1:
            anomalies.append({
                'type': 'power_shortage',
                'severity': 'critical',
                'equipment': 'system',
                'title': 'Power Generation Shortage',
                'description': f'Generation ({total_generation:.0f} kW) insufficient for load ({total_load:.0f} kW). Unmet: {unmet_load:.0f} kW.',
                'detected_at': timestamp,
                'data': {
                    'load_kw': total_load,
                    'generation_kw': total_generation,
                    'unmet_kw': unmet_load
                },
                'recommended_actions': [
                    'Start additional generators',
                    'Discharge battery at maximum rate',
                    'Consider load shedding for non-critical loads'
                ]
            })
        
        return anomalies
    
    def _statistical_detection(
        self,
        current_data: Dict,
        historical_data: pd.DataFrame
    ) -> List[Dict]:
        """Statistical anomaly detection"""
        anomalies = []
        
        # Calculate statistical thresholds
        for metric in ['total_load_kw', 'diesel_generation_kw', 'battery_soc_percent']:
            if metric in historical_data.columns and metric.replace('_', ' ').split()[0] + '_' + metric.split('_')[1] in current_data:
                hist_values = historical_data[metric].dropna()
                if len(hist_values) > 50:
                    mean = hist_values.mean()
                    std = hist_values.std()
                    current_value = current_data.get(metric.replace('_', ' ').split()[0] + '_' + metric.split('_')[1], mean)
                    
                    # Check if current value is >3 standard deviations from mean
                    z_score = abs((current_value - mean) / std) if std > 0 else 0
                    
                    if z_score > 3:
                        anomalies.append({
                            'type': 'statistical_anomaly',
                            'severity': 'warning',
                            'equipment': metric.split('_')[0],
                            'title': f'Unusual {metric.replace("_", " ").title()}',
                            'description': f'Current value ({current_value:.1f}) is {z_score:.1f} standard deviations from historical mean.',
                            'detected_at': datetime.utcnow(),
                            'data': {
                                'metric': metric,
                                'current_value': current_value,
                                'historical_mean': mean,
                                'historical_std': std,
                                'z_score': z_score
                            },
                            'recommended_actions': [
                                'Verify sensor readings',
                                'Check for equipment changes',
                                'Investigate cause of deviation'
                            ]
                        })
        
        return anomalies
    
    def _pattern_based_detection(self, data: Dict) -> List[Dict]:
        """Pattern-based anomaly detection"""
        anomalies = []
        
        # Check for illogical combinations
        gen_power = data.get('diesel_generation_kw', 0)
        battery_charge = data.get('battery_charge_kw', 0)
        battery_discharge = data.get('battery_discharge_kw', 0)
        
        # Battery charging and discharging simultaneously (impossible)
        if battery_charge > 1 and battery_discharge > 1:
            anomalies.append({
                'type': 'sensor_error',
                'severity': 'warning',
                'equipment': 'battery',
                'title': 'Conflicting Battery Data',
                'description': 'Battery shows simultaneous charging and discharging, indicating sensor or data error.',
                'detected_at': datetime.utcnow(),
                'data': {
                    'charge_kw': battery_charge,
                    'discharge_kw': battery_discharge
                },
                'recommended_actions': [
                    'Check battery sensor connections',
                    'Verify battery management system',
                    'Reset sensors if necessary'
                ]
            })
        
        return anomalies
    
    def _deduplicate_anomalies(self, anomalies: List[Dict]) -> List[Dict]:
        """Remove duplicate anomalies"""
        seen = set()
        unique = []
        
        for anomaly in anomalies:
            key = (anomaly['type'], anomaly['equipment'])
            if key not in seen:
                seen.add(key)
                unique.append(anomaly)
        
        # Sort by severity
        severity_order = {'critical': 0, 'warning': 1, 'info': 2}
        unique.sort(key=lambda x: severity_order.get(x['severity'], 2))
        
        return unique
    
    def predict_failure(
        self,
        equipment_history: pd.DataFrame,
        equipment_type: str
    ) -> Dict:
        """
        Predict potential equipment failure
        
        Args:
            equipment_history: Historical equipment data
            equipment_type: Type of equipment
        
        Returns:
            Failure prediction with probability
        """
        # Simplified prediction - in production, use more sophisticated models
        prediction = {
            'equipment_type': equipment_type,
            'failure_probability': 0.05,
            'confidence': 0.7,
            'time_to_failure_hours': None,
            'indicators': []
        }
        
        if len(equipment_history) < 100:
            return prediction
        
        # Analyze trends
        if 'efficiency_percent' in equipment_history.columns:
            recent_efficiency = equipment_history['efficiency_percent'].tail(50).mean()
            historical_efficiency = equipment_history['efficiency_percent'].head(50).mean()
            
            if recent_efficiency < historical_efficiency * 0.85:
                prediction['failure_probability'] = 0.25
                prediction['indicators'].append('Efficiency degradation detected')
        
        if 'temperature_c' in equipment_history.columns:
            recent_temp = equipment_history['temperature_c'].tail(50).mean()
            
            if recent_temp > 80:  # High temperature
                prediction['failure_probability'] += 0.15
                prediction['indicators'].append('Operating temperature elevated')
        
        return prediction
