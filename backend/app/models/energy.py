"""
Energy data models - time-series data
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from ..core.database import Base


class EnergyData(Base):
    """Time-series energy data"""
    __tablename__ = "energy_data"
    
    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    
    # Load data
    total_load_kw = Column(Float, nullable=False)
    critical_load_kw = Column(Float, default=0.0)
    deferrable_load_kw = Column(Float, default=0.0)
    
    # Generation data
    diesel_generation_kw = Column(Float, default=0.0)
    wind_generation_kw = Column(Float, default=0.0)
    total_generation_kw = Column(Float, default=0.0)
    
    # Battery data
    battery_charge_kw = Column(Float, default=0.0)  # Positive = charging
    battery_discharge_kw = Column(Float, default=0.0)  # Positive = discharging
    battery_soc_percent = Column(Float)
    
    # Fuel data
    fuel_consumption_liters = Column(Float, default=0.0)
    
    # Grid metrics
    frequency_hz = Column(Float, default=50.0)
    voltage_v = Column(Float, default=230.0)
    
    # Flags
    is_simulated = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class EquipmentStatus(Base):
    """Equipment status snapshots"""
    __tablename__ = "equipment_status"
    
    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    
    status = Column(String, nullable=False)  # running, stopped, maintenance, failed
    power_output_kw = Column(Float, default=0.0)
    efficiency_percent = Column(Float)
    temperature_c = Column(Float)
    runtime_hours = Column(Float)
    
    # Equipment-specific fields (stored as JSON in real implementation)
    fuel_flow_rate = Column(Float)  # For generators
    wind_speed_ms = Column(Float)  # For turbines
    state_of_charge = Column(Float)  # For batteries
    
    is_simulated = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class WeatherData(Base):
    """Weather data (current and historical)"""
    __tablename__ = "weather_data"
    
    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    
    temperature_c = Column(Float, nullable=False)
    wind_speed_ms = Column(Float, nullable=False)
    wind_direction_deg = Column(Float)
    humidity_percent = Column(Float)
    pressure_hpa = Column(Float)
    visibility_km = Column(Float)
    cloud_cover_percent = Column(Float)
    precipitation_mm = Column(Float, default=0.0)
    
    # Weather condition
    condition = Column(String)  # clear, cloudy, snow, storm, etc.
    
    # Data source
    source = Column(String, default="simulated")  # simulated, api, sensor
    is_forecast = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
