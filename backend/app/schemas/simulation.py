"""
Simulation API Schemas
Pydantic models for simulation requests and responses
"""
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime


class SimulationEnvironment(BaseModel):
    """Environment conditions for simulation"""
    temperature_c: float = Field(-18.0, description="Temperature in Celsius", ge=-60, le=20)
    wind_speed_ms: float = Field(12.0, description="Wind speed in m/s", ge=0, le=40)
    wind_direction: str = Field("SW", description="Wind direction")
    weather_condition: str = Field("Clear", description="Weather condition")
    polar_season: str = Field("Polar Night", description="Polar season")
    solar_availability: float = Field(0.0, description="Solar availability (0-1)", ge=0, le=1)


class SimulationLoad(BaseModel):
    """Energy demand configuration"""
    base_load_kw: float = Field(80.0, description="Base station load in kW", ge=0)
    research_load_kw: float = Field(35.0, description="Research/scientific load", ge=0)
    habitation_load_kw: float = Field(25.0, description="Habitation load", ge=0)
    communication_load_kw: float = Field(10.0, description="Communication load", ge=0)
    critical_load_kw: float = Field(20.0, description="Critical load", ge=0)
    deferrable_load_kw: float = Field(15.0, description="Deferrable load", ge=0)


class SimulationRenewable(BaseModel):
    """Renewable energy configuration"""
    wind_turbine_capacity_kw: float = Field(100.0, description="Wind turbine capacity", ge=0)
    wind_turbine_count: int = Field(1, description="Number of wind turbines", ge=0, le=10)
    wind_turbine_efficiency: float = Field(0.90, description="Wind turbine efficiency", ge=0, le=1)
    solar_capacity_kw: float = Field(0.0, description="Solar capacity", ge=0)


class SimulationBattery(BaseModel):
    """Battery configuration"""
    battery_capacity_kwh: float = Field(200.0, description="Battery capacity in kWh", ge=0)
    battery_current_soc_percent: float = Field(50.0, description="Current SOC %", ge=0, le=100)
    battery_max_charge_kw: float = Field(50.0, description="Max charge power", ge=0)
    battery_max_discharge_kw: float = Field(50.0, description="Max discharge power", ge=0)
    battery_min_soc_percent: float = Field(20.0, description="Min SOC %", ge=0, le=100)
    battery_max_soc_percent: float = Field(90.0, description="Max SOC %", ge=0, le=100)
    battery_temperature_c: float = Field(-5.0, description="Battery temperature", ge=-40, le=40)
    battery_efficiency: float = Field(0.95, description="Battery efficiency", ge=0, le=1)
    
    @validator('battery_max_soc_percent')
    def max_soc_greater_than_min(cls, v, values):
        if 'battery_min_soc_percent' in values and v <= values['battery_min_soc_percent']:
            raise ValueError('Max SOC must be greater than min SOC')
        return v


class SimulationGenerator(BaseModel):
    """Generator configuration"""
    generator_count: int = Field(3, description="Number of generators", ge=1, le=10)
    generator_capacity_kw: float = Field(100.0, description="Generator capacity", ge=0)
    generator_min_load_kw: float = Field(20.0, description="Minimum load", ge=0)
    generator_fuel_rate_l_per_kwh: float = Field(0.25, description="Fuel rate L/kWh", ge=0)
    generator_1_status: str = Field("available", description="Generator 1 status")
    generator_2_status: str = Field("available", description="Generator 2 status")
    generator_3_status: str = Field("standby", description="Generator 3 status")


class SimulationEvents(BaseModel):
    """Special events configuration"""
    enable_generator_failure: bool = Field(False, description="Enable generator failure event")
    generator_failure_hour: int = Field(0, description="Hour of failure", ge=0)
    generator_failure_id: int = Field(1, description="Failed generator ID", ge=1)
    enable_load_spike: bool = Field(False, description="Enable load spike event")
    load_spike_hour: int = Field(0, description="Hour of load spike", ge=0)
    load_spike_multiplier: float = Field(1.5, description="Load spike multiplier", ge=1, le=3)
    enable_wind_drop: bool = Field(False, description="Enable wind drop event")
    wind_drop_hour: int = Field(0, description="Hour of wind drop", ge=0)
    wind_drop_multiplier: float = Field(0.3, description="Wind drop multiplier", ge=0, le=1)


class SimulationParameters(BaseModel):
    """Simulation control parameters"""
    duration_hours: int = Field(24, description="Simulation duration", ge=1, le=168)
    time_step_minutes: int = Field(60, description="Time step in minutes", ge=1, le=60)
    enable_ai_optimization: bool = Field(True, description="Enable AI optimization")
    enable_baseline_comparison: bool = Field(True, description="Enable baseline comparison")
    reserve_margin_percent: float = Field(10.0, description="Reserve margin %", ge=0, le=50)


class SimulationRequest(BaseModel):
    """Complete simulation request"""
    scenario_name: str = Field(..., description="Name of scenario")
    scenario_type: str = Field("custom", description="Type: 'custom' or 'predefined'")
    description: Optional[str] = Field("", description="Scenario description")
    
    environment: SimulationEnvironment
    load: SimulationLoad
    renewable: SimulationRenewable
    battery: SimulationBattery
    generator: SimulationGenerator
    events: SimulationEvents
    parameters: SimulationParameters
    
    class Config:
        schema_extra = {
            "example": {
                "scenario_name": "Test Scenario",
                "scenario_type": "custom",
                "description": "Testing normal operation",
                "environment": {
                    "temperature_c": -18.0,
                    "wind_speed_ms": 12.0,
                    "wind_direction": "SW",
                    "weather_condition": "Clear",
                    "polar_season": "Polar Night",
                    "solar_availability": 0.0
                },
                "load": {
                    "base_load_kw": 80.0,
                    "research_load_kw": 35.0,
                    "habitation_load_kw": 25.0,
                    "communication_load_kw": 10.0,
                    "critical_load_kw": 20.0,
                    "deferrable_load_kw": 15.0
                },
                "renewable": {
                    "wind_turbine_capacity_kw": 100.0,
                    "wind_turbine_count": 1,
                    "wind_turbine_efficiency": 0.90,
                    "solar_capacity_kw": 0.0
                },
                "battery": {
                    "battery_capacity_kwh": 200.0,
                    "battery_current_soc_percent": 50.0,
                    "battery_max_charge_kw": 50.0,
                    "battery_max_discharge_kw": 50.0,
                    "battery_min_soc_percent": 20.0,
                    "battery_max_soc_percent": 90.0,
                    "battery_temperature_c": -5.0,
                    "battery_efficiency": 0.95
                },
                "generator": {
                    "generator_count": 3,
                    "generator_capacity_kw": 100.0,
                    "generator_min_load_kw": 20.0,
                    "generator_fuel_rate_l_per_kwh": 0.25,
                    "generator_1_status": "available",
                    "generator_2_status": "available",
                    "generator_3_status": "standby"
                },
                "events": {
                    "enable_generator_failure": False,
                    "generator_failure_hour": 0,
                    "generator_failure_id": 1,
                    "enable_load_spike": False,
                    "load_spike_hour": 0,
                    "load_spike_multiplier": 1.5,
                    "enable_wind_drop": False,
                    "wind_drop_hour": 0,
                    "wind_drop_multiplier": 0.3
                },
                "parameters": {
                    "duration_hours": 24,
                    "time_step_minutes": 60,
                    "enable_ai_optimization": True,
                    "enable_baseline_comparison": True,
                    "reserve_margin_percent": 10.0
                }
            }
        }


class TimelineStep(BaseModel):
    """Single timeline step result"""
    timestamp: str
    hour: int
    load_kw: float
    wind_generation_kw: float
    diesel_generation_kw: float
    battery_charge_kw: float
    battery_discharge_kw: float
    fuel_consumption_l: float
    renewable_share_percent: float
    critical_load_protected: bool
    generators_available: int


class SimulationAlert(BaseModel):
    """Simulation alert"""
    timestamp: str
    severity: str  # 'info', 'warning', 'critical'
    type: str
    title: str
    message: str
    affected_component: str
    recommended_action: str


class SimulationRecommendation(BaseModel):
    """AI recommendation"""
    type: str
    priority: str
    title: str
    description: str
    reasoning: List[str]
    estimated_fuel_savings_l: Optional[float] = None


class SimulationSummary(BaseModel):
    """Simulation summary metrics"""
    total_energy_consumed_kwh: float
    total_renewable_generated_kwh: float
    total_diesel_generated_kwh: float
    total_fuel_consumed_l: float
    average_renewable_share_percent: float
    critical_loads_protected: bool
    simulation_duration_hours: int


class SMSNotificationResult(BaseModel):
    """SMS Notification status model"""
    required: bool = Field(..., description="Whether SMS alert was required for this simulation")
    status: str = Field(..., description="Status: 'sent', 'failed', or 'not_required'")
    message_sid: Optional[str] = Field(None, description="Twilio message SID if sent")
    error: Optional[str] = Field(None, description="Error message if failed")
    recipient_masked: Optional[str] = Field(None, description="Masked recipient phone number")
    timestamp: Optional[str] = Field(None, description="Timestamp of SMS trigger")
    alert_level: Optional[str] = Field(None, description="Alert level: 'NORMAL', 'WARNING', or 'CRITICAL'")
    reason: Optional[str] = Field(None, description="Reason for status or skip")


class SimulationResponse(BaseModel):
    """Complete simulation response"""
    scenario_id: str
    scenario_name: str
    mode: str
    start_time: str
    end_time: Optional[str] = None
    status: str
    condition: Optional[str] = Field(None, description="Evaluated condition: NORMAL, WARNING, CRITICAL")
    sms: Optional[SMSNotificationResult] = Field(None, description="Twilio SMS alert result")
    timeline: List[TimelineStep]
    alerts: List[SimulationAlert]
    recommendations: List[SimulationRecommendation]
    summary: SimulationSummary
    errors: List[str] = []



class PredefinedScenarioRequest(BaseModel):
    """Request for predefined scenario"""
    scenario_type: str = Field(..., description="Type of predefined scenario")
    
    class Config:
        schema_extra = {
            "example": {
                "scenario_type": "normal_operation"
            }
        }


class ComparisonRequest(BaseModel):
    """Request for baseline vs AI comparison"""
    simulation_request: SimulationRequest


class ComparisonResponse(BaseModel):
    """Comparison results"""
    ai_results: SimulationResponse
    baseline_results: SimulationResponse
    comparison: Dict[str, Any]
