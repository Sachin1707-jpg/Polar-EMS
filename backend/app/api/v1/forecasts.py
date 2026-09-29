"""
Forecasting endpoints - Load and wind power predictions
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime, timedelta
from typing import List
import pandas as pd

from ...core.database import get_db
from ...core.security import get_current_active_user
from ...models import User, EnergyData, WeatherData, Forecast
from ...schemas.ai import ForecastResponse, ForecastSeries

router = APIRouter()


@router.get("/load", response_model=ForecastSeries)
async def get_load_forecast(
    hours: int = 48,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get load forecast for next N hours
    Uses AI forecasting model with historical data
    """
    station_id = current_user.station_id or 1
    
    # Get historical data for forecasting
    lookback_hours = 168  # 1 week
    start_time = datetime.utcnow() - timedelta(hours=lookback_hours)
    
    historical = db.query(EnergyData).filter(
        EnergyData.station_id == station_id,
        EnergyData.timestamp >= start_time
    ).order_by(EnergyData.timestamp).all()
    
    if len(historical) < 24:
        raise HTTPException(
            status_code=400,
            detail="Insufficient historical data for forecasting"
        )
    
    # Prepare historical data
    hist_df = pd.DataFrame([{
        'timestamp': record.timestamp,
        'load_kw': record.total_load_kw,
        'temperature_c': 0,  # Would query from WeatherData
        'wind_speed_ms': 0
    } for record in historical])
    
    # Get weather forecast
    from ...services.data_simulator import DataSimulator
    simulator = DataSimulator()
    weather_forecast = simulator.generate_weather_data(datetime.utcnow(), hours)
    
    # Generate load forecast using AI
    try:
        from ai.forecasting import LoadForecaster
        forecaster = LoadForecaster()
        
        # Train on historical data (in production, use pre-trained model)
        forecaster.train(hist_df)
        
        # Generate predictions
        predictions = forecaster.predict(hist_df, weather_forecast, hours)
        
        # Convert to response format
        forecasts = []
        for _, row in predictions.iterrows():
            forecasts.append(ForecastResponse(
                id=0,
                forecast_type='load',
                forecast_time=row['timestamp'],
                predicted_value=float(row['predicted_load_kw']),
                lower_bound=float(row['lower_bound']),
                upper_bound=float(row['upper_bound']),
                confidence_percent=float(row['confidence_percent']),
                is_simulated=True
            ))
        
        return ForecastSeries(
            forecast_type='load',
            created_at=datetime.utcnow(),
            forecasts=forecasts,
            model_version='1.0',
            is_simulated=True
        )
    
    except Exception as e:
        # Fallback to simple simulation
        from ...services.data_simulator import DataSimulator
        simulator = DataSimulator()
        load_data = simulator.generate_load_data(datetime.utcnow(), hours, weather_forecast)
        
        forecasts = []
        for _, row in load_data.iterrows():
            forecasts.append(ForecastResponse(
                id=0,
                forecast_type='load',
                forecast_time=row['timestamp'],
                predicted_value=float(row['total_load_kw']),
                lower_bound=float(row['total_load_kw'] * 0.9),
                upper_bound=float(row['total_load_kw'] * 1.1),
                confidence_percent=85.0,
                is_simulated=True
            ))
        
        return ForecastSeries(
            forecast_type='load',
            created_at=datetime.utcnow(),
            forecasts=forecasts,
            model_version='simulated',
            is_simulated=True
        )


@router.get("/wind", response_model=ForecastSeries)
async def get_wind_forecast(
    hours: int = 48,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get wind power forecast for next N hours"""
    station_id = current_user.station_id or 1
    
    # Get weather forecast
    from ...services.data_simulator import DataSimulator
    simulator = DataSimulator()
    weather_forecast = simulator.generate_weather_data(datetime.utcnow(), hours)
    
    # Generate wind power forecast
    try:
        from ai.forecasting import WindForecaster
        forecaster = WindForecaster()
        predictions = forecaster.predict(weather_forecast)
        
        forecasts = []
        for _, row in predictions.iterrows():
            forecasts.append(ForecastResponse(
                id=0,
                forecast_type='wind_power',
                forecast_time=row['timestamp'],
                predicted_value=float(row['predicted_power_kw']),
                lower_bound=float(row['lower_bound']),
                upper_bound=float(row['upper_bound']),
                confidence_percent=float(row['confidence_percent']),
                is_simulated=True
            ))
        
        return ForecastSeries(
            forecast_type='wind_power',
            created_at=datetime.utcnow(),
            forecasts=forecasts,
            model_version='1.0',
            is_simulated=True
        )
    
    except Exception as e:
        # Fallback
        wind_gen = simulator.generate_wind_generation(weather_forecast)
        
        forecasts = []
        for _, row in wind_gen.iterrows():
            forecasts.append(ForecastResponse(
                id=0,
                forecast_type='wind_power',
                forecast_time=row['timestamp'],
                predicted_value=float(row['wind_generation_kw']),
                lower_bound=float(row['wind_generation_kw'] * 0.8),
                upper_bound=float(row['wind_generation_kw'] * 1.2),
                confidence_percent=90.0,
                is_simulated=True
            ))
        
        return ForecastSeries(
            forecast_type='wind_power',
            created_at=datetime.utcnow(),
            forecasts=forecasts,
            model_version='simulated',
            is_simulated=True
        )


@router.get("/accuracy")
async def get_forecast_accuracy(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get forecast accuracy metrics"""
    # In production, calculate actual vs predicted
    return {
        "load_forecast": {
            "mape_percent": 12.5,
            "rmse_kw": 5.2,
            "samples": 168,
            "last_updated": datetime.utcnow().isoformat()
        },
        "wind_forecast": {
            "mape_percent": 15.8,
            "rmse_kw": 8.1,
            "samples": 168,
            "last_updated": datetime.utcnow().isoformat()
        },
        "is_simulated": True
    }
