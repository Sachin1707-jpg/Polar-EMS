"""
Configuration management for POLAR-EMS
"""
from typing import List
from pydantic_settings import BaseSettings
from pydantic import validator


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    APP_NAME: str = "POLAR-EMS"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    
    # API
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    
    # Database
    DATABASE_URL: str = "sqlite:///./polar_ems.db"
    
    # Security
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    JWT_SECRET_KEY: str = "dev-jwt-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Weather
    WEATHER_API_KEY: str = ""
    WEATHER_UPDATE_INTERVAL: int = 300  # seconds
    
    # AI/ML
    AI_MODEL_UPDATE_INTERVAL: int = 3600  # seconds
    FORECAST_HORIZON_HOURS: int = 48
    OPTIMIZATION_INTERVAL: int = 900  # seconds (15 minutes)
    
    # Simulation
    SIMULATION_MODE: bool = True
    SIMULATION_SPEED: float = 1.0
    SIMULATION_START_DATE: str = "2026-01-01"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # Twilio SMS Alert Configuration
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""
    TWILIO_RECIPIENT_PHONES: str = ""  # Comma-separated list of recipient phone numbers

    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/polar_ems.log"
    
    @validator("API_CORS_ORIGINS", pre=True)
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
