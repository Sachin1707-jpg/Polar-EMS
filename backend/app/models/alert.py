"""
Alert and notification models
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text, JSON, Float
from sqlalchemy.sql import func
from ..core.database import Base


class Alert(Base):
    """Active alerts"""
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    alert_type = Column(String, nullable=False)  # equipment_failure, low_fuel, high_load, weather_warning
    severity = Column(String, nullable=False)  # info, warning, critical
    
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    
    # Source
    source_type = Column(String)  # equipment, ai, weather, manual
    source_id = Column(String)  # Equipment ID or source identifier
    
    # Alert details
    details = Column(JSON)  # Additional context data
    
    # Response tracking
    acknowledged = Column(Boolean, default=False)
    acknowledged_at = Column(DateTime(timezone=True))
    acknowledged_by = Column(Integer, ForeignKey("users.id"))
    
    resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime(timezone=True))
    resolved_by = Column(Integer, ForeignKey("users.id"))
    resolution_notes = Column(Text)
    
    # Notification
    notification_sent = Column(Boolean, default=False)
    notification_channels = Column(JSON)  # email, sms, dashboard
    
    is_simulated = Column(Boolean, default=True)


class AlertHistory(Base):
    """Historical alerts (archived)"""
    __tablename__ = "alert_history"
    
    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, nullable=False, index=True)
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), nullable=False)
    resolved_at = Column(DateTime(timezone=True))
    
    alert_type = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    
    # Response metrics
    response_time_seconds = Column(Float)  # Time to acknowledgment
    resolution_time_seconds = Column(Float)  # Time to resolution
    
    # Archive
    archived_at = Column(DateTime(timezone=True), server_default=func.now())
    is_simulated = Column(Boolean, default=True)
