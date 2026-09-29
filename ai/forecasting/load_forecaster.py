"""
Load Forecasting using XGBoost
Predicts electricity demand 24-48 hours ahead
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import xgboost as xgb
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import TimeSeriesSplit
import joblib
import logging

logger = logging.getLogger(__name__)


class LoadForecaster:
    """
    Load forecasting model using XGBoost
    
    Features:
    - Historical load data
    - Time features (hour, day of week, month)
    - Weather data (temperature, wind speed)
    - Seasonal patterns
    """
    
    def __init__(self, model_path: Optional[str] = None):
        """Initialize load forecaster"""
        self.model = None
        self.scaler = StandardScaler()
        self.feature_names = []
        self.is_trained = False
        
        if model_path:
            self.load_model(model_path)
    
    def prepare_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Prepare features for load forecasting
        
        Args:
            df: DataFrame with columns [timestamp, load_kw, temperature_c, wind_speed_ms]
        
        Returns:
            DataFrame with engineered features
        """
        features = df.copy()
        
        # Time features
        features['hour'] = features['timestamp'].dt.hour
        features['day_of_week'] = features['timestamp'].dt.dayofweek
        features['day_of_year'] = features['timestamp'].dt.dayofyear
        features['month'] = features['timestamp'].dt.month
        features['is_weekend'] = (features['day_of_week'] >= 5).astype(int)
        
        # Cyclical time encoding
        features['hour_sin'] = np.sin(2 * np.pi * features['hour'] / 24)
        features['hour_cos'] = np.cos(2 * np.pi * features['hour'] / 24)
        features['day_sin'] = np.sin(2 * np.pi * features['day_of_year'] / 365)
        features['day_cos'] = np.cos(2 * np.pi * features['day_of_year'] / 365)
        
        # Lagged load features (if available)
        if 'load_kw' in features.columns:
            features['load_lag_1h'] = features['load_kw'].shift(1)
            features['load_lag_24h'] = features['load_kw'].shift(24)
            features['load_lag_168h'] = features['load_kw'].shift(168)  # 1 week
            
            # Rolling statistics
            features['load_ma_24h'] = features['load_kw'].rolling(window=24, min_periods=1).mean()
            features['load_std_24h'] = features['load_kw'].rolling(window=24, min_periods=1).std()
        
        # Weather features
        if 'temperature_c' in features.columns:
            features['temp_squared'] = features['temperature_c'] ** 2
            features['temp_lag_1h'] = features['temperature_c'].shift(1)
        
        if 'wind_speed_ms' in features.columns:
            features['wind_squared'] = features['wind_speed_ms'] ** 2
        
        # Fill NaN values
        features = features.fillna(method='bfill').fillna(method='ffill').fillna(0)
        
        return features
    
    def train(self, training_data: pd.DataFrame, target_col: str = 'load_kw') -> Dict:
        """
        Train the load forecasting model
        
        Args:
            training_data: DataFrame with historical data
            target_col: Name of target column
        
        Returns:
            Training metrics
        """
        logger.info("Training load forecasting model...")
        
        # Prepare features
        features_df = self.prepare_features(training_data)
        
        # Select feature columns
        feature_cols = [col for col in features_df.columns 
                       if col not in ['timestamp', target_col]]
        
        X = features_df[feature_cols].values
        y = features_df[target_col].values
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Time series cross-validation
        tscv = TimeSeriesSplit(n_splits=5)
        
        # Train XGBoost model
        self.model = xgb.XGBRegressor(
            n_estimators=500,
            max_depth=6,
            learning_rate=0.01,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            objective='reg:squarederror'
        )
        
        # Fit model
        self.model.fit(
            X_scaled, y,
            eval_set=[(X_scaled, y)],
            verbose=False
        )
        
        self.feature_names = feature_cols
        self.is_trained = True
        
        # Calculate training metrics
        train_pred = self.model.predict(X_scaled)
        mape = np.mean(np.abs((y - train_pred) / y)) * 100
        rmse = np.sqrt(np.mean((y - train_pred) ** 2))
        
        metrics = {
            'mape': mape,
            'rmse': rmse,
            'features': self.feature_names,
            'samples': len(X)
        }
        
        logger.info(f"Model trained - MAPE: {mape:.2f}%, RMSE: {rmse:.2f} kW")
        
        return metrics
    
    def predict(
        self,
        historical_data: pd.DataFrame,
        weather_forecast: pd.DataFrame,
        horizon_hours: int = 48
    ) -> pd.DataFrame:
        """
        Predict load for next N hours
        
        Args:
            historical_data: Recent historical data
            weather_forecast: Weather forecast data
            horizon_hours: Forecast horizon in hours
        
        Returns:
            DataFrame with predictions and confidence intervals
        """
        if not self.is_trained:
            raise ValueError("Model not trained. Call train() first or load a trained model.")
        
        # Create future timestamps
        last_timestamp = historical_data['timestamp'].max()
        future_timestamps = pd.date_range(
            start=last_timestamp + timedelta(hours=1),
            periods=horizon_hours,
            freq='H'
        )
        
        # Prepare forecast dataframe
        forecast_df = pd.DataFrame({'timestamp': future_timestamps})
        
        # Merge with weather forecast
        if weather_forecast is not None:
            forecast_df = forecast_df.merge(
                weather_forecast[['timestamp', 'temperature_c', 'wind_speed_ms']],
                on='timestamp',
                how='left'
            )
        
        # Combine historical and forecast data for feature engineering
        combined_df = pd.concat([
            historical_data[['timestamp', 'load_kw', 'temperature_c', 'wind_speed_ms']],
            forecast_df
        ], ignore_index=True)
        
        # Prepare features
        features_df = self.prepare_features(combined_df)
        
        # Get forecast features only
        forecast_features = features_df.iloc[-horizon_hours:][self.feature_names]
        
        # Scale and predict
        X_scaled = self.scaler.transform(forecast_features.values)
        predictions = self.model.predict(X_scaled)
        
        # Estimate confidence intervals (simple approach)
        # In production, use quantile regression or ensemble methods
        std_dev = predictions.std()
        
        result = pd.DataFrame({
            'timestamp': future_timestamps,
            'predicted_load_kw': predictions,
            'lower_bound': predictions - 1.96 * std_dev,  # 95% CI
            'upper_bound': predictions + 1.96 * std_dev,
            'confidence_percent': 95.0
        })
        
        return result
    
    def save_model(self, path: str):
        """Save model to disk"""
        if not self.is_trained:
            raise ValueError("No trained model to save")
        
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'feature_names': self.feature_names,
            'version': '1.0'
        }
        joblib.dump(model_data, path)
        logger.info(f"Model saved to {path}")
    
    def load_model(self, path: str):
        """Load model from disk"""
        model_data = joblib.load(path)
        self.model = model_data['model']
        self.scaler = model_data['scaler']
        self.feature_names = model_data['feature_names']
        self.is_trained = True
        logger.info(f"Model loaded from {path}")
    
    def get_feature_importance(self) -> Dict[str, float]:
        """Get feature importance scores"""
        if not self.is_trained:
            return {}
        
        importance = self.model.feature_importances_
        return dict(zip(self.feature_names, importance))
