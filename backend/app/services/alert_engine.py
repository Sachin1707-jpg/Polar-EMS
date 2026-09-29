"""
Automatic Alert Evaluation Engine
Evaluates system conditions and generates appropriate alerts
"""
from typing import Dict, List, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class AlertRule:
    """Alert rule definition"""
    def __init__(
        self,
        rule_id: str,
        rule_type: str,
        severity: str,
        title: str,
        message_template: str,
        condition_fn,
        affected_component: str,
        recommended_action: str
    ):
        self.rule_id = rule_id
        self.rule_type = rule_type
        self.severity = severity
        self.title = title
        self.message_template = message_template
        self.condition_fn = condition_fn
        self.affected_component = affected_component
        self.recommended_action = recommended_action


class AlertEngine:
    """
    Automatic alert evaluation system
    Monitors system conditions and generates alerts based on rules
    """
    
    def __init__(self):
        self.rules = self._initialize_rules()
    
    def _initialize_rules(self) -> List[AlertRule]:
        """Initialize all alert rules"""
        rules = []
        
        # Battery alerts
        rules.append(AlertRule(
            rule_id="battery_critical_low",
            rule_type="battery_soc",
            severity="critical",
            title="Battery State of Charge Critical",
            message_template="Battery SOC at {battery_soc_percent:.1f}%, below critical threshold of 15%",
            condition_fn=lambda data: data.get('battery_soc_percent', 100) < 15,
            affected_component="battery",
            recommended_action="Immediately charge battery or activate backup generation"
        ))
        
        rules.append(AlertRule(
            rule_id="battery_low",
            rule_type="battery_soc",
            severity="warning",
            title="Battery State of Charge Low",
            message_template="Battery SOC at {battery_soc_percent:.1f}%, below recommended threshold of 25%",
            condition_fn=lambda data: 15 <= data.get('battery_soc_percent', 100) < 25,
            affected_component="battery",
            recommended_action="Begin battery charging to restore reserve capacity"
        ))
        
        rules.append(AlertRule(
            rule_id="battery_high_discharge",
            rule_type="battery_discharge",
            severity="warning",
            title="High Battery Discharge Rate",
            message_template="Battery discharging at {battery_discharge_kw:.1f} kW, approaching limit",
            condition_fn=lambda data: data.get('battery_discharge_kw', 0) > data.get('battery_max_discharge_kw', 50) * 0.8,
            affected_component="battery",
            recommended_action="Monitor discharge rate and prepare backup generation"
        ))
        
        rules.append(AlertRule(
            rule_id="battery_cold",
            rule_type="battery_temperature",
            severity="warning",
            title="Battery Temperature Low",
            message_template="Battery temperature at {battery_temperature_c:.1f}°C affects performance",
            condition_fn=lambda data: data.get('battery_temperature_c', 0) < -20,
            affected_component="battery",
            recommended_action="Enable battery heating system if available"
        ))
        
        # Generator alerts
        rules.append(AlertRule(
            rule_id="generator_failure",
            rule_type="generator_status",
            severity="critical",
            title="Generator Failure Detected",
            message_template="Generator issue detected. Available generators: {generators_available}",
            condition_fn=lambda data: data.get('generators_available', 3) < data.get('generator_count', 3),
            affected_component="diesel_generator",
            recommended_action="Activate backup generator, prioritize critical loads, investigate failure"
        ))
        
        rules.append(AlertRule(
            rule_id="generator_overload",
            rule_type="generator_load",
            severity="warning",
            title="Generator Operating at High Load",
            message_template="Generator output at {diesel_generation_kw:.1f} kW",
            condition_fn=lambda data: data.get('diesel_generation_kw', 0) > data.get('generator_capacity_kw', 100) * data.get('generators_available', 1) * 0.90,
            affected_component="diesel_generator",
            recommended_action="Prepare backup generator or reduce non-critical loads"
        ))
        
        rules.append(AlertRule(
            rule_id="generator_inefficient",
            rule_type="generator_efficiency",
            severity="info",
            title="Generator Operating Below Optimal Efficiency",
            message_template="Generator running at {diesel_generation_kw:.1f} kW, below optimal range",
            condition_fn=lambda data: 0 < data.get('diesel_generation_kw', 0) < data.get('generator_min_load_kw', 20) * 1.5,
            affected_component="diesel_generator",
            recommended_action="Consider battery-only operation if SOC permits"
        ))
        
        # Renewable energy alerts
        rules.append(AlertRule(
            rule_id="renewable_very_low",
            rule_type="renewable_generation",
            severity="warning",
            title="Very Low Renewable Generation",
            message_template="Wind generation at {wind_generation_kw:.1f} kW, renewable share only {renewable_share_percent:.1f}%",
            condition_fn=lambda data: data.get('renewable_share_percent', 100) < 20 and data.get('wind_speed_ms', 20) < 5,  # Only warn if BOTH low share AND low wind
            affected_component="renewable_system",
            recommended_action="Increase fuel reserves and optimize diesel generation"
        ))
        
        rules.append(AlertRule(
            rule_id="wind_turbine_limit",
            rule_type="wind_generation",
            severity="info",
            title="Wind Turbine at Rated Capacity",
            message_template="Wind generation at {wind_generation_kw:.1f} kW (maximum capacity)",
            condition_fn=lambda data: data.get('wind_generation_kw', 0) >= (data.get('wind_turbine_capacity_kw', 100) * data.get('wind_turbine_count', 1)) * 0.95,
            affected_component="wind_turbine",
            recommended_action="Maximize renewable utilization by charging battery or shifting deferrable loads"
        ))
        
        # Load alerts
        rules.append(AlertRule(
            rule_id="load_spike",
            rule_type="load_demand",
            severity="warning",
            title="Sudden Load Increase Detected",
            message_template="Load increased to {load_kw:.1f} kW",
            condition_fn=lambda data: data.get('load_increase_percent', 0) > 30,
            affected_component="electrical_load",
            recommended_action="Verify all critical systems, prepare additional generation"
        ))
        
        rules.append(AlertRule(
            rule_id="load_near_capacity",
            rule_type="load_demand",
            severity="critical",
            title="Load Approaching System Capacity",
            message_template="Total load at {load_kw:.1f} kW, near available generation capacity",
            condition_fn=lambda data: data.get('load_kw', 0) > (data.get('generator_capacity_kw', 100) * data.get('generator_count', 3)) * 0.9,
            affected_component="electrical_load",
            recommended_action="Shed non-critical loads immediately, activate all available generation"
        ))
        
        # Reserve margin alerts
        rules.append(AlertRule(
            rule_id="reserve_margin_low",
            rule_type="reserve_margin",
            severity="warning",
            title="Low Reserve Margin",
            message_template="Reserve margin low, below required margin",
            condition_fn=lambda data: data.get('reserve_margin_percent', 20) < -5,
            affected_component="system",
            recommended_action="Activate standby generation or reduce load to maintain reserves"
        ))
        
        # Weather alerts
        rules.append(AlertRule(
            rule_id="extreme_cold",
            rule_type="weather",
            severity="warning",
            title="Extreme Cold Weather Alert",
            message_template="Temperature at {temperature_c:.1f}°C, extreme cold conditions",
            condition_fn=lambda data: data.get('temperature_c', 0) < -35,
            affected_component="all_systems",
            recommended_action="Monitor equipment performance, increase heating load allowance, check battery thermal management"
        ))
        
        rules.append(AlertRule(
            rule_id="high_winds",
            rule_type="weather",
            severity="info",
            title="High Wind Conditions",
            message_template="Wind speed at {wind_speed_ms:.1f} m/s, excellent generation opportunity",
            condition_fn=lambda data: data.get('wind_speed_ms', 0) > 15,
            affected_component="wind_turbine",
            recommended_action="Maximize renewable utilization, charge battery during high wind period"
        ))
        
        rules.append(AlertRule(
            rule_id="storm_conditions",
            rule_type="weather",
            severity="warning",
            title="Storm Conditions Detected",
            message_template="Severe weather: {weather_condition}",
            condition_fn=lambda data: data.get('weather_condition', '') in ['Snow Storm', 'Blizzard', 'Severe Wind'],
            affected_component="all_systems",
            recommended_action="Prepare for potential equipment issues, ensure fuel reserves adequate"
        ))
        
        # Fuel alerts
        rules.append(AlertRule(
            rule_id="high_fuel_consumption",
            rule_type="fuel_consumption",
            severity="warning",
            title="High Fuel Consumption Rate",
            message_template="Fuel consumption at {fuel_consumption_l:.1f} L/h, above normal rate",
            # Only warn if diesel is running above 90% of *total* available generator capacity
            condition_fn=lambda data: (
                data.get('fuel_consumption_l', 0) > 0 and
                data.get('diesel_generation_kw', 0) > data.get('generator_capacity_kw', 100) * data.get('generators_available', 1) * 0.90 and
                data.get('fuel_consumption_l', 0) > data.get('generator_capacity_kw', 100) * data.get('generators_available', 1) * 0.25 * 0.90
            ),
            affected_component="diesel_generator",
            recommended_action="Investigate high diesel usage, increase renewable utilization if possible"
        ))

        
        # Critical load alerts
        rules.append(AlertRule(
            rule_id="critical_load_risk",
            rule_type="critical_load",
            severity="critical",
            title="Critical Load Protection At Risk",
            message_template="Available generation insufficient for critical loads",
            condition_fn=lambda data: (data.get('diesel_generation_kw', 0) + data.get('wind_generation_kw', 0) + data.get('battery_discharge_kw', 0)) < data.get('critical_load_kw', 20),
            affected_component="critical_loads",
            recommended_action="IMMEDIATE ACTION REQUIRED: Shed all non-critical loads, activate all backup systems"
        ))
        
        return rules
    
    def evaluate_conditions(
        self,
        system_state: Dict,
        config: Optional[Dict] = None
    ) -> List[Dict]:
        """
        Evaluate all alert rules against current system state
        """
        alerts = []
        timestamp = datetime.utcnow().isoformat()
        
        evaluation_data = {**system_state}
        if config:
            evaluation_data.update(config)
        
        class SafeDict(dict):
            def __missing__(self, key):
                return 0.0

        safe_data = SafeDict(evaluation_data)

        for rule in self.rules:
            try:
                if rule.condition_fn(evaluation_data):
                    try:
                        message = rule.message_template.format_map(safe_data)
                    except Exception:
                        message = rule.title

                    alert = {
                        'alert_id': f"{rule.rule_id}_{timestamp}",
                        'rule_id': rule.rule_id,
                        'timestamp': timestamp,
                        'severity': rule.severity,
                        'type': rule.rule_type,
                        'title': rule.title,
                        'message': message,
                        'affected_component': rule.affected_component,
                        'recommended_action': rule.recommended_action,
                        'trigger_condition': evaluation_data.copy()
                    }
                    
                    alerts.append(alert)
                    
            except Exception as e:
                logger.error(f"Error evaluating rule {rule.rule_id}: {e}")
        
        return alerts
    
    def evaluate_simulation_step(
        self,
        step_data: Dict,
        scenario_config: Dict,
        previous_step: Optional[Dict] = None
    ) -> List[Dict]:
        """
        Evaluate alerts for a simulation timestep
        
        Args:
            step_data: Current timestep data
            scenario_config: Scenario configuration
            previous_step: Previous timestep data for comparison
        
        Returns:
            List of alerts for this timestep
        """
        # Prepare evaluation data
        eval_data = {**step_data, **scenario_config}
        
        # Calculate additional metrics if previous step available
        if previous_step:
            prev_load = previous_step.get('load_kw', 0)
            curr_load = step_data.get('load_kw', 0)
            if prev_load > 0:
                eval_data['load_increase_percent'] = ((curr_load - prev_load) / prev_load) * 100
        
        # Calculate available capacity
        diesel_available = scenario_config.get('generator_capacity_kw', 100) * \
                          step_data.get('generators_available', 1)
        wind_available = step_data.get('wind_generation_kw', 0)  # Changed from wind_power_kw
        battery_available = scenario_config.get('battery_max_discharge_kw', 50)
        eval_data['available_capacity_kw'] = diesel_available + wind_available + battery_available
        
        # Calculate available generation
        eval_data['available_generation_kw'] = (
            step_data.get('diesel_generation_kw', 0) +
            step_data.get('wind_generation_kw', 0) +  # Changed from wind_power_kw
            step_data.get('battery_discharge_kw', 0)
        )
        
        # Calculate reserve margin
        total_generation = eval_data['available_generation_kw']
        load = step_data.get('load_kw', 0)
        if load > 0:
            eval_data['reserve_margin_percent'] = ((total_generation - load) / load) * 100
        else:
            eval_data['reserve_margin_percent'] = 100  # No load = infinite reserve
        
        # Calculate fuel consumption rate
        eval_data['fuel_consumption_lph'] = step_data.get('fuel_consumption_l', 0)
        
        # Evaluate alerts
        return self.evaluate_conditions(eval_data, scenario_config)
    
    def calculate_system_health(self, alerts: List[Dict]) -> str:
        """
        Calculate overall system health state from alerts
        
        Returns: 'normal', 'warning', or 'critical'
        Priority: critical > warning > normal
        """
        if not alerts:
            return 'normal'
        
        # Check for critical alerts
        if any(a.get('severity') == 'critical' for a in alerts):
            return 'critical'
        
        # Check for warning alerts
        if any(a.get('severity') == 'warning' for a in alerts):
            return 'warning'
        
        # Only info alerts or no alerts
        return 'normal'
    
    def get_alert_statistics(self, alerts: List[Dict]) -> Dict:
        """Calculate alert statistics"""
        stats = {
            'total_alerts': len(alerts),
            'critical_count': sum(1 for a in alerts if a['severity'] == 'critical'),
            'warning_count': sum(1 for a in alerts if a['severity'] == 'warning'),
            'info_count': sum(1 for a in alerts if a['severity'] == 'info'),
            'alerts_by_type': {},
            'alerts_by_component': {}
        }
        
        # Count by type
        for alert in alerts:
            alert_type = alert['type']
            stats['alerts_by_type'][alert_type] = stats['alerts_by_type'].get(alert_type, 0) + 1
            
            component = alert['affected_component']
            stats['alerts_by_component'][component] = stats['alerts_by_component'].get(component, 0) + 1
        
        return stats
