"""
Weather endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime, timedelta
from typing import List

from ...core.database import get_db
from ...core.security import get_current_active_user
from ...models import User, WeatherData
from ...schemas.energy import WeatherDataResponse

router = APIRouter()


@router.get("/current", response_model=WeatherDataResponse)
async def get_current_weather(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current weather conditions"""
    station_id = current_user.station_id or 1
    
    weather = db.query(WeatherData).filter(
        WeatherData.station_id == station_id,
        WeatherData.is_forecast == False
    ).order_by(desc(WeatherData.timestamp)).first()
    
    if not weather:
        raise HTTPException(status_code=404, detail="No weather data available")
    
    return weather


@router.get("/forecast", response_model=List[WeatherDataResponse])
async def get_weather_forecast(
    hours: int = 48,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get weather forecast"""
    station_id = current_user.station_id or 1
    start_time = datetime.utcnow()
    
    # Generate forecast using simulation
    from ...services.data_simulator import DataSimulator
    simulator = DataSimulator()
    forecast_data = simulator.generate_weather_data(start_time, hours)
    
    # Convert to response models
    forecasts = []
    for _, row in forecast_data.iterrows():
        forecasts.append(WeatherDataResponse(
            timestamp=row['timestamp'],
            temperature_c=row['temperature_c'],
            wind_speed_ms=row['wind_speed_ms'],
            wind_direction_deg=row.get('wind_direction_deg', 0),
            humidity_percent=row.get('humidity_percent', 75),
            pressure_hpa=row.get('pressure_hpa', 1013),
            condition=row.get('condition', 'clear'),
            is_forecast=True
        ))
    
    return forecasts


@router.get("/history", response_model=List[WeatherDataResponse])
async def get_weather_history(
    hours: int = 24,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get historical weather data"""
    station_id = current_user.station_id or 1
    start_time = datetime.utcnow() - timedelta(hours=hours)
    
    weather_history = db.query(WeatherData).filter(
        WeatherData.station_id == station_id,
        WeatherData.timestamp >= start_time,
        WeatherData.is_forecast == False
    ).order_by(WeatherData.timestamp).all()
    
    return weather_history
