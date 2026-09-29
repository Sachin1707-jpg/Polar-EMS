"""
Station and Equipment schemas
"""
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class StationResponse(BaseModel):
    """Schema for station response"""
    id: int
    name: str
    location: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    altitude: Optional[float]
    timezone: str
    configuration: Optional[Dict[str, Any]]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class EquipmentResponse(BaseModel):
    """Schema for equipment response"""
    id: int
    station_id: int
    equipment_type: str
    equipment_id: str
    name: Optional[str]
    specifications: Optional[Dict[str, Any]]
    is_critical: bool
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
