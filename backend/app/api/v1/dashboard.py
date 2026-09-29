"""
Dashboard endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from datetime import datetime, timedelta
from typing import List

from ...core.database import get_db
from ...core.security import get_current_active_user
from ...models import User, EnergyData, EquipmentStatus, Alert, Equipment
from ...schemas import DashboardStatus, EnergyDataResponse, EquipmentStatusResponse

router = APIRouter()


@router.get("/status", response_model=DashboardStatus)
async def get_system_status(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get current system status for dashboard
    """
    station_id = current_user.station_id or 1
    
    # Get latest energy data
    latest_energy = db.query(EnergyData).filter(
        EnergyData.station_id == station_id
    ).order_by(desc(EnergyData.timestamp)).first()
    
    if not latest_energy:
        raise HTTPException(status_code=404, detail="No energy data available")
    
    # Calculate battery power (discharge - charge)
    battery_power = latest_energy.battery_discharge_kw - latest_energy.battery_charge_kw
    
    # Get daily fuel consumption
    start_of_day = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    daily_fuel = db.query(func.sum(EnergyData.fuel_consumption_liters)).filter(
        EnergyData.station_id == station_id,
        EnergyData.timestamp >= start_of_day
    ).scalar() or 0.0
    
    # Calculate renewable share
    total_gen = latest_energy.total_generation_kw
    renewable_gen = latest_energy.wind_generation_kw
    renewable_share = (renewable_gen / total_gen * 100) if total_gen > 0 else 0.0
    
    # Get daily renewable energy
    daily_renewable = db.query(func.sum(EnergyData.wind_generation_kw)).filter(
        EnergyData.station_id == station_id,
        EnergyData.timestamp >= start_of_day
    ).scalar() or 0.0
    
    # Count active alerts
    active_alerts = db.query(Alert).filter(
        Alert.station_id == station_id,
        Alert.resolved == False
    ).count()
    
    # Determine system status
    critical_alerts = db.query(Alert).filter(
        Alert.station_id == station_id,
        Alert.resolved == False,
        Alert.severity == "critical"
    ).count()
    
    if critical_alerts > 0:
        system_status = "critical"
    elif active_alerts > 5:
        system_status = "warning"
    else:
        system_status = "normal"
    
    # Calculate unmet load
    unmet_load = max(0, latest_energy.total_load_kw - latest_energy.total_generation_kw)
    
    # Determine battery status
    soc = latest_energy.battery_soc_percent or 50.0
    if soc < 20:
        battery_status = "low"
    elif soc > 80:
        battery_status = "full"
    else:
        battery_status = "normal"
    
    return DashboardStatus(
        timestamp=latest_energy.timestamp,
        current_load_kw=latest_energy.total_load_kw,
        diesel_generation_kw=latest_energy.diesel_generation_kw,
        wind_generation_kw=latest_energy.wind_generation_kw,
        total_generation_kw=latest_energy.total_generation_kw,
        battery_power_kw=battery_power,
        battery_soc_percent=soc,
        battery_status=battery_status,
        fuel_consumption_rate_lph=latest_energy.fuel_consumption_liters * 12,  # Estimate per hour
        daily_fuel_consumed_liters=daily_fuel,
        renewable_share_percent=renewable_share,
        daily_renewable_kwh=daily_renewable,
        critical_load_kw=latest_energy.critical_load_kw,
        deferrable_load_kw=latest_energy.deferrable_load_kw,
        unmet_load_kw=unmet_load,
        system_status=system_status,
        active_alerts_count=active_alerts,
        is_simulated=latest_energy.is_simulated
    )


@router.get("/energy-history", response_model=List[EnergyDataResponse])
async def get_energy_history(
    hours: int = 24,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get historical energy data
    """
    station_id = current_user.station_id or 1
    start_time = datetime.utcnow() - timedelta(hours=hours)
    
    energy_data = db.query(EnergyData).filter(
        EnergyData.station_id == station_id,
        EnergyData.timestamp >= start_time
    ).order_by(EnergyData.timestamp).all()
    
    return energy_data


@router.get("/equipment-status", response_model=List[EquipmentStatusResponse])
async def get_equipment_status(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get current status of all equipment
    """
    station_id = current_user.station_id or 1
    
    # Get latest status for each equipment
    subquery = db.query(
        EquipmentStatus.equipment_id,
        func.max(EquipmentStatus.timestamp).label('max_timestamp')
    ).filter(
        EquipmentStatus.station_id == station_id
    ).group_by(EquipmentStatus.equipment_id).subquery()
    
    latest_statuses = db.query(EquipmentStatus).join(
        subquery,
        (EquipmentStatus.equipment_id == subquery.c.equipment_id) &
        (EquipmentStatus.timestamp == subquery.c.max_timestamp)
    ).all()
    
    # Get equipment details
    result = []
    for status in latest_statuses:
        equipment = db.query(Equipment).filter(Equipment.id == status.equipment_id).first()
        if equipment:
            result.append(EquipmentStatusResponse(
                equipment_id=equipment.id,
                equipment_type=equipment.equipment_type,
                equipment_name=equipment.name or equipment.equipment_id,
                timestamp=status.timestamp,
                status=status.status,
                power_output_kw=status.power_output_kw,
                efficiency_percent=status.efficiency_percent,
                temperature_c=status.temperature_c,
                is_simulated=status.is_simulated
            ))
    
    return result
