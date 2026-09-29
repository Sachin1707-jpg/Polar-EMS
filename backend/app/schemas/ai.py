"""
AI/ML schemas
"""
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class ForecastResponse(BaseModel):
    """Schema for forecast response"""
    id: int
    forecast_type: str
    forecast_time: datetime
    predicted_value: float
    lower_bound: Optional[float]
    upper_bound: Optional[float]
    confidence_percent: Optional[float]
    is_simulated: bool
    
    class Config:
        from_attributes = True


class ForecastSeries(BaseModel):
    """Schema for series of forecasts"""
    model_config = {'protected_namespaces': (), 'from_attributes': True}
    forecast_type: str
    created_at: datetime
    forecasts: List[ForecastResponse]
    model_version: Optional[str]
    is_simulated: bool = True


class RecommendationResponse(BaseModel):
    """Schema for recommendation response"""
    id: int
    created_at: datetime
    recommendation_type: str
    priority: str
    title: str
    description: str
    reasoning: Optional[str]
    
    # Impact estimates
    estimated_fuel_savings_liters: Optional[float]
    estimated_cost_savings: Optional[float]
    estimated_renewable_increase_percent: Optional[float]
    
    # Actions
    actions: Optional[List[Dict[str, Any]]]
    
    # Status
    status: str
    is_simulated: bool
    
    class Config:
        from_attributes = True


class OptimizationScheduleResponse(BaseModel):
    """Schema for optimization schedule"""
    id: int
    created_at: datetime
    valid_from: datetime
    valid_to: datetime
    
    # Results summary
    total_fuel_consumption_liters: Optional[float]
    renewable_percentage: Optional[float]
    total_cost: Optional[float]
    
    # Status
    is_active: bool
    solver_status: Optional[str]
    is_simulated: bool
    
    class Config:
        from_attributes = True


class OptimizationScheduleDetail(BaseModel):
    """Detailed optimization schedule with time series data"""
    id: int
    created_at: datetime
    valid_from: datetime
    valid_to: datetime
    schedule_data: Dict[str, Any]
    
    # Metadata
    optimization_objective: str
    total_fuel_consumption_liters: Optional[float]
    renewable_percentage: Optional[float]
    solver_status: Optional[str]
    solve_time_seconds: Optional[float]
    
    is_active: bool
    is_simulated: bool
    
    class Config:
        from_attributes = True


class AIExplanation(BaseModel):
    """Schema for AI decision explanation"""
    decision_type: str
    timestamp: datetime
    
    # What happened
    situation: str
    
    # What AI recommended
    recommendation: str
    
    # Why AI made this decision
    reasoning: List[str]
    
    # Key factors
    factors: Dict[str, Any]
    
    # Expected impact
    expected_impact: Dict[str, Any]
    
    # Confidence
    confidence_percent: float
    
    is_simulated: bool = True
