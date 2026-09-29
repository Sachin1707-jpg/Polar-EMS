"""
AI/ML related models - forecasts, recommendations, optimization
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text, JSON
from sqlalchemy.sql import func
from ..core.database import Base


class Forecast(Base):
    """AI forecast results (load and wind)"""
    __tablename__ = "forecasts"
    
    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    forecast_type = Column(String, nullable=False)  # load, wind_power
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    forecast_time = Column(DateTime(timezone=True), nullable=False, index=True)
    
    predicted_value = Column(Float, nullable=False)
    lower_bound = Column(Float)  # Confidence interval
    upper_bound = Column(Float)  # Confidence interval
    confidence_percent = Column(Float)
    
    # Actual value (filled in after the fact for accuracy tracking)
    actual_value = Column(Float)
    
    # Model info
    model_version = Column(String)
    model_features = Column(JSON)  # Features used for this prediction
    
    is_simulated = Column(Boolean, default=True)


class Recommendation(Base):
    """AI-generated operational recommendations"""
    __tablename__ = "recommendations"
    
    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    recommendation_type = Column(String, nullable=False)  # fuel_saving, load_shifting, maintenance
    priority = Column(String, default="medium")  # low, medium, high, critical
    
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    reasoning = Column(Text)  # AI explanation
    
    # Expected impact
    estimated_fuel_savings_liters = Column(Float)
    estimated_cost_savings = Column(Float)
    estimated_renewable_increase_percent = Column(Float)
    
    # Action items
    actions = Column(JSON)  # List of specific actions to take
    
    # Status tracking
    status = Column(String, default="pending")  # pending, accepted, rejected, implemented
    implemented_at = Column(DateTime(timezone=True))
    implemented_by = Column(Integer, ForeignKey("users.id"))
    
    # Effectiveness tracking
    actual_fuel_savings_liters = Column(Float)
    actual_cost_savings = Column(Float)
    effectiveness_score = Column(Float)  # 0-100
    
    is_simulated = Column(Boolean, default=True)


class OptimizationSchedule(Base):
    """Energy optimization schedules"""
    __tablename__ = "optimization_schedules"
    
    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    valid_from = Column(DateTime(timezone=True), nullable=False, index=True)
    valid_to = Column(DateTime(timezone=True), nullable=False)
    
    # Optimization results
    schedule_data = Column(JSON, nullable=False)  # Detailed schedule for each time step
    
    # Optimization metadata
    optimization_objective = Column(String, default="minimize_fuel")
    total_cost = Column(Float)
    total_fuel_consumption_liters = Column(Float)
    total_renewable_kwh = Column(Float)
    renewable_percentage = Column(Float)
    
    # Solver info
    solver_status = Column(String)  # optimal, feasible, infeasible
    solve_time_seconds = Column(Float)
    
    # Status
    is_active = Column(Boolean, default=False)
    is_simulated = Column(Boolean, default=True)
