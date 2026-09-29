"""
Forecasting module - Load and wind power prediction
"""
from .load_forecaster import LoadForecaster
from .wind_forecaster import WindForecaster

__all__ = ["LoadForecaster", "WindForecaster"]
