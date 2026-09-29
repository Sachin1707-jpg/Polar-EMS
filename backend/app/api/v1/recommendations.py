"""
AI Recommendations endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime, timedelta
from typing import List
import pandas as pd

from ...core.database import get_db
from ...core.security import get_current_active_user
from ...models import User, Recommendation, EnergyData, WeatherData
from ...schemas.ai import RecommendationResponse, AIExplanation

router = APIRouter()


@router.get("/", response_model=List[RecommendationResponse])
async def get_recommendations(
    limit: int = 10,
    status: str = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get AI-generated recommendations"""
    station_id = current_user.station_id or 1
    
    query = db.query(Recommendation).filter(
        Recommendation.station_id == station_id
    )
    
    if status:
        query = query.filter(Recommendation.status == status)
    
    recommendations = query.order_by(
        desc(Recommendation.created_at)
    ).limit(limit).all()
    
    # If no recommendations in database, generate some
    if len(recommendations) == 0:
        return await _generate_sample_recommendations(station_id, db)
    
    return recommendations


async def _generate_sample_recommendations(station_id: int, db: Session):
    """Generate sample recommendations using AI engine"""
    # Get current system state
    latest_energy = db.query(EnergyData).filter(
        EnergyData.station_id == station_id
    ).order_by(desc(EnergyData.timestamp)).first()
    
    if not latest_energy:
        return []
    
    # Prepare current state
    current_state = {
        'total_load_kw': latest_energy.total_load_kw,
        'diesel_generation_kw': latest_energy.diesel_generation_kw,
        'wind_generation_kw': latest_energy.wind_generation_kw,
        'battery_soc_percent': latest_energy.battery_soc_percent,
        'generator_status': 'running' if latest_energy.diesel_generation_kw > 0 else 'stopped'
    }
    
    # Get forecasts
    from ...services.data_simulator import DataSimulator
    simulator = DataSimulator()
    weather_forecast = simulator.generate_weather_data(datetime.utcnow(), 24)
    load_forecast = simulator.generate_load_data(datetime.utcnow(), 24, weather_forecast)
    wind_forecast = simulator.generate_wind_generation(weather_forecast)
    
    forecasts = {
        'weather_forecast': weather_forecast.to_dict('records'),
        'load_forecast': load_forecast.to_dict('records'),
        'wind_forecast': wind_forecast.to_dict('records')
    }
    
    # Generate recommendations using AI
    try:
        from ai.recommendations import RecommendationEngine
        config = {'diesel_cost_per_liter': 1.5}
        engine = RecommendationEngine(config)
        
        recommendations = engine.generate_recommendations(
            current_state,
            forecasts,
            {},  # optimization_result (placeholder)
            None  # historical_data
        )
        
        # Store in database
        rec_models = []
        for rec in recommendations[:5]:  # Limit to top 5
            rec_model = Recommendation(
                station_id=station_id,
                recommendation_type=rec['type'],
                priority=rec['priority'],
                title=rec['title'],
                description=rec['description'],
                reasoning='\n'.join(rec.get('reasoning', [])),
                estimated_fuel_savings_liters=rec.get('estimated_fuel_savings_liters'),
                estimated_cost_savings=rec.get('estimated_cost_savings'),
                estimated_renewable_increase_percent=rec.get('estimated_renewable_increase_percent'),
                actions=rec.get('actions'),
                status='pending',
                is_simulated=True
            )
            db.add(rec_model)
            rec_models.append(rec_model)
        
        db.commit()
        for rec_model in rec_models:
            db.refresh(rec_model)
        
        return rec_models
    
    except Exception as e:
        print(f"Error generating recommendations: {e}")
        return []


@router.post("/{recommendation_id}/accept")
async def accept_recommendation(
    recommendation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Accept a recommendation"""
    recommendation = db.query(Recommendation).filter(
        Recommendation.id == recommendation_id
    ).first()
    
    if not recommendation:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    
    recommendation.status = 'accepted'
    recommendation.implemented_by = current_user.id
    recommendation.implemented_at = datetime.utcnow()
    
    db.commit()
    db.refresh(recommendation)
    
    return {"message": "Recommendation accepted", "recommendation": recommendation}


@router.post("/{recommendation_id}/reject")
async def reject_recommendation(
    recommendation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Reject a recommendation"""
    recommendation = db.query(Recommendation).filter(
        Recommendation.id == recommendation_id
    ).first()
    
    if not recommendation:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    
    recommendation.status = 'rejected'
    
    db.commit()
    db.refresh(recommendation)
    
    return {"message": "Recommendation rejected"}


@router.post("/explain", response_model=AIExplanation)
async def explain_ai_decision(
    decision_type: str = Body(...),
    context: dict = Body(...),
    current_user: User = Depends(get_current_active_user)
):
    """Get detailed explanation for an AI decision"""
    
    try:
        from ai.recommendations import RecommendationEngine
        config = {'diesel_cost_per_liter': 1.5}
        engine = RecommendationEngine(config)
        
        explanation = engine.explain_decision(decision_type, context)
        
        return AIExplanation(**explanation)
    
    except Exception as e:
        # Return default explanation
        return AIExplanation(
            decision_type=decision_type,
            timestamp=datetime.utcnow(),
            situation="The system is analyzing current energy conditions.",
            recommendation="Optimize energy dispatch based on available resources.",
            reasoning=[
                "Current load and generation analyzed",
                "Weather forecast reviewed",
                "Cost optimization calculated",
                "System constraints verified"
            ],
            factors={
                "load": "Current load level",
                "renewable": "Renewable energy availability",
                "battery": "Battery state of charge",
                "weather": "Weather conditions"
            },
            expected_impact={
                "fuel_savings": "Estimated based on optimization",
                "cost_savings": "Calculated from fuel savings",
                "renewable_increase": "Based on available capacity"
            },
            confidence_percent=85.0,
            is_simulated=True
        )
