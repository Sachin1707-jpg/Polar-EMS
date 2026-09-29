"""
Alert management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from datetime import datetime, timedelta
from typing import List

from ...core.database import get_db
from ...core.security import get_current_active_user
from ...models import User, Alert
from ...schemas.alert import AlertResponse, AlertSummary, AlertCreate

router = APIRouter()


@router.get("/active", response_model=List[AlertResponse])
async def get_active_alerts(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all active (unresolved) alerts"""
    station_id = current_user.station_id or 1
    
    alerts = db.query(Alert).filter(
        Alert.station_id == station_id,
        Alert.resolved == False
    ).order_by(
        desc(Alert.severity),
        desc(Alert.created_at)
    ).all()
    
    return alerts


@router.get("/history", response_model=List[AlertResponse])
async def get_alert_history(
    days: int = 7,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get alert history"""
    station_id = current_user.station_id or 1
    start_time = datetime.utcnow() - timedelta(days=days)
    
    alerts = db.query(Alert).filter(
        Alert.station_id == station_id,
        Alert.created_at >= start_time
    ).order_by(desc(Alert.created_at)).limit(100).all()
    
    return alerts


@router.get("/summary", response_model=AlertSummary)
async def get_alert_summary(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get alert summary statistics"""
    station_id = current_user.station_id or 1
    
    # Count active alerts by severity
    total = db.query(Alert).filter(
        Alert.station_id == station_id,
        Alert.resolved == False
    ).count()
    
    critical = db.query(Alert).filter(
        Alert.station_id == station_id,
        Alert.resolved == False,
        Alert.severity == 'critical'
    ).count()
    
    warning = db.query(Alert).filter(
        Alert.station_id == station_id,
        Alert.resolved == False,
        Alert.severity == 'warning'
    ).count()
    
    info = db.query(Alert).filter(
        Alert.station_id == station_id,
        Alert.resolved == False,
        Alert.severity == 'info'
    ).count()
    
    unacknowledged = db.query(Alert).filter(
        Alert.station_id == station_id,
        Alert.resolved == False,
        Alert.acknowledged == False
    ).count()
    
    # Get recent alerts
    recent = db.query(Alert).filter(
        Alert.station_id == station_id
    ).order_by(desc(Alert.created_at)).limit(5).all()
    
    return AlertSummary(
        total_alerts=total,
        critical_count=critical,
        warning_count=warning,
        info_count=info,
        unacknowledged_count=unacknowledged,
        recent_alerts=recent
    )


@router.post("/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Acknowledge an alert"""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.acknowledged = True
    alert.acknowledged_at = datetime.utcnow()
    alert.acknowledged_by = current_user.id
    
    db.commit()
    db.refresh(alert)
    
    return {"message": "Alert acknowledged", "alert": alert}


@router.post("/{alert_id}/resolve")
async def resolve_alert(
    alert_id: int,
    notes: str = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Resolve an alert"""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.resolved = True
    alert.resolved_at = datetime.utcnow()
    alert.resolved_by = current_user.id
    alert.resolution_notes = notes
    
    db.commit()
    db.refresh(alert)
    
    return {"message": "Alert resolved", "alert": alert}


@router.post("/", response_model=AlertResponse)
async def create_alert(
    alert_data: AlertCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new alert (manual)"""
    station_id = current_user.station_id or 1
    
    alert = Alert(
        station_id=station_id,
        **alert_data.dict(),
        is_simulated=False
    )
    
    db.add(alert)
    db.commit()
    db.refresh(alert)
    
    return alert
