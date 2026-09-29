"""
Station and Equipment models
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.database import Base


class Station(Base):
    """Polar research station"""
    __tablename__ = "stations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    location = Column(String)  # e.g., "Antarctica-McMurdo"
    latitude = Column(Float)
    longitude = Column(Float)
    altitude = Column(Float)
    timezone = Column(String, default="UTC")
    configuration = Column(JSON)  # Station-specific configuration
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    equipment = relationship("Equipment", back_populates="station")


class Equipment(Base):
    """Equipment at the station (generators, batteries, turbines, loads)"""
    __tablename__ = "equipment"
    
    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    equipment_type = Column(String, nullable=False)  # diesel_generator, battery, wind_turbine, load
    equipment_id = Column(String, nullable=False)  # e.g., "gen_01", "battery_01"
    name = Column(String)
    specifications = Column(JSON)  # Equipment-specific specs (capacity, efficiency, etc.)
    is_critical = Column(Boolean, default=False)  # For critical loads
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    station = relationship("Station", back_populates="equipment")
