"""
Alert schemas
"""
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime


class AlertCreate(BaseModel):
    """Schema for creating an alert"""
    alert_type: str
    severity: str
    title: str
    message: str
    source_type: Optional[str] = None
    source_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


class AlertResponse(BaseModel):
    """Schema for alert response"""
    id: int
    station_id: int
    created_at: datetime
    
    alert_type: str
    severity: str
    title: str
    message: str
    
    source_type: Optional[str]
    source_id: Optional[str]
    details: Optional[Dict[str, Any]]
    
    acknowledged: bool
    acknowledged_at: Optional[datetime]
    
    resolved: bool
    resolved_at: Optional[datetime]
    resolution_notes: Optional[str]
    
    is_simulated: bool
    
    class Config:
        from_attributes = True


class AlertSummary(BaseModel):
    """Summary of alerts by severity"""
    total_alerts: int
    critical_count: int
    warning_count: int
    info_count: int
    unacknowledged_count: int
    recent_alerts: List[AlertResponse]
