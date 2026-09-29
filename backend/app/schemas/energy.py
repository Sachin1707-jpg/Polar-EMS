"""
Energy data schemas
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class EnergyDataResponse(BaseModel):
    """Schema for energy data response"""
    id: int
    station_id: int
    timestamp: datetime
    
    # Load
    total_load_kw: float
    critical_load_kw: float
    deferrable_load_kw: float
    
    # Generation
    diesel_generation_kw: float
    wind_generation_kw: float
    total_generation_kw: float
    
    # Battery
    battery_charge_kw: float
    battery_discharge_kw: float
    battery_soc_percent: Optional[float]
    
    # Fuel
    fuel_consumption_liters: float
    
    # Flags
    is_simulated: bool
    
    class Config:
        from_attributes = True


class DashboardStatus(BaseModel):
    """Schema for dashboard system status"""
    timestamp: datetime
    
    # Current power (kW)
    current_load_kw: float
    diesel_generation_kw: float
    wind_generation_kw: float
    total_generation_kw: float
    battery_power_kw: float  # Positive = discharging, negative = charging
    
    # Battery status
    battery_soc_percent: float
    battery_status: str
    
    # Fuel
    fuel_consumption_rate_lph: float  # Liters per hour
    daily_fuel_consumed_liters: float
    
    # Renewable metrics
    renewable_share_percent: float
    daily_renewable_kwh: float
    
    # Load status
    critical_load_kw: float
    deferrable_load_kw: float
    unmet_load_kw: float
    
    # System health
    system_status: str  # normal, warning, critical
    active_alerts_count: int
    
    # Flags
    is_simulated: bool = True


class WeatherDataResponse(BaseModel):
    """Schema for weather data"""
    timestamp: datetime
    temperature_c: float
    wind_speed_ms: float
    wind_direction_deg: Optional[float]
    humidity_percent: Optional[float]
    pressure_hpa: Optional[float]
    condition: Optional[str]
    is_forecast: bool
    
    class Config:
        from_attributes = True


class EquipmentStatusResponse(BaseModel):
    """Schema for equipment status"""
    equipment_id: int
    equipment_type: str
    equipment_name: str
    timestamp: datetime
    status: str
    power_output_kw: float
    efficiency_percent: Optional[float]
    temperature_c: Optional[float]
    is_simulated: bool
    
    class Config:
        from_attributes = True
